// Manejo de errores: todo error responde { "error": "mensaje" }.
// Express 5 envía aquí también los errores de las funciones async.

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

function manejarError(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
  }
  // Errores de la foto (middlewares/foto.js)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La foto no puede pesar más de 5 MB' });
  }
  if (err.status === 400 || err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  // Códigos de PostgreSQL
  if (err.code === '22P02' || err.code === '22003') { // texto o número fuera de formato (ej. id "abc")
    return res.status(400).json({ error: 'Dato con formato inválido' });
  }
  if (err.code === '23505') { // índice único violado (correo repetido, solicitud duplicada...)
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, manejarError };
