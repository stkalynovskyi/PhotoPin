const mongoose = require('mongoose');
require('dotenv').config();

const URL = process.env.URL;
mongoose.connect(URL)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((err) => {
        console.error(err);
    })

module.exports = mongoose;