const mongoose = require("mongoose")

const walletSchema = mongoose.Schema({

    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    }, 
    balance: {
        type: Number, 
        default: 0
    },
    wallet_history: [
        {
            date: {
                type: Date
            },
            amount: {
                type: Number
            },
            description: {
                type: String
            },
            current_balance: {
                type: Number
            }
        }
    ]
})


module.exports = mongoose.model("Wallet", walletSchema)