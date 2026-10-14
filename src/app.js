// Configura Express y monta las rutas. No arranca el servidor.
const express = require('express');

const app = express();
app.use(express.json()); // Permite leer el cuerpo de las peticiones en JSON

app.use('/auth', require('./routes/auth'));
app.use('/animales', require('./routes/animales'));
app.use('/solicitudes', require('./routes/solicitudes'));

module.exports = app;
