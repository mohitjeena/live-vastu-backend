// routes/imageUpload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinaryConfig');

// Store files in memory (not disk)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/upload-image/:session_id/:question_id
router.post('/:session_id/:question_id', 
    upload.array('images', 5), // Max 5 images
    async (req, res) => {
        try {
            const { session_id, question_id } = req.params;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No images uploaded'
                });
            }
            
            // Upload first image to Cloudinary
            const file = req.files[0];
            const result = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                {
                    folder: 'vastu-images'
                }
            );
            
            // Return success with URL
            res.json({
                success: true,
                data: {
                    url: result.secure_url,
                    public_id: result.public_id
                },
                message: 'Image uploaded successfully'
            });
            
        } catch (error) {
            console.error('Image upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading image'
            });
        }
    }
);

module.exports = router;