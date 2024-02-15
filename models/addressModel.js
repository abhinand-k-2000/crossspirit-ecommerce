const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({

    user_id: { 
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: [
        {
            // name: {
            //     type: String,
            //     required: true
            // },
            // house: {
            //     type: String,
            //     required: true
            // },
            streetaddress: {
                type: String,
                required: true
            },
            // post:{
            //     type: String,
            //     required: true
            // },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            },
            state: {
                type: String,
                required: true
            },
        }
    ]
})

module.exports = mongoose.model("Address", addressSchema)