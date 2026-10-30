// Conexión a PostgreSQL. Exporta el pool: db.query(sql, [parámetros]) devuelve { rows }.
const { Pool, types } = require('pg');
const { DATABASE_URL } = require('../config');

// pg devuelve los BIGINT (id) como texto; los convertimos a número para compararlos con el token
types.setTypeParser(types.builtins.INT8, Number);

// Supabase exige SSL; una base en localhost no lo usa
const esLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);

module.exports = new Pool({
  connectionString: DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false },
});
