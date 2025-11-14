const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET all questions (including inactive - for admin)
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ display_order: 1 });
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

// CREATE new question
router.post('/questions', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    
    res.status(201).json({
      success: true,
      data: question,
      message: 'Question created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating question'
    });
  }
});

// UPDATE question
router.put('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question,
      message: 'Question updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating question'
    });
  }
});

// DELETE question (soft delete using is_active)
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id); // delete
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting question'
    });
  }
});

module.exports = router;