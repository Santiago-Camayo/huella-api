// Configuración central. Se puede cambiar con variables de entorno.
module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 's1a2n3t4i5T', // clave para firmar tokens
  JWT_EXPIRA: '7d',
};
