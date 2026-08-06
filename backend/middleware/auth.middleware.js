const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'photopin_secret_key_2024';

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: false, message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ status: false, message: 'Token inválido o expirado' });
    }
};

module.exports = { auth, JWT_SECRET };
