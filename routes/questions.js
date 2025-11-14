const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET all active questions (for users)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ is_active: true })
      .sort({ display_order: 1 });
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching questions'
    });
  }
});

// GET single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching question'
    });
  }
});

module.exports = router;