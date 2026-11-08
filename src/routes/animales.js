const router = require('express').Router();
const ctrl = require('../controllers/animales');
const { requerirSesion, requerirFundacion } = require('../middlewares/auth');
const { recibirFoto } = require('../middlewares/foto');

router.get('/', requerirSesion, ctrl.listar);
router.get('/:id', requerirSesion, ctrl.detalle);
// Crear llega como multipart/form-data con el campo "foto". Editar acepta multipart (foto opcional) o JSON.
router.post('/', requerirSesion, requerirFundacion, recibirFoto, ctrl.crear);
router.put('/:id', requerirSesion, requerirFundacion, recibirFoto, ctrl.editar);
router.delete('/:id', requerirSesion, requerirFundacion, ctrl.retirar);

module.exports = router;
