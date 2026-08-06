const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const userCtrl = {};

userCtrl.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ status: false, message: 'Todos los campos son obligatorios' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ status: false, message: 'El usuario o email ya existe' });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            status: true,
            message: 'Usuario registrado con éxito',
            data: { token, user: { id: user._id, username: user.username, email: user.email } }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

userCtrl.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: false, message: 'Email y contraseña son obligatorios' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ status: false, message: 'Credenciales incorrectas' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            status: true,
            message: 'Login exitoso',
            data: { token, user: { id: user._id, username: user.username, email: user.email } }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

userCtrl.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ status: false, message: 'Usuario no encontrado' });
        res.json({ status: true, data: user });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

userCtrl.claimOrphanPhotos = async (req, res) => {
    try {
        const Photo = require('../models/photo.model');
        const Route = require('../models/route.model');
        const result = await Photo.updateMany(
            { $or: [{ user: null }, { user: { $exists: false } }] },
            { $set: { user: req.userId, username: req.username } }
        );
        const routeResult = await Route.updateMany(
            { $or: [{ user: null }, { user: { $exists: false } }] },
            { $set: { user: req.userId, username: req.username } }
        );
        res.json({ status: true, message: `Asignadas ${result.modifiedCount} fotos y ${routeResult.modifiedCount} rutas a tu cuenta` });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = userCtrl;
