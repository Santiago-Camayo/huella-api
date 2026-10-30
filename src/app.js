// Configura Express y monta las rutas. No arranca el servidor.
const express = require('express');
const { rutaNoEncontrada, manejarError } = require('./middlewares/errores');

const app = express();
app.use(express.json()); // Permite leer el cuerpo de las peticiones en JSON

// Render la usa para comprobar que la API está viva
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', require('./routes/auth'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/animales', require('./routes/animales'));
app.use('/solicitudes', require('./routes/solicitudes'));

// Siempre al final
app.use(rutaNoEncontrada);
app.use(manejarError);

module.exports = app;
