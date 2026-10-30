// Registro y login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRA } = require('../config');

// Quita la contraseña antes de devolver un usuario
function usuarioPublico(u) {
  return {
    id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol,
    fundacion_id: u.fundacion_id, es_admin: u.es_admin,
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
