// Punto de entrada: prepara la base de datos y arranca el servidor.
const app = require('./app');
const db = require('./db');
const schema = require('./db/schema');
const sembrar = require('./db/seed');
const { PORT } = require('./config');

async function iniciar() {
  await db.query(schema); // crea las tablas si no existen
  await sembrar(db);      // carga datos de ejemplo si la base está vacía

  app.listen(PORT, () => {
    console.log(`Servidor Huella escuchando en http://localhost:${PORT}`);
  });
}

iniciar().catch((err) => {
  console.error('No se pudo iniciar:', err.message);
  process.exit(1);
});
