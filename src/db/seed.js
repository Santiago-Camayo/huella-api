// Datos de ejemplo. Solo se cargan si la tabla de animales está vacía.
const bcrypt = require('bcryptjs');

module.exports = function sembrar(db) {
  const total = db.prepare('SELECT COUNT(*) AS n FROM animales').get().n;
  if (total > 0) return;

  // Transacción: o se insertan todos los datos, o ninguno
  db.transaction(() => {
    const insertarUsuario = db.prepare(`
      INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol, fecha_registro)
      VALUES (@nombre, @correo, @telefono, @password_hash, @rol, @fecha)
    `);
    insertarUsuario.run({
      nombre: 'Santiago', correo: 'santiago@correo.com', telefono: '300 123 4567',
      password_hash: bcrypt.hashSync('santiago123', 10), rol: 'adoptante', fecha: '2026-10-01',
    });
    insertarUsuario.run({
      nombre: 'Marta Rojas', correo: 'fundacion@huella.org', telefono: '300 555 0101',
      password_hash: bcrypt.hashSync('fundacion123', 10), rol: 'fundacion', fecha: '2026-10-01',
    });

    const insertarAnimal = db.prepare(`
      INSERT INTO animales (nombre, especie, raza, edad, sexo, descripcion, personalidad,
        bueno_con_ninos, bueno_con_perros, bueno_con_gatos, foto, estado, fecha_registro)
      VALUES (@nombre, @especie, @raza, @edad, @sexo, @descripcion, @personalidad,
        @ninos, @perros, @gatos, @foto, @estado, @fecha)
    `);
    const animales = [
      { nombre: 'Max', especie: 'perro', raza: 'Mestizo', edad: 2, sexo: 'macho',
        descripcion: 'Juguetón y cariñoso. Le encanta correr y recibir mimos.',
        personalidad: 'Activo, sociable', ninos: 1, perros: 1, gatos: 0,
        foto: null, estado: 'disponible' },
      { nombre: 'Luna', especie: 'gato', raza: 'Criollo', edad: 1, sexo: 'hembra',
        descripcion: 'Tranquila y curiosa. Duerme en tu regazo si la dejas.',
        personalidad: 'Calmada, curiosa', ninos: 1, perros: 0, gatos: 1,
        foto: null, estado: 'disponible' },
      { nombre: 'Rocky', especie: 'perro', raza: 'Pitbull', edad: 4, sexo: 'macho',
        descripcion: 'Leal y protector, ideal para familias activas.',
        personalidad: 'Leal, protector', ninos: 1, perros: 1, gatos: null,
        foto: null, estado: 'apartado' },
      { nombre: 'Nube', especie: 'gato', raza: 'Angora', edad: 3, sexo: 'hembra',
        descripcion: 'Elegante y dulce.', personalidad: 'Dulce',
        ninos: 1, perros: 0, gatos: 1, foto: null, estado: 'adoptado' },
      { nombre: 'Toby', especie: 'perro', raza: 'Beagle', edad: 5, sexo: 'macho',
        descripcion: 'Curioso y olfateador, siempre buscando aventura.', personalidad: 'Curioso',
        ninos: 1, perros: 1, gatos: 0, foto: null, estado: 'disponible' },
      { nombre: 'Mia', especie: 'gato', raza: 'Siamés', edad: 2, sexo: 'hembra',
        descripcion: 'Habladora y juguetona.', personalidad: 'Juguetona',
        ninos: 0, perros: 0, gatos: 1, foto: null, estado: 'disponible' },
    ];
    for (const a of animales) {
      insertarAnimal.run({ ...a, fecha: '2026-10-01' });
    }
  })();
};
