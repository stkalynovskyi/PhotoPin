const Route = require('../models/route.model');
const routeCtrl = {};

routeCtrl.getRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json({ status: true, data: routes });
    } catch (e) { res.status(500).json({ status: false, message: e.message }); }
};

routeCtrl.saveRoute = async (req, res) => {
    try {
        const { name, pins } = req.body;
        if (!name || !pins?.length) return res.status(400).json({ status: false, message: 'Faltan datos' });
        const route = new Route({ name, pins, user: req.userId, username: req.username });
        const saved = await route.save();
        res.json({ status: true, data: saved });
    } catch (e) { res.status(500).json({ status: false, message: e.message }); }
};

routeCtrl.deleteRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ status: false, message: 'Ruta no encontrada' });
        if (route.user.toString() !== req.userId) {
            return res.status(403).json({ status: false, message: 'No tienes permiso' });
        }
        await Route.findByIdAndDelete(req.params.id);
        res.json({ status: true, message: 'Ruta eliminada' });
    } catch (e) { res.status(500).json({ status: false, message: e.message }); }
};

module.exports = routeCtrl;