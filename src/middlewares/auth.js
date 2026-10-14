// Middlewares de sesión y permisos por rol.
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Revisa el token del encabezado Authorization. Si es válido, guarda el usuario en req.usuario
function requerirSesion(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de sesión' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

// Solo deja pasar a la fundación. Usar DESPUÉS de requerirSesion
function requerirFundacion(req, res, next) {
  if (req.usuario.rol !== 'fundacion') {
    return res.status(403).json({ error: 'Solo la fundación puede hacer esta acción' });
  }
  next();
}

// Solo deja pasar a adoptantes. Usar DESPUÉS de requerirSesion
function requerirAdoptante(req, res, next) {
  if (req.usuario.rol !== 'adoptante') {
    return res.status(403).json({ error: 'Solo un adoptante puede hacer esta acción' });
  }
  next();
}

module.exports = { requerirSesion, requerirFundacion, requerirAdoptante };
