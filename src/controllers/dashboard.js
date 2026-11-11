// Resumen para el panel de la fundación.
const db = require('../db');
const { SQL_SOLICITUDES } = require('./solicitudes');

// GET /dashboard/resumen (HU-15): cifras de la fundación del token y sus 5 solicitudes más recientes
exports.resumen = async (req, res) => {
  const fundacion = req.usuario.fundacion_id;

  const { rows: [cifras] } = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM animales WHERE fundacion_id = $1 AND activo AND estado = 'disponible')::int AS disponibles,
       COUNT(*) FILTER (WHERE s.estado = 'pendiente')::int AS pendientes,
       COUNT(*) FILTER (WHERE s.estado = 'en_revision')::int AS en_revision,
       COUNT(*) FILTER (WHERE s.estado = 'finalizada')::int AS adopciones_completadas
     FROM solicitudes s JOIN animales a ON a.id = s.animal_id
     WHERE a.fundacion_id = $1`,
    [fundacion]
  );

  const { rows: ultimas } = await db.query(
    `${SQL_SOLICITUDES} WHERE a.fundacion_id = $1 ORDER BY s.fecha DESC, s.id DESC LIMIT 5`,
    [fundacion]
  );

  res.json({ ...cifras, ultimas });
};
