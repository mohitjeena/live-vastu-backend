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

// get filtered questions

router.get('/questions/:planType', async (req, res) => {
    const { planType } = req.params;

  try {
    const questions = await Question.find({ question_plan: planType }).sort({ display_order: 1 });
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter questions'
    });
  }
});


// CREATE new question
router.post('/questions', async (req, res) => {
    try {
        const { display_order, ...questionData } = req.body;
        
        // Get all questions sorted by current display order
        const allQuestions = await Question.find().sort({ display_order: 1 });
        
        let newDisplayOrder;
        
        if (display_order && display_order <= allQuestions.length) {
            // Insert at specific position - shift others down
            newDisplayOrder = display_order;
            
            // Shift questions down to make space
            await Question.updateMany(
                { display_order: { $gte: display_order } },
                { $inc: { display_order: 1 } }
            );
        } else {
            // Add to the end
            newDisplayOrder = allQuestions.length + 1;
        }
        
        const question = new Question({
            ...questionData,
            display_order: newDisplayOrder
        });
        
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
        const { display_order,...updateData } = req.body;
        const questionId = req.params.id;
        
        // Get current question and all questions
        const currentQuestion = await Question.findById(questionId);
        const allQuestions = await Question.find().sort({ display_order: 1 });
        
        if (!currentQuestion) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }
        
        const oldOrder = currentQuestion.display_order;
        let newOrder = display_order !== undefined ? display_order : oldOrder;
        
        // Validate new order
        if (newOrder < 1) newOrder = 1;
        if (newOrder > allQuestions.length) newOrder = allQuestions.length;
        
        if (newOrder !== oldOrder) {
            if (newOrder > oldOrder) {
                // Moving down - shift questions in between up
                await Question.updateMany(
                    { 
                        display_order: { $gt: oldOrder, $lte: newOrder },
                        _id: { $ne: questionId }
                    },
                    { $inc: { display_order: -1 } }
                );
            } else {
                // Moving up - shift questions in between down
                await Question.updateMany(
                    { 
                        display_order: { $gte: newOrder, $lt: oldOrder },
                        _id: { $ne: questionId }
                    },
                    { $inc: { display_order: 1 } }
                );
            }
        }

     if (updateData.question_type && updateData.question_type !== 'multiple_choice') {
        updateData.options = [];
     }
  
        
        // Update the question
        const question = await Question.findByIdAndUpdate(
            questionId,
            { ...updateData, display_order: newOrder },
            { new: true, runValidators: true }
        );
        
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
    const question = await Question.findById(req.params.id); // delete
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const displayOrder= question.display_order

    await Question.findByIdAndDelete(req.params.id);

    // Shift up display orders of remaining questions
    await Question.updateMany(
      { display_order: { $gt: displayOrder } },
      { $inc: { display_order: -1 } }
    );
    
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