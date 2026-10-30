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

// Devuelve una solicitud con los datos del animal y del adoptante (o undefined)
async function buscarSolicitud(id) {
  const { rows } = await db.query(`${SQL_SOLICITUDES} WHERE s.id = $1`, [id]);
  return rows[0];
}

// POST /solicitudes (adoptante). El usuario sale del token, nunca del cuerpo.
exports.crear = async (req, res) => {
  const { animal_id, comentario } = req.body;

  if (!animal_id) {
    return res.status(400).json({ error: 'Falta animal_id' });
  }
  const texto = typeof comentario === 'string' ? comentario.trim() : '';
  if (texto.length < 10 || texto.length > 500) {
    return res.status(400).json({ error: 'El comentario debe tener entre 10 y 500 caracteres' });
  }

  const { rows: [animal] } = await db.query('SELECT * FROM animales WHERE id = $1', [animal_id]);
  if (!animal) {
    return res.status(404).json({ error: 'Animal no encontrado' });
  }

  // Apartado, adoptado o retirado no reciben solicitudes
  if (!animal.activo || animal.estado !== 'disponible') {
    return res.status(409).json({ error: 'El animal no está disponible para adopción' });
  }

  // El adoptante no puede tener otra solicitud activa para este animal
  const { rows: duplicada } = await db.query(
    `SELECT id FROM solicitudes
     WHERE animal_id = $1 AND usuario_id = $2
       AND estado IN ('pendiente', 'en_revision', 'aprobada')`,
    [animal_id, req.usuario.id]
  );
  if (duplicada.length > 0) {
    return res.status(409).json({ error: 'Ya tienes una solicitud activa para este animal' });
  }

  // Estado y fecha los fija el servidor
  const { rows: [nueva] } = await db.query(
    `INSERT INTO solicitudes (animal_id, usuario_id, comentario)
     VALUES ($1, $2, $3) RETURNING id`,
    [animal_id, req.usuario.id, texto]
  );

  res.status(201).json(await buscarSolicitud(nueva.id));
};

// GET /solicitudes: el adoptante ve las suyas; la fundación ve todas
exports.listar = async (req, res) => {
  const { estado, animalId, usuarioId } = req.query;

  let sql = `${SQL_SOLICITUDES} WHERE TRUE`;
  const params = [];
  // Agrega una condición con su parámetro ($1, $2, ...)
  const filtrar = (condicion, valor) => {
    params.push(valor);
    sql += ` AND ${condicion} = $${params.length}`;
  };

  if (req.usuario.rol === 'adoptante') {
    filtrar('s.usuario_id', req.usuario.id);
  } else if (usuarioId) {
    filtrar('s.usuario_id', usuarioId);
  }
  if (estado) filtrar('s.estado', estado);
  if (animalId) filtrar('s.animal_id', animalId);

  sql += ' ORDER BY s.id DESC';
  const { rows } = await db.query(sql, params);
  res.json(rows);
};

// GET /solicitudes/:id: solo el dueño o la fundación
exports.detalle = async (req, res) => {
  const solicitud = await buscarSolicitud(req.params.id);

  if (!solicitud) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }
  if (req.usuario.rol === 'adoptante' && solicitud.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No puedes ver esta solicitud' });
  }

  res.json(solicitud);
};

// PATCH /solicitudes/:id/estado
exports.cambiarEstado = async (req, res) => {
  const { estado: nuevo } = req.body;
  const { rows: [solicitud] } = await db.query('SELECT * FROM solicitudes WHERE id = $1', [req.params.id]);
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

  const { rows: [animal] } = await db.query('SELECT * FROM animales WHERE id = $1', [solicitud.animal_id]);

  // Aprobar: el animal debe estar disponible y activo, y no puede haber otra aprobada
  if (nuevo === 'aprobada') {
    if (!animal.activo || animal.estado !== 'disponible') {
      return res.status(409).json({ error: 'El animal no está disponible para aprobar' });
    }
    const { rows: otraAprobada } = await db.query(
      "SELECT id FROM solicitudes WHERE animal_id = $1 AND estado = 'aprobada' AND id != $2",
      [animal.id, solicitud.id]
    );
    if (otraAprobada.length > 0) {
      return res.status(409).json({ error: 'Ya hay una solicitud aprobada para este animal' });
    }
  }

  // Cambio de la solicitud y del animal en una sola transacción
  const cliente = await db.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('UPDATE solicitudes SET estado = $1 WHERE id = $2', [nuevo, solicitud.id]);

    if (nuevo === 'aprobada') {
      await cliente.query("UPDATE animales SET estado = 'apartado' WHERE id = $1", [animal.id]);
    }
    // Si se rechaza o cancela una solicitud aprobada, el animal vuelve a disponible
    if (solicitud.estado === 'aprobada' && (nuevo === 'rechazada' || nuevo === 'cancelada')) {
      await cliente.query("UPDATE animales SET estado = 'disponible' WHERE id = $1", [animal.id]);
    }
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }

  res.json(await buscarSolicitud(solicitud.id));
};
