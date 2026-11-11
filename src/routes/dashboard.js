const router = require('express').Router();
const ctrl = require('../controllers/dashboard');
const { requerirSesion, requerirFundacion } = require('../middlewares/auth');

router.get('/resumen', requerirSesion, requerirFundacion, ctrl.resumen);

module.exports = router;
