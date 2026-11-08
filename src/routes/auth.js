const router = require('express').Router();
const ctrl = require('../controllers/auth');

router.post('/register', ctrl.register);
router.post('/registro-fundacion', ctrl.registroFundacion);
router.post('/login', ctrl.login);

module.exports = router;
