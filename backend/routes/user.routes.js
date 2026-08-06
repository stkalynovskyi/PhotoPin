const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/register', userCtrl.register);
router.post('/login', userCtrl.login);
router.get('/profile', auth, userCtrl.getProfile);
router.post('/claim-photos', auth, userCtrl.claimOrphanPhotos);

module.exports = router;
