const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({

    user_id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    delivery_address: {
        type: String,
        required: true
    }, 
    total_amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    payment: {
        type: String,
        required: true
    },
    items: [
        {
            product_id: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                // default: 'Pending',
                required: true
            },
            cancellationReason: {
                type: String
            },
            returnReason: {
                type: String
            }
            
        }
    ]
})

module.exports = mongoose.model('Order', orderSchema)