// Recibe la foto del animal en un formulario multipart (campo "foto").
// HU-17: solo JPG, PNG o WEBP de hasta 5 MB. El archivo queda en memoria (req.file) para subirlo a Storage.
const multer = require('multer');
const { EXTENSIONES } = require('../db/storage');

const recibirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, archivo, cb) => {
    if (EXTENSIONES[archivo.mimetype]) return cb(null, true);
    const error = new Error('La foto debe ser JPG, PNG o WEBP');
    error.status = 400;
    cb(error);
  },
}).single('foto');

module.exports = { recibirFoto };
