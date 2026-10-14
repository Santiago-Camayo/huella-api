const router = require('express').Router();
const ctrl = require('../controllers/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

module.exports = router;
