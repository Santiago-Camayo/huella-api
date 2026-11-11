// Cuenta propia y equipo de la fundación.
const bcrypt = require('bcryptjs');
const db = require('../db');
const { usuarioPublico } = require('./auth');

// GET /usuarios/me: el usuario sale del token
exports.me = async (req, res) => {
  const { rows: [usuario] } = await db.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);

  // Token válido pero la cuenta ya no existe o fue desactivada: la app debe volver al login
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Sesión no válida' });
  }

  res.json(usuarioPublico(usuario));
};

// PUT /usuarios/me/password (HU-25, RN-22): cambia la contraseña propia y quita la marca de temporal
exports.cambiarPassword = async (req, res) => {
  const { password_actual, password_nueva } = req.body || {};

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Faltan la contraseña actual o la nueva' });
  }
  if (typeof password_nueva !== 'string' || password_nueva.length < 8) {
    return res.status(400).json({ error: 'La contraseña nueva debe tener al menos 8 caracteres' });
  }
  if (password_nueva === password_actual) {
    return res.status(400).json({ error: 'La contraseña nueva debe ser distinta de la actual' });
  }

  const { rows: [usuario] } = await db.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Sesión no válida' });
  }
  // 400 y no 401: la sesión es válida, lo que está mal es el dato
  if (!bcrypt.compareSync(password_actual, usuario.password_hash)) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  }

  await db.query(
    'UPDATE usuarios SET password_hash = $1, debe_cambiar_password = FALSE WHERE id = $2',
    [bcrypt.hashSync(password_nueva, 10), usuario.id]
  );
  res.json({ ok: true });
};

// GET /usuarios (administrador, HU-24): el personal de su fundación
exports.listar = async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM usuarios WHERE fundacion_id = $1 ORDER BY nombre',
    [req.usuario.fundacion_id]
  );
  res.json(rows.map(usuarioPublico));
};

// POST /usuarios (administrador, HU-24): crea un empleado de su fundación con contraseña temporal
exports.crear = async (req, res) => {
  const { nombre, correo, telefono, password } = req.body || {};

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña temporal debe tener al menos 8 caracteres' });
  }

  const { rows: existe } = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
  if (existe.length > 0) {
    return res.status(409).json({ error: 'El correo ya está registrado' });
  }

  // Rol, fundación y "debe cambiar la contraseña" los fija el servidor (RN-22)
  const { rows: [usuario] } = await db.query(
    `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol, fundacion_id, es_admin, debe_cambiar_password)
     VALUES ($1, $2, $3, $4, 'fundacion', $5, FALSE, TRUE) RETURNING *`,
    [nombre, correo, telefono || null, bcrypt.hashSync(password, 10), req.usuario.fundacion_id]
  );
  res.status(201).json(usuarioPublico(usuario));
};

// PATCH /usuarios/:id (administrador, HU-24): activa o desactiva una cuenta de su fundación
exports.cambiarActivo = async (req, res) => {
  const { activo } = req.body || {};
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'activo debe ser true o false' });
  }

  // Una cuenta de otra fundación se trata como inexistente
  const { rows: [usuario] } = await db.query(
    'SELECT * FROM usuarios WHERE id = $1 AND fundacion_id = $2',
    [req.params.id, req.usuario.fundacion_id]
  );
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  // RN-16: el administrador no puede desactivar su propia cuenta
  if (usuario.id === req.usuario.id) {
    return res.status(409).json({ error: 'No puedes cambiar el estado de tu propia cuenta' });
  }

  const { rows: [actualizado] } = await db.query(
    'UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING *',
    [activo, usuario.id]
  );
  res.json(usuarioPublico(actualizado));
};
