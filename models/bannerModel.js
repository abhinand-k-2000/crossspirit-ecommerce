const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    imagePath: {
        type: String,
        required: true
    }
})


module.exports = mongoose.model("Banner", bannerSchema)