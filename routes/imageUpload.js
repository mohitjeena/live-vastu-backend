const express = require('express');
const router = express.Router();
const cloudinary = require('../utils/cloudinaryConfig');
const UserSubmission = require('../models/UserSubmission');

// POST /api/submit-images/:session_id
router.post('/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;
        const { profile_image, map_images } = req.body;

        console.log('Received image submission for session:', session_id);
        console.log('Profile image received:', !!profile_image);
        console.log('Map images received:', map_images?.length || 0);

        // 1. Find user
        const user = await UserSubmission.findOne({ session_id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const uploadResults = {
            profile: null,
            maps: []
        };

        // 2. Upload Profile Image to Cloudinary
        if (profile_image && profile_image.data) {
            console.log('Uploading profile image to Cloudinary...');
            
            const profileResult = await cloudinary.uploader.upload(
                profile_image.data, // Base64 string
                {
                    folder: `vastu/users/${session_id}/profile`,
                    public_id: `profile_${Date.now()}`
                }
            );
            if(profileResult && profileResult.secure_url){
            uploadResults.profile = {
                url: profileResult.secure_url,
                public_id: profileResult.public_id,
                filename: profile_image.filename || 'profile.jpg',
                uploaded_at: new Date()
            };
        }

            // Save to user document
            user.profile_image = uploadResults.profile;
            console.log('Profile image uploaded:', uploadResults.profile.url);
        }

        // 3. Upload Map Images to Cloudinary
        if (map_images && map_images.length > 0) {
            console.log(`Uploading ${map_images.length} map images to Cloudinary...`);
            
            for (const [index, mapImage] of map_images.entries()) {
                try {
                    const mapResult = await cloudinary.uploader.upload(
                        mapImage.data, // Base64 string
                        {
                            folder: `vastu/users/${session_id}/maps`,
                            public_id: `map_${Date.now()}_${index}`
                        }
                    );

                    uploadResults.maps.push({
                        url: mapResult.secure_url,
                        public_id: mapResult.public_id,
                        filename: mapImage.filename || `map_${index}.jpg`,
                        uploaded_at: new Date()
                    });

                    console.log(`Map image ${index + 1} uploaded:`, mapResult.secure_url);
                    
                } catch (mapError) {
                    console.error(`Error uploading map image ${index}:`, mapError);
                    // Continue with other images
                }
            }

            // Save all map images to user
            user.map_images = uploadResults.maps;
        }

        // 4. Save updated user document
        await user.save();
        console.log('User document updated with images');

        // 5. Send success response
        res.json({
            success: true,
            data: {
                profile_uploaded: !!uploadResults.profile,
                maps_uploaded: uploadResults.maps.length,
                profile_url: uploadResults.profile?.url,
                total_images: (uploadResults.profile ? 1 : 0) + uploadResults.maps.length
            },
            message: 'Images uploaded successfully'
        });

    } catch (error) {
        console.error('Image submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading images: ' + error.message
        });
    }
});

module.exports = router;