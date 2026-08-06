const mongoose = require('mongoose');
const { Schema } = mongoose;

const photoSchema = new Schema({
    image: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String },
    location: {
        type:{ type: String,default: 'Point'},
        coordinates: [Number]
    },
}, { versionKey: false, timestamps: true });

photoSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Photo', photoSchema, 'Photos');
