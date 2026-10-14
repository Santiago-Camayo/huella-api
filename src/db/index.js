// Abre la base de datos, crea las tablas y carga el seed. Exporta la conexión.
const Database = require('better-sqlite3');
const path = require('path');
const schema = require('./schema');
const sembrar = require('./seed');

// huella.db queda en la raíz del proyecto
const db = new Database(path.join(__dirname, '..', '..', 'huella.db'));
db.pragma('foreign_keys = ON'); // SQLite las trae desactivadas por defecto
db.exec(schema);
sembrar(db);

module.exports = db;
