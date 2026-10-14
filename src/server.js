// Punto de entrada: arranca el servidor.
const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`Servidor Huella escuchando en http://localhost:${PORT}`);
});
