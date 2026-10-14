const router = require('express').Router();
const ctrl = require('../controllers/animales');
const { requerirSesion, requerirFundacion } = require('../middlewares/auth');

router.get('/', requerirSesion, ctrl.listar);
router.get('/:id', requerirSesion, ctrl.detalle);
router.post('/', requerirSesion, requerirFundacion, ctrl.crear);
router.put('/:id', requerirSesion, requerirFundacion, ctrl.editar);
router.delete('/:id', requerirSesion, requerirFundacion, ctrl.retirar);

module.exports = router;
