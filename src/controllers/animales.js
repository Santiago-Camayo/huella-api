// CRUD de animales.
const db = require('../db');
const { validarAnimal } = require('../validators/animal');
const { subirFoto } = require('../db/storage');

// Consulta base: incluye el nombre y la ciudad de la fundación
const SQL_ANIMALES = `
  SELECT a.*, f.nombre AS fundacion_nombre, f.ciudad AS fundacion_ciudad
  FROM animales a
  JOIN fundaciones f ON f.id = a.fundacion_id
`;

// RN-18: una fundación solo modifica sus propios animales.
// Responde 404 o 403 y devuelve false si no puede seguir.
async function esDeMiFundacion(req, res) {
  const { rows: [animal] } = await db.query('SELECT fundacion_id FROM animales WHERE id = $1', [req.params.id]);
  if (!animal) {
    res.status(404).json({ error: 'Animal no encontrado' });
    return false;
  }
  if (animal.fundacion_id !== req.usuario.fundacion_id) {
    res.status(403).json({ error: 'Este animal no es de tu fundación' });
    return false;
  }
  return true;
}

// GET /animales con filtros opcionales.
// El adoptante ve los activos de todas las fundaciones (puede filtrar por fundacionId).
// La fundación ve solo los suyos, también los retirados (HU-16); estado=retirado muestra solo esos.
exports.listar = async (req, res) => {
  const { nombre, especie, sexo, raza, estado, fundacionId } = req.query;

  let sql = `${SQL_ANIMALES} WHERE TRUE`;
  const params = [];
  // Agrega una condición con su parámetro ($1, $2, ...)
  const filtrar = (condicion, valor) => {
    params.push(valor);
    sql += ` AND ${condicion.replace('?', `$${params.length}`)}`;
  };

  if (req.usuario.rol === 'fundacion') {
    filtrar('a.fundacion_id = ?', req.usuario.fundacion_id);
  } else {
    sql += ' AND a.activo = TRUE';
    if (fundacionId) filtrar('a.fundacion_id = ?', fundacionId);
  }
  if (nombre) filtrar('a.nombre ILIKE ?', `%${nombre}%`);
  if (especie) filtrar('a.especie = ?', especie);
  if (sexo) filtrar('a.sexo = ?', sexo);
  if (raza) filtrar('a.raza ILIKE ?', `%${raza}%`);
  if (estado === 'retirado') {
    sql += ' AND a.activo = FALSE';
  } else if (estado) {
    filtrar('a.estado = ?', estado);
    sql += ' AND a.activo = TRUE';
  }

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

// En multipart todo llega como texto: convierte la edad y los "bueno_con_*" a su tipo.
// Con JSON los valores ya vienen bien y quedan igual.
function leerFormulario(cuerpo = {}) {
  const siNo = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null);
  return {
    ...cuerpo,
    edad: typeof cuerpo.edad === 'string' && cuerpo.edad.trim() !== '' ? Number(cuerpo.edad) : cuerpo.edad,
    bueno_con_ninos: siNo(cuerpo.bueno_con_ninos),
    bueno_con_perros: siNo(cuerpo.bueno_con_perros),
    bueno_con_gatos: siNo(cuerpo.bueno_con_gatos),
  };
}

// POST /animales (fundación), multipart con la foto obligatoria (HU-17). La fundación sale del token.
exports.crear = async (req, res) => {
  const a = leerFormulario(req.body);
  const error = validarAnimal(a);
  if (error) return res.status(400).json({ error });
  if (!req.file) return res.status(400).json({ error: 'La foto es obligatoria' });

  // Se valida antes de subir para no dejar fotos sueltas en Storage
  a.foto = await subirFoto(req.file);
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

// PUT /animales/:id (fundación dueña). Si no llega foto, se conserva la actual.
exports.editar = async (req, res) => {
  if (!(await esDeMiFundacion(req, res))) return;

  const a = leerFormulario(req.body);
  const error = validarAnimal(a);
  if (error) return res.status(400).json({ error });

  a.foto = req.file ? await subirFoto(req.file) : null;
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

// DELETE /animales/:id (fundación dueña): no borra, solo retira (activo = false)
exports.retirar = async (req, res) => {
  if (!(await esDeMiFundacion(req, res))) return;

  await db.query('UPDATE animales SET activo = FALSE WHERE id = $1', [req.params.id]);
  res.status(204).end();
};
