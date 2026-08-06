const express = require('express');
const router = express.Router();
const routeCtrl = require('../controllers/route.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/', auth, routeCtrl.getRoutes);
router.post('/save', auth, routeCtrl.saveRoute);
router.delete('/:id', auth, routeCtrl.deleteRoute);

module.exports = router;