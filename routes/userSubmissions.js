const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const generateVastuReport = require('../services/openaiService').generateVastuReport;

// Save user submission (after mobile verification)
router.post('/', async (req, res) => {
    try {
        const { session_id, mobile_number, answers, property_type, purpose } = req.body;

        // Check if session already exists
        const existingSubmission = await UserSubmission.findOne({ session_id });
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Session already exists'
            });
        }

           let ai_score = 0;
        let ai_report = "Vastu analysis report will be available soon.";

        // Generate AI report only if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            try {
                console.log('Generating AI Vastu report...');
                const aiResponse = await generateVastuReport({ session_id, answers });
                ai_score = aiResponse.score  || ai_score;
                ai_report = aiResponse.report || ai_report;
            } catch (aiError) {
                console.error('OpenAI error, using default response:', aiError);
                // Continue with default values if OpenAI fails
            }
        }

 

        // Create new user submission
        const userSubmission = new UserSubmission({
            session_id,
            mobile_number,
            property_type, 
            purpose,
            answers,
            ai_score,
            ai_report,
            is_verified: true 
        });

        await userSubmission.save();

        res.status(201).json({
            success: true,
            data: userSubmission,
            message: 'User submission saved successfully'
        });
    } catch (error) {
        console.error('Error saving user submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving user submission'
        });
    }
});

// Get all user submissions (for admin)
router.get('/', async (req, res) => {
    try {
        const submissions = await UserSubmission.find()
            .populate('answers.question_id')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user submissions'
        });
    }
});

// Get single user submission by session ID
router.get('/:session_id', async (req, res) => {
    try {
        const submission = await UserSubmission.findOne({ 
            session_id: req.params.session_id 
        }).populate('answers.question_id');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'User submission not found'
            });
        }

        res.json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error fetching user submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user submission'
        });
    }
});

// get payment status by session ID
// Check if user has paid and can proceed
router.get('/:session_id/payment-status', async (req, res) => {
    try {
        const submission = await UserSubmission.findOne({ 
            session_id: req.params.session_id 
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'User submission not found'
            });
        }

        res.json({
            success: true,
            data: {
                plan_type: submission.plan_type,
                payment_status: submission.payment_status,
                has_paid_features: submission.has_paid_features,
                can_proceed: submission.payment_status === 'completed'
            }
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});

// Add answers, prevent duplicates
router.post('/:session_id/add-answers', async (req, res) => {
    try {
        const { session_id } = req.params;
        const { answers } = req.body;

        const user = await UserSubmission.findOne({ session_id });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Merge without duplicates
        answers.forEach(newAnswer => {
            const existingIndex = user.answers.findIndex(a => 
                a.question_id.toString() === newAnswer.question_id
            );
            
            if (existingIndex !== -1) {
                // Update existing
                user.answers[existingIndex] = newAnswer;
            } else {
                // Add new
                user.answers.push(newAnswer);
            }
        });
        
        await user.save();

        res.json({
            success: true,
            message: 'Answers saved successfully'
        });

    } catch (error) {
        console.error('Error saving answers:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving answers'
        });
    }
});

module.exports = router;