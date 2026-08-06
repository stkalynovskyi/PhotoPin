const express = require('express');
const router = express.Router();
const photoCtrl = require('../controllers/photo.controller');
const { auth } = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/map', photoCtrl.getMap);

router.get('/my', auth, photoCtrl.getMyPhotos);
router.get('/favorites', auth, photoCtrl.getFavorites);
router.post('/newPhoto', auth, upload.single('image'), photoCtrl.addPhoto);
router.post('/favorite/:id', auth, photoCtrl.toggleFavorite);
router.delete('/:id', auth, photoCtrl.deletePhoto);

module.exports = router;