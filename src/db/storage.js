// Fotos de los animales en Supabase Storage (bucket público "animales").
// La API sube el archivo y la base guarda solo la URL pública.
const crypto = require('crypto');
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config');

const BUCKET = 'animales';
const EXTENSIONES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Recibe el archivo de multer ({ buffer, mimetype }) y devuelve la URL pública
async function subirFoto(archivo) {
  const nombre = `${crypto.randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
  const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      'Content-Type': archivo.mimetype,
    },
    body: archivo.buffer,
  });
  if (!respuesta.ok) {
    throw new Error(`Supabase Storage respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${nombre}`;
}

module.exports = { subirFoto, EXTENSIONES };
