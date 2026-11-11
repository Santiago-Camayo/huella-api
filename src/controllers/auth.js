// Registro y login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRA } = require('../config');

// Quita la contraseña antes de devolver un usuario
function usuarioPublico(u) {
  return {
    id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol,
    fundacion_id: u.fundacion_id, es_admin: u.es_admin, activo: u.activo,
    debe_cambiar_password: u.debe_cambiar_password,
  };
}

// El token lleva lo que el servidor necesita saber del usuario en cada petición
function firmarToken(u) {
  return jwt.sign(
    { id: u.id, rol: u.rol, fundacion_id: u.fundacion_id, es_admin: u.es_admin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRA }
  );
}

// POST /auth/register: solo crea adoptantes
exports.register = async (req, res) => {
  const { nombre, correo, telefono, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const { rows: existe } = await db.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
  if (existe.length > 0) {
    return res.status(409).json({ error: 'El correo ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const { rows: [usuario] } = await db.query(
    `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
     VALUES ($1, $2, $3, $4, 'adoptante') RETURNING *`,
    [nombre, correo, telefono || null, hash]
  );

  res.status(201).json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// POST /auth/registro-fundacion (HU-05, RN-20): crea la fundación y su administrador en una sola operación.
// Cuerpo: { fundacion: { nombre, ciudad, telefono? }, admin: { nombre, correo, password } }
exports.registroFundacion = async (req, res) => {
  const { fundacion = {}, admin = {} } = req.body || {};

  if (!fundacion.nombre || !fundacion.ciudad || !admin.nombre || !admin.correo || !admin.password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (typeof admin.password !== 'string' || admin.password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const { rows: existe } = await db.query('SELECT id FROM usuarios WHERE correo = $1', [admin.correo]);
  if (existe.length > 0) {
    return res.status(409).json({ error: 'El correo ya está registrado' });
  }

  // Las dos inserciones van en una transacción: o se crean ambas o ninguna
  const cliente = await db.connect();
  let usuario;
  try {
    await cliente.query('BEGIN');
    const { rows: [nueva] } = await cliente.query(
      'INSERT INTO fundaciones (nombre, ciudad, telefono) VALUES ($1, $2, $3) RETURNING id',
      [fundacion.nombre, fundacion.ciudad, fundacion.telefono || null]
    );
    ({ rows: [usuario] } = await cliente.query(
      `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol, fundacion_id, es_admin)
       VALUES ($1, $2, $3, $4, 'fundacion', $5, TRUE) RETURNING *`,
      [admin.nombre, admin.correo, fundacion.telefono || null, bcrypt.hashSync(admin.password, 10), nueva.id]
    ));
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }

  res.status(201).json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// POST /auth/login
exports.login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan correo o contraseña' });
  }

  const { rows: [usuario] } = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  if (!usuario.activo) {
    return res.status(403).json({ error: 'La cuenta está desactivada' });
  }

  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

exports.usuarioPublico = usuarioPublico;
