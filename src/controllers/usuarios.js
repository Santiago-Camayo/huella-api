// Datos del usuario que tiene la sesión abierta.
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
