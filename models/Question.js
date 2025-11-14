const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_text: {
    type: String,
    required: true
  },
  question_type: {
    type: String,
    enum: ['multiple_choice', 'text_input'],
    default: 'multiple_choice'
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