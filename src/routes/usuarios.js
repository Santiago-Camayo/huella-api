const router = require('express').Router();
const ctrl = require('../controllers/usuarios');
const { requerirSesion, requerirAdmin } = require('../middlewares/auth');

router.get('/me', requerirSesion, ctrl.me);
router.put('/me/password', requerirSesion, ctrl.cambiarPassword);
// Equipo de la fundación: solo el administrador
router.get('/', requerirSesion, requerirAdmin, ctrl.listar);
router.post('/', requerirSesion, requerirAdmin, ctrl.crear);
router.patch('/:id', requerirSesion, requerirAdmin, ctrl.cambiarActivo);

module.exports = router;
