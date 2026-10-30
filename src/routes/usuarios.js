const router = require('express').Router();
const ctrl = require('../controllers/usuarios');
const { requerirSesion } = require('../middlewares/auth');

router.get('/me', requerirSesion, ctrl.me);

module.exports = router;
