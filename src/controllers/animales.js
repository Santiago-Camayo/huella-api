// CRUD de animales.
const db = require('../db');
const { validarAnimal } = require('../validators/animal');

// Consulta base: incluye el nombre y la ciudad de la fundación
const SQL_ANIMALES = `
  SELECT a.*, f.nombre AS fundacion_nombre, f.ciudad AS fundacion_ciudad
  FROM animales a
  JOIN fundaciones f ON f.id = a.fundacion_id
`;

// GET /animales: solo activos, con filtros opcionales
exports.listar = async (req, res) => {
  const { nombre, especie, sexo, raza, estado } = req.query;

  let sql = `${SQL_ANIMALES} WHERE a.activo = TRUE`;
  const params = [];
  // Agrega una condición con su parámetro ($1, $2, ...)
  const filtrar = (condicion, valor) => {
    params.push(valor);
    sql += ` AND ${condicion.replace('?', `$${params.length}`)}`;
  };

  if (nombre) filtrar('a.nombre ILIKE ?', `%${nombre}%`);
  if (especie) filtrar('a.especie = ?', especie);
  if (sexo) filtrar('a.sexo = ?', sexo);
  if (raza) filtrar('a.raza ILIKE ?', `%${raza}%`);
  if (estado) filtrar('a.estado = ?', estado);

  sql += ' ORDER BY a.nombre';
  const { rows } = await db.query(sql, params);
  res.json(rows);
};

// GET /animales/:id: también devuelve los retirados (activo = false)
exports.detalle = async (req, res) => {
  const { rows } = await db.query(`${SQL_ANIMALES} WHERE a.id = $1`, [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Animal no encontrado' });
  }
  res.json(rows[0]);
};

// POST /animales (fundación). La fundación sale del token.
exports.crear = async (req, res) => {
  const error = validarAnimal(req.body);
  if (error) return res.status(400).json({ error });
  // Todo animal se publica con foto (por ahora llega como URL; la subida de archivos es del Sprint 2)
  if (!req.body.foto) return res.status(400).json({ error: 'La foto es obligatoria' });

  const a = req.body;
  const { rows: [nuevo] } = await db.query(
    `INSERT INTO animales (nombre, especie, especie_otra, raza, edad, sexo, descripcion,
       personalidad, bueno_con_ninos, bueno_con_perros, bueno_con_gatos, foto, fundacion_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [
      a.nombre, a.especie, a.especie === 'otro' ? a.especie_otra : null, a.raza || null,
      a.edad, a.sexo, a.descripcion || null, a.personalidad || null,
      a.bueno_con_ninos ?? null, a.bueno_con_perros ?? null, a.bueno_con_gatos ?? null,
      a.foto, req.usuario.fundacion_id,
    ]
  );

  const { rows } = await db.query(`${SQL_ANIMALES} WHERE a.id = $1`, [nuevo.id]);
  res.status(201).json(rows[0]);
};

// PUT /animales/:id (fundación). Si no llega foto, se conserva la actual.
exports.editar = async (req, res) => {
  const { rows: existe } = await db.query('SELECT id FROM animales WHERE id = $1', [req.params.id]);
  if (existe.length === 0) return res.status(404).json({ error: 'Animal no encontrado' });

  const error = validarAnimal(req.body);
  if (error) return res.status(400).json({ error });

  const a = req.body;
  await db.query(
    `UPDATE animales SET nombre = $1, especie = $2, especie_otra = $3, raza = $4, edad = $5,
       sexo = $6, descripcion = $7, personalidad = $8, bueno_con_ninos = $9,
       bueno_con_perros = $10, bueno_con_gatos = $11, foto = COALESCE($12, foto)
     WHERE id = $13`,
    [
      a.nombre, a.especie, a.especie === 'otro' ? a.especie_otra : null, a.raza || null,
      a.edad, a.sexo, a.descripcion || null, a.personalidad || null,
      a.bueno_con_ninos ?? null, a.bueno_con_perros ?? null, a.bueno_con_gatos ?? null,
      a.foto || null, req.params.id,
    ]
  );

  const { rows } = await db.query(`${SQL_ANIMALES} WHERE a.id = $1`, [req.params.id]);
  res.json(rows[0]);
};

// DELETE /animales/:id (fundación): no borra, solo retira (activo = false)
exports.retirar = async (req, res) => {
  const { rowCount } = await db.query('UPDATE animales SET activo = FALSE WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Animal no encontrado' });

  res.status(204).end();
};
