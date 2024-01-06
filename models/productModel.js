const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true
    }, 
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
    },
    color: { 
        type: String,
        required: true,
    },
    category_id: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    images: {
        type: Array,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

})

module.exports = mongoose.model("Product", productSchema)


