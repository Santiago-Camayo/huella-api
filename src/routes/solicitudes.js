const router = require('express').Router();
const ctrl = require('../controllers/solicitudes');
const { requerirSesion, requerirAdoptante } = require('../middlewares/auth');

router.post('/', requerirSesion, requerirAdoptante, ctrl.crear);
router.get('/', requerirSesion, ctrl.listar);
router.get('/:id', requerirSesion, ctrl.detalle);
router.patch('/:id/estado', requerirSesion, ctrl.cambiarEstado);

module.exports = router;
