const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true 
    },
    email: { 
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
        required: true 
    },
    password: {
        type: String, 
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', userSchema);