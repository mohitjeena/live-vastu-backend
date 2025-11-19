const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const generateVastuReport = require('../services/openaiService').generateVastuReport;

// Save user submission (after mobile verification)
router.post('/', async (req, res) => {
    try {
        const { session_id, mobile_number, answers } = req.body;

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
                const parsed = parseAIResponse(aiResponse);
                ai_score = parsed.score;
                ai_report = parsed.report;
            } catch (aiError) {
                console.error('OpenAI error, using default response:', aiError);
                // Continue with default values if OpenAI fails
            }
        }

        const parseAIResponse = (aiResponse) => {
    console.log('Structured AI Response:', aiResponse);
    return {
        score: aiResponse.score || 75, // Default if missing
        report: aiResponse.report || "Vastu analysis report will be available soon."
    };
};

        // Create new user submission
        const userSubmission = new UserSubmission({
            session_id,
            mobile_number,
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

module.exports = router;