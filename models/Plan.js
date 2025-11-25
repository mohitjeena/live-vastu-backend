const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['gold', 'premium', 'premium_plus'],
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    features: [{
        type: String,
        required: true
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);