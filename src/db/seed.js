// Datos de ejemplo. Solo se cargan si no hay ningún usuario.
const bcrypt = require('bcryptjs');

// Fotos de ejemplo: en el Sprint 2 las reemplazan las que suba la fundación (Supabase Storage)
const foto = (nombre) => `https://picsum.photos/seed/${nombre}/600/400`;

module.exports = async function sembrar(db) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM usuarios');
  if (rows[0].n > 0) return;

  const cliente = await db.connect();
  try {
    // Transacción: o se insertan todos los datos, o ninguno
    await cliente.query('BEGIN');

    const fundaciones = [];
    for (const [nombre, ciudad, telefono] of [
      ['Patitas Felices', 'Popayán', '300 555 0101'],
      ['Huellas del Cauca', 'Cali', '300 555 0202'],
    ]) {
      const r = await cliente.query(
        'INSERT INTO fundaciones (nombre, ciudad, telefono) VALUES ($1, $2, $3) RETURNING id',
        [nombre, ciudad, telefono]
      );
      fundaciones.push(r.rows[0].id);
    }

    const insertarUsuario = (nombre, correo, telefono, password, rol, fundacionId, esAdmin) =>
      cliente.query(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol, fundacion_id, es_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [nombre, correo, telefono, bcrypt.hashSync(password, 10), rol, fundacionId, esAdmin]
      );
    await insertarUsuario('Santiago', 'santiago@correo.com', '300 123 4567', 'santiago123', 'adoptante', null, false);
    await insertarUsuario('Marta Rojas', 'fundacion@huella.org', '300 555 0101', 'fundacion123', 'fundacion', fundaciones[0], true);
    await insertarUsuario('Carlos Mora', 'fundacion2@huella.org', '300 555 0202', 'fundacion123', 'fundacion', fundaciones[1], true);

    const animales = [
      { f: 0, nombre: 'Max', especie: 'perro', raza: 'Mestizo', edad: 2, sexo: 'macho',
        descripcion: 'Juguetón y cariñoso. Le encanta correr y recibir mimos.',
        personalidad: 'Activo, sociable', ninos: true, perros: true, gatos: false, estado: 'disponible' },
      { f: 0, nombre: 'Luna', especie: 'gato', raza: 'Criollo', edad: 1, sexo: 'hembra',
        descripcion: 'Tranquila y curiosa. Duerme en tu regazo si la dejas.',
        personalidad: 'Calmada, curiosa', ninos: true, perros: false, gatos: true, estado: 'disponible' },
      { f: 0, nombre: 'Rocky', especie: 'perro', raza: 'Pitbull', edad: 4, sexo: 'macho',
        descripcion: 'Leal y protector, ideal para familias activas.',
        personalidad: 'Leal, protector', ninos: true, perros: true, gatos: null, estado: 'apartado' },
      { f: 0, nombre: 'Nube', especie: 'gato', raza: 'Angora', edad: 3, sexo: 'hembra',
        descripcion: 'Elegante y dulce.', personalidad: 'Dulce',
        ninos: true, perros: false, gatos: true, estado: 'adoptado' },
      { f: 1, nombre: 'Toby', especie: 'perro', raza: 'Beagle', edad: 5, sexo: 'macho',
        descripcion: 'Curioso y olfateador, siempre buscando aventura.', personalidad: 'Curioso',
        ninos: true, perros: true, gatos: false, estado: 'disponible' },
      { f: 1, nombre: 'Mia', especie: 'gato', raza: 'Siamés', edad: 2, sexo: 'hembra',
        descripcion: 'Habladora y juguetona.', personalidad: 'Juguetona',
        ninos: false, perros: false, gatos: true, estado: 'disponible' },
    ];
    for (const a of animales) {
      await cliente.query(
        `INSERT INTO animales (nombre, especie, raza, edad, sexo, descripcion, personalidad,
           bueno_con_ninos, bueno_con_perros, bueno_con_gatos, foto, estado, fundacion_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [a.nombre, a.especie, a.raza, a.edad, a.sexo, a.descripcion, a.personalidad,
         a.ninos, a.perros, a.gatos, foto(a.nombre.toLowerCase()), a.estado, fundaciones[a.f]]
      );
    }

    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
};
