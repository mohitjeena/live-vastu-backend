const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_text: {
    type: String,
    required: true
  },
  question_type: {
    type: String,
    enum: ['multiple_choice', 'text_input','image'],
    default: 'multiple_choice'
  },
  question_plan: {
    type: String,
    enum: ['basic', 'gold', 'premium', 'premium_plus'],
    default: 'basic'
},
  options: {
    type: [String],
    default: []
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);