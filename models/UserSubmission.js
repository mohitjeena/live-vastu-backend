const mongoose = require('mongoose');

const userSubmissionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true
    },
    mobile_number: {
        type: String,
        required: true
    },
      property_type: {
        type: String,
        enum: ['floor', 'flat', 'bungalow'],
        required: true
    },
    purpose: {
        type: String,
        enum: ['home', 'office'],
        required: true
    },
        // Plan Type
    plan_type: {
        type: String,
        enum: ['basic', 'gold', 'premium', 'premium_plus'],
        default: 'basic'
    },
    // ADD PAYMENT STATUS
    payment_status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    // ADD ORDER ID FOR REFERENCE
    order_id: {
        type: String
    },
     has_paid_features: {
        type: Boolean,
        default: false
    },
    answers: [{
        question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        question_text: {
            type: String,
            required: true
        },
        question_plan: {
            type: String,
            enum: ['basic', 'gold', 'premium', 'premium_plus'],
            required: true,
            default: 'basic'
        }
        ,
        answer: {
            type: String,
            required: true
        }
        ,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
     ai_score: {
        type: Number,
        min: 0,
        max: 100
    },
    ai_report: {
        type: String
    },
    vastu_report:{
        type: String
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);