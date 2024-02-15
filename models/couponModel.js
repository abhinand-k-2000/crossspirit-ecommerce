const mongoose = require("mongoose")

const couponSchema = mongoose.Schema({

    couponCode: {
        type: String
    },
    couponDescription: {
        type: String        
    },
    minAmount: {
        type: Number
    },
    discount: {
        type: Number
    },
    startingDate: {
        type: Date,
        default: Date.now()
    },
    expiryDate: {
        type: Date
    }
})

module.exports = mongoose.model("Coupon", couponSchema)