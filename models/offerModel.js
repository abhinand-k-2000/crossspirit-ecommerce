const mongoose = require('mongoose') 

const offerSchema = new mongoose.Schema({
    targetEntity: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    targetType: {
        type: String,
        required: true,
        enum: ['category', 'product'],
    },
    percentage: {
        type: Number,
        required: true,
    },
    startingDate: {
        type: Date,
        default: new Date(),
    },
});



module.exports = mongoose.model('Offer', offerSchema)