// Validación de los datos de un animal.
const ESPECIES = ['perro', 'gato', 'otro'];
const SEXOS = ['macho', 'hembra'];

// Devuelve un texto con el error, o null si todo está bien
function validarAnimal(datos) {
  if (!datos.nombre) return 'El nombre es obligatorio';
  if (!ESPECIES.includes(datos.especie)) return 'La especie debe ser perro, gato u otro';
  if (datos.especie === 'otro' && !datos.especie_otra) return 'Indica qué especie es';
  if (!SEXOS.includes(datos.sexo)) return 'El sexo debe ser macho o hembra';
  if (!Number.isInteger(datos.edad) || datos.edad < 0 || datos.edad > 30) {
    return 'La edad debe ser un número entero entre 0 y 30';
  }
  return null;
}

module.exports = { validarAnimal };
