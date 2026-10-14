// CRUD de animales.
const db = require('../db');
const { validarAnimal } = require('../validators/animal');

// GET /animales: solo activos, con filtros opcionales
exports.listar = (req, res) => {
  const { nombre, especie, sexo, raza, estado } = req.query;

  let sql = 'SELECT * FROM animales WHERE activo = 1';
  const params = [];

  if (nombre) {
    sql += ' AND LOWER(nombre) LIKE ?';
    params.push(`%${nombre.toLowerCase()}%`);
  }
  if (especie) {
    sql += ' AND especie = ?';
    params.push(especie);
  }
  if (sexo) {
    sql += ' AND sexo = ?';
    params.push(sexo);
  }
  if (raza) {
    sql += ' AND LOWER(raza) LIKE ?';
    params.push(`%${raza.toLowerCase()}%`);
  }
  if (estado) {
    sql += ' AND estado = ?';
    params.push(estado);
  }

  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
};

// GET /animales/:id: también devuelve los retirados (activo = 0)
exports.detalle = (req, res) => {
  const animal = db.prepare('SELECT * FROM animales WHERE id = ?').get(req.params.id);
  if (!animal) {
    return res.status(404).json({ error: 'Animal no encontrado' });
  }
  res.json(animal);
};

// POST /animales (fundación)
exports.crear = (req, res) => {
  const error = validarAnimal(req.body);
  if (error) return res.status(400).json({ error });

  const a = req.body;
  const info = db.prepare(`
    INSERT INTO animales (nombre, especie, especie_otra, raza, edad, sexo, descripcion,
      personalidad, bueno_con_ninos, bueno_con_perros, bueno_con_gatos, foto, estado, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', date('now'))
  `).run(
    a.nombre, a.especie, a.especie === 'otro' ? a.especie_otra : null, a.raza || null,
    a.edad, a.sexo, a.descripcion || null, a.personalidad || null,
    a.bueno_con_ninos ?? null, a.bueno_con_perros ?? null, a.bueno_con_gatos ?? null,
    a.foto || null
  );

  const nuevo = db.prepare('SELECT * FROM animales WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(nuevo);
};

// PUT /animales/:id (fundación)
exports.editar = (req, res) => {
  const existe = db.prepare('SELECT * FROM animales WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Animal no encontrado' });

  const error = validarAnimal(req.body);
  if (error) return res.status(400).json({ error });

  const a = req.body;
  db.prepare(`
    UPDATE animales SET nombre = ?, especie = ?, especie_otra = ?, raza = ?, edad = ?,
      sexo = ?, descripcion = ?, personalidad = ?, bueno_con_ninos = ?,
      bueno_con_perros = ?, bueno_con_gatos = ?, foto = ?
    WHERE id = ?
  `).run(
    a.nombre, a.especie, a.especie === 'otro' ? a.especie_otra : null, a.raza || null,
    a.edad, a.sexo, a.descripcion || null, a.personalidad || null,
    a.bueno_con_ninos ?? null, a.bueno_con_perros ?? null, a.bueno_con_gatos ?? null,
    a.foto || null, req.params.id
  );

  res.json(db.prepare('SELECT * FROM animales WHERE id = ?').get(req.params.id));
};

// DELETE /animales/:id (fundación): no borra, solo retira (activo = 0)
exports.retirar = (req, res) => {
  const existe = db.prepare('SELECT * FROM animales WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Animal no encontrado' });

  db.prepare('UPDATE animales SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
};
