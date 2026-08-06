const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const {mongoose} = require('./database');
const {json} = require('express');
require('dotenv').config();
require('./config/cloudinary.config');

app.set('port', process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send("El servidor PhotoPin está funcionando");
});

const routeRoutes = require('./routes/route.routes');
app.use('/api/v1/routes', routeRoutes);

app.use('/api/v1/photos', require('./routes/photo.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));

app.use((err, req, res, next) => {
    console.error("ERROR INTERNO DEL BACKEND:", err);
    res.status(500).json({
        status: false,
        message: err.message || "Error interno imprevisto en el servidor",
        details: err.toString(),
        stack: err.stack
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

