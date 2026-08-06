const Photo = require('../models/photo.model');
const cloudinary = require('cloudinary').v2;

const photoCtrl = {};

photoCtrl.getMap = async (req, res) => {
    try {
        const photos = await Photo.find().select('image location username user');
        res.json({
            status: true,
            message: "Pines cargados",
            data: photos
        });
    } catch (error) {
        res.status(400).json({ status: false, message: error.message });
    }
};

photoCtrl.getMyPhotos = async (req, res) => {
    try {
        const photos = await Photo.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json({ status: true, data: photos });
    } catch (error) {
        res.status(400).json({ status: false, message: error.message });
    }
};

photoCtrl.addPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: 'No se recibió ninguna imagen en el campo "image"' });
        }

        console.log('Recibido archivo:', req.file.originalname, 'Tamaño:', req.file.size);

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'PhotoPin_App', resource_type: 'image' },
                (error, result) => {
                    if (error) {
                        console.error('Error Cloudinary:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(req.file.buffer);
        });

        console.log('Cloudinary OK:', uploadResult.secure_url);

        const { title, description, lat, lng } = req.body;

        const newPhoto = new Photo({
            image: uploadResult.secure_url,
            title: title || '',
            description: description || '',
            user: req.userId,
            username: req.username,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        });

        const photoSaved = await newPhoto.save();

        res.json({
            status: true,
            message: "Foto subida con éxito",
            data: photoSaved
        });

    } catch (error) {
        console.error('Error en addPhoto:', error);
        res.status(500).json({ 
            status: false, 
            message: error.message || 'Error en el servidor',
            details: error
        });
    }
};

photoCtrl.addPhotoBase64 = async (req, res) => {
    try {
        const { title, description, lat, lng, imageBase64 } = req.body;


        if (!imageBase64) {
            return res.status(400).json({ status: false, message: 'No se envió imageBase64' });
        }

        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
            folder: 'PhotoPin_App',
            resource_type: 'image'
        });

        const newPhoto = new Photo({
            image: uploadResult.secure_url,
            title: title || '',
            description: description || '',
            user: req.userId,
            username: req.username,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        });

        const photoSaved = await newPhoto.save();

        res.json({
            status: true,
            message: 'Foto subida con éxito',
            data: photoSaved
        });

    } catch (error) {
        console.error('Error en addPhotoBase64:', error);
        res.status(500).json({
            status: false,
            message: error.message || 'Error desconocido',
            details: JSON.stringify(error, null, 2)
        });
    }
};

photoCtrl.deletePhoto = async (req, res) => {
    try {
        const photo = await Photo.findById(req.params.id);
        if (!photo) return res.status(404).json({ status: false, message: 'Foto no encontrada' });

        const urlParts = photo.image.split('/');
        const filename = urlParts[urlParts.length - 1].split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;

        await cloudinary.uploader.destroy(publicId);
        await Photo.findByIdAndDelete(req.params.id);

        res.json({ status: true, message: 'Foto eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
photoCtrl.toggleFavorite = async (req, res) => {
    try {
        const User = require('../models/user.model');
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ status: false, message: 'Usuario no encontrado' });

        const photoId = req.params.id;
        const index = user.favorites.indexOf(photoId);

        if (index === -1) {
            user.favorites.push(photoId);
        } else {
            user.favorites.splice(index, 1);
        }

        await user.save();
        res.json({ status: true, message: 'Favoritos actualizados', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

photoCtrl.getFavorites = async (req, res) => {
    try {
        const User = require('../models/user.model');
        const user = await User.findById(req.userId).populate('favorites');
        if (!user) return res.status(404).json({ status: false, message: 'Usuario no encontrado' });

        res.json({ status: true, data: user.favorites });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = photoCtrl;