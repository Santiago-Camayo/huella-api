// Esquema de la base de datos (tablas e índices únicos que protegen las reglas de negocio).
module.exports = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('adoptante', 'fundacion')),
  fecha_registro TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS animales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
  especie_otra TEXT,
  raza TEXT,
  edad INTEGER NOT NULL CHECK (edad BETWEEN 0 AND 30),
  sexo TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')),
  descripcion TEXT,
  personalidad TEXT,
  bueno_con_ninos INTEGER CHECK (bueno_con_ninos IN (0, 1)),
  bueno_con_perros INTEGER CHECK (bueno_con_perros IN (0, 1)),
  bueno_con_gatos INTEGER CHECK (bueno_con_gatos IN (0, 1)),
  foto TEXT,
  estado TEXT NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'apartado', 'adoptado')),
  fecha_registro TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id INTEGER NOT NULL REFERENCES animales(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision', 'aprobada',
                      'rechazada', 'cancelada', 'finalizada')),
  comentario TEXT NOT NULL
);

-- Un adoptante no puede tener dos solicitudes activas para el mismo animal
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitud_activa
  ON solicitudes (animal_id, usuario_id)
  WHERE estado IN ('pendiente', 'en_revision', 'aprobada');

-- Solo una solicitud aprobada por animal
CREATE UNIQUE INDEX IF NOT EXISTS uq_una_aprobada_por_animal
  ON solicitudes (animal_id)
  WHERE estado = 'aprobada';
`;
