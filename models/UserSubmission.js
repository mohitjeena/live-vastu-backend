const mongoose = require('mongoose');

const userSubmissionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true
    },
    mobile_number: {
        type: String,
        
    },
    customer_email: {
    type: String,
    required: true
}
,
      property_type: {
        type: String,
        enum: ['floor', 'flat', 'bungalow'],
      
    },
    purpose: {
        type: String,
        enum: ['home', 'office'],
       
    },
        // Plan Type
    plan_type: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    // ADD PAYMENT STATUS
    payment_status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    vastu_task:{
        type: Boolean,
        default: false
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
        question_key: {
            type: String,
            default: ""
        },
        sub_order: {
            type: String
        }
        ,
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
    ai_free_report_txt:{
        type: String
    },
    ai_paid_report_txt:{
        type: String
    }
    ,
    vastu_report:{
        type: String
    },

    report_check:{
        type: Boolean,
        default: false
    },
    
    is_verified: {
        type: Boolean,
        default: false
    },
        profile_image: {
        url: String,
        public_id: String,
        filename: String,
        uploaded_at: Date
    },
    
    // Map Images (array)
    map_images: [{
        url: String,
        public_id: String,
        filename: String,
        uploaded_at: Date
    }],
    pdf_url: {
        type: String
    },
    pdf_report: {
  url: String,
  file_id: String,
  filename: String,
  generated_at: Date,
  expires_at: Date,
  deleted_at: Date,
  is_deleted: {
    type: Boolean,
    default: false
  }},
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);