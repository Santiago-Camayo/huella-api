// Esquema de la base de datos (SRS sección 7): tablas e índices únicos que protegen las reglas de negocio.
module.exports = `
CREATE TABLE IF NOT EXISTS fundaciones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  telefono TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('adoptante', 'fundacion')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fundacion_id BIGINT REFERENCES fundaciones(id),
  es_admin BOOLEAN NOT NULL DEFAULT FALSE,
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
  -- La fundación es obligatoria para el personal y vacía para los adoptantes
  CHECK ((rol = 'fundacion') = (fundacion_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS animales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
  especie_otra TEXT,
  raza TEXT,
  edad INTEGER NOT NULL CHECK (edad BETWEEN 0 AND 30),
  sexo TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')),
  descripcion TEXT,
  personalidad TEXT,
  bueno_con_ninos BOOLEAN,
  bueno_con_perros BOOLEAN,
  bueno_con_gatos BOOLEAN,
  foto TEXT NOT NULL, -- URL de la imagen
  estado TEXT NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'apartado', 'adoptado')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fundacion_id BIGINT NOT NULL REFERENCES fundaciones(id),
  CHECK (especie <> 'otro' OR especie_otra IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  animal_id BIGINT NOT NULL REFERENCES animales(id),
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_revision', 'aprobada',
                      'rechazada', 'cancelada', 'finalizada')),
  comentario TEXT NOT NULL CHECK (char_length(comentario) BETWEEN 10 AND 500),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
