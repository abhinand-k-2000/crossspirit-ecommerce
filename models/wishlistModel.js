const mongoose = require('mongoose')

const wishlistSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
       {
        product_id: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: true
        }
       }
    ]
})

module.exports = mongoose.model("Wishlist", wishlistSchema)
