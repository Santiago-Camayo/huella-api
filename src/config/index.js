// Configuración central. Todo sale de variables de entorno.
// En local se leen del archivo .env (fuera de git); en Render se configuran en su panel.
try { process.loadEnvFile(); } catch { /* sin .env: se usan las variables del sistema */ }

function requerida(nombre) {
  if (!process.env[nombre]) {
    console.error(`Falta la variable de entorno ${nombre}`);
    process.exit(1);
  }
  return process.env[nombre];
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: requerida('JWT_SECRET'), // clave para firmar tokens
  JWT_EXPIRA: '7d',
};
