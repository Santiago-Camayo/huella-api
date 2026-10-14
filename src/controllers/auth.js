// Registro y login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRA } = require('../config');

// Quita la contraseña antes de devolver un usuario
function usuarioPublico(u) {
  return { id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol };
}

function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: JWT_EXPIRA });
}

// POST /auth/register: solo crea adoptantes
exports.register = (req, res) => {
  const { nombre, correo, telefono, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
  if (existe) {
    return res.status(409).json({ error: 'El correo ya está registrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol, fecha_registro)
    VALUES (?, ?, ?, ?, 'adoptante', date('now'))
  `).run(nombre, correo, telefono || null, hash);

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// POST /auth/login
exports.login = (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan correo o contraseña' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);

  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  if (usuario.activo === 0) {
    return res.status(403).json({ error: 'La cuenta está desactivada' });
  }

  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};
