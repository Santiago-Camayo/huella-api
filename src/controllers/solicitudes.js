// Solicitudes de adopción y cambios de estado.
const db = require('../db');

// Consulta base: incluye el nombre del animal y del adoptante
const SQL_SOLICITUDES = `
  SELECT s.*, a.nombre AS animal_nombre, a.especie AS animal_especie,
         u.nombre AS usuario_nombre, u.correo AS usuario_correo
  FROM solicitudes s
  JOIN animales a ON a.id = s.animal_id
  JOIN usuarios u ON u.id = s.usuario_id
`;

// Transiciones permitidas: estado actual -> { nuevo estado: quién puede hacerlo }
// (versión corta: falta "finalizada")
const TRANSICIONES = {
  pendiente:   { en_revision: 'fundacion', rechazada: 'fundacion', cancelada: 'dueno' },
  en_revision: { aprobada: 'fundacion', rechazada: 'fundacion', cancelada: 'dueno' },
  aprobada:    { rechazada: 'fundacion', cancelada: 'dueno' },
};

// POST /solicitudes (adoptante). El usuario sale del token, nunca del cuerpo.
exports.crear = (req, res) => {
  const { animal_id, comentario } = req.body;

  if (!animal_id) {
    return res.status(400).json({ error: 'Falta animal_id' });
  }
  const texto = typeof comentario === 'string' ? comentario.trim() : '';
  if (texto.length < 10 || texto.length > 500) {
    return res.status(400).json({ error: 'El comentario debe tener entre 10 y 500 caracteres' });
  }

  const animal = db.prepare('SELECT * FROM animales WHERE id = ?').get(animal_id);
  if (!animal) {
    return res.status(404).json({ error: 'Animal no encontrado' });
  }

  // Apartado, adoptado o retirado no reciben solicitudes
  if (animal.activo === 0 || animal.estado !== 'disponible') {
    return res.status(409).json({ error: 'El animal no está disponible para adopción' });
  }

  // El adoptante no puede tener otra solicitud activa para este animal
  const duplicada = db.prepare(`
    SELECT id FROM solicitudes
    WHERE animal_id = ? AND usuario_id = ?
      AND estado IN ('pendiente', 'en_revision', 'aprobada')
  `).get(animal_id, req.usuario.id);
  if (duplicada) {
    return res.status(409).json({ error: 'Ya tienes una solicitud activa para este animal' });
  }

  // Estado y fecha los fija el servidor
  const info = db.prepare(`
    INSERT INTO solicitudes (animal_id, usuario_id, fecha, estado, comentario)
    VALUES (?, ?, date('now'), 'pendiente', ?)
  `).run(animal_id, req.usuario.id, texto);

  res.status(201).json(db.prepare(`${SQL_SOLICITUDES} WHERE s.id = ?`).get(info.lastInsertRowid));
};

// GET /solicitudes: el adoptante ve las suyas; la fundación ve todas
exports.listar = (req, res) => {
  const { estado, animalId, usuarioId } = req.query;

  let sql = `${SQL_SOLICITUDES} WHERE 1 = 1`;
  const params = [];

  if (req.usuario.rol === 'adoptante') {
    sql += ' AND s.usuario_id = ?';
    params.push(req.usuario.id);
  } else if (usuarioId) {
    sql += ' AND s.usuario_id = ?';
    params.push(usuarioId);
  }

  if (estado) {
    sql += ' AND s.estado = ?';
    params.push(estado);
  }
  if (animalId) {
    sql += ' AND s.animal_id = ?';
    params.push(animalId);
  }

  sql += ' ORDER BY s.id DESC';
  res.json(db.prepare(sql).all(...params));
};

// GET /solicitudes/:id: solo el dueño o la fundación
exports.detalle = (req, res) => {
  const solicitud = db.prepare(`${SQL_SOLICITUDES} WHERE s.id = ?`).get(req.params.id);

  if (!solicitud) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }
  if (req.usuario.rol === 'adoptante' && solicitud.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No puedes ver esta solicitud' });
  }

  res.json(solicitud);
};

// PATCH /solicitudes/:id/estado
exports.cambiarEstado = (req, res) => {
  const { estado: nuevo } = req.body;
  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

  const esFundacion = req.usuario.rol === 'fundacion';
  const esDueno = req.usuario.rol === 'adoptante' && solicitud.usuario_id === req.usuario.id;

  const quien = (TRANSICIONES[solicitud.estado] || {})[nuevo];
  if (!quien) {
    return res.status(409).json({ error: `No se puede pasar de ${solicitud.estado} a ${nuevo}` });
  }
  if (quien === 'fundacion' && !esFundacion) {
    return res.status(403).json({ error: 'Solo la fundación puede hacer este cambio' });
  }
  if (quien === 'dueno' && !esDueno) {
    return res.status(403).json({ error: 'Solo el adoptante dueño puede cancelar' });
  }

  const animal = db.prepare('SELECT * FROM animales WHERE id = ?').get(solicitud.animal_id);

  // Aprobar: el animal debe estar disponible y activo, y no puede haber otra aprobada
  if (nuevo === 'aprobada') {
    if (animal.activo === 0 || animal.estado !== 'disponible') {
      return res.status(409).json({ error: 'El animal no está disponible para aprobar' });
    }
    const otraAprobada = db.prepare(
      "SELECT id FROM solicitudes WHERE animal_id = ? AND estado = 'aprobada' AND id != ?"
    ).get(animal.id, solicitud.id);
    if (otraAprobada) {
      return res.status(409).json({ error: 'Ya hay una solicitud aprobada para este animal' });
    }
  }

  // Cambio de la solicitud y del animal en una sola operación
  db.transaction(() => {
    db.prepare('UPDATE solicitudes SET estado = ? WHERE id = ?').run(nuevo, solicitud.id);

    if (nuevo === 'aprobada') {
      db.prepare("UPDATE animales SET estado = 'apartado' WHERE id = ?").run(animal.id);
    }
    // Si se rechaza o cancela una solicitud aprobada, el animal vuelve a disponible
    if (solicitud.estado === 'aprobada' && (nuevo === 'rechazada' || nuevo === 'cancelada')) {
      db.prepare("UPDATE animales SET estado = 'disponible' WHERE id = ?").run(animal.id);
    }
  })();

  res.json(db.prepare(`${SQL_SOLICITUDES} WHERE s.id = ?`).get(solicitud.id));
};
