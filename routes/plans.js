const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');

// Get all active plans
router.get('/', async (req, res) => {
    try {
        const plans = await Plan.find({ is_active: true }).sort({ price: 1 });
        
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching plans'
        });
    }
});

// Create or update plan (Admin only)
router.post('/', async (req, res) => {
    try {
        const { type, name, price, features } = req.body;
        
        // Check if plan exists
        const existingPlan = await Plan.findOne({ type });
        
        if (existingPlan) {
            // Update existing plan
            const plan = await Plan.findOneAndUpdate(
                { type },
                { name, price, features },
                { new: true }
            );
            
            res.json({
                success: true,
                data: plan,
                message: 'Plan updated successfully'
            });
        } else {
            // Create new plan
            const plan = new Plan({
                type,
                name,
                price,
                features
            });
            
            await plan.save();
            
            res.status(201).json({
                success: true,
                data: plan,
                message: 'Plan created successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving plan'
        });
    }
});

module.exports = router;