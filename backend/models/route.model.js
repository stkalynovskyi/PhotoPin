const mongoose = require('mongoose');
const routeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String },
    pins: [{
        photoId: String,
        image: String,
        lat: Number,
        lng: Number,
        address: String
    }],
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
module.exports = mongoose.model('Route', routeSchema, 'Routes');