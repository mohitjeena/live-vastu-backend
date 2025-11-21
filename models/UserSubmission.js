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
        answer: {
            type: String,
            required: true
        },
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