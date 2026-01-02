const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const generateVastuReport = require('../services/openaiService').generateVastuReport;
const EmailOtp = require("../models/EmailOtp")
const Brevo = require("@getbrevo/brevo");
const crypto = require("crypto")

// Save user submission (after mobile verification)
router.post('/', async (req, res) => {
    try {
        const { session_id, email, answers, property_type, purpose } = req.body;

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
        let plan_type = 'basic';
        let ai_free_report_txt = ''
        // Generate AI report only if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            try {
                console.log('Generating AI Vastu report...');
                const aiResponse = await generateVastuReport({ session_id, answers, property_type, purpose },plan_type);
                ai_score = aiResponse.score  || ai_score;
                ai_report = aiResponse.report || ai_report;
                if(!aiResponse.report)
                {
                   ai_free_report_txt = aiResponse
                }
            } catch (aiError) {
                console.error('OpenAI error, using default response:', aiError);
                // Continue with default values if OpenAI fails
            }
        }

 

        // Create new user submission
        const userSubmission = new UserSubmission({
            session_id,
            customer_email: email,
            property_type, 
            purpose,
            answers,
            ai_score,
            ai_report,
            ai_free_report_txt,
            is_verified: true ,
            vastu_task: true
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
                can_proceed: submission.payment_status === 'completed',
                answers: submission.answers,
                vastu_task: submission.vastu_task
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
        const { answers,propertyType,purpose } = req.body;

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

        if(propertyType && purpose)
        {
            user.property_type = propertyType,
            user.purpose = purpose
        }
        
        await user.save();
          // Generate AI report only if OpenAI API key is available
          let aiResponse;
        if (process.env.OPENAI_API_KEY) {
            try {
                console.log('Generating AI Vastu report...');
                aiResponse = await generateVastuReport(user, user.plan_type);
                
                if (aiResponse) {
                    if(aiResponse.score)
                    {
                    user.vastu_report = JSON.stringify(aiResponse);
                    
                    }else{
                        user.ai_paid_report_txt = aiResponse
                    }
                    user.report_check = false;
                    user.vastu_task = true;
                    await user.save();

                    // mail for confirmation message of complete paid questions
         
        const apiInstance = new Brevo.TransactionalEmailsApi();
                apiInstance.setApiKey(
                    Brevo.TransactionalEmailsApiApiKeys.apiKey,
                    process.env.BREVO_API_KEY
                );
        
                const emailData = {
                    sender: { 
                        email: process.env.BREVO_EMAIL, 
                        name: "Vastu Confirmation" 
                    },
                    to: [{ email: user.customer_email }],
                    subject: "Your Vastu Consultation Has Been Successfully Submitted",
                    htmlContent: `
                    <table> <tr> </td>
                    <tr> 
                    <td style="background:#2c3e50; padding:20px; text-align:center;"> <h1 style="color:#ffffff; margin:0; font-size:22px;"> Vastu Report Confirmation </h1> </td> 
                    </tr> 
                    
                   
                    <tr> 
                    <td style="padding:25px; color:#333333;"> 
                    <p style="font-size:15px; margin:0 0 15px;"> Dear User, </p> 
                    <p style="font-size:14px; line-height:1.6;"> Thank you for successfully completing your <strong>paid Vastu consultation questionnaire</strong>. We have received all your responses and the details have been securely recorded. </p> <p style="font-size:14px; line-height:1.6;"> Our expert <strong>Dr. Puneet Chawla</strong> is now analyzing your inputs based on authentic Vastu Shastra principles to prepare your <strong>personalized Vastu report</strong>. </p> 
                    <p style="font-size:14px; line-height:1.6;"> 🔍 <strong>Next: </strong> 
                    </p> 
                    <ul style="font-size:14px; line-height:1.6; padding-left:20px;"> 
                    <li>Your responses are under expert review</li> <li>A detailed Vastu analysis is being generated</li> 
                    <li>You will receive your complete Vastu report shortly
                    </li> 
                    <li>You can track you vastu report here <a href="https://account.livevaastu.in/orders/${user.order_id}" target="_blank">Click Here</a>
                    </li> 
                    </ul> 
                    
                    
                    <p style="font-size:14px; margin-top:20px;"> Thank you for trusting us for your Vastu guidance. </p> 
                    
                    <p style="font-size:14px; margin-top:10px;"> Warm regards,<br /> <strong>Vastu Consultation Team</strong><br /> Guided by Dr. Puneet Chawla </p> 
                    </td> </tr> 
                    
                    <tr> <td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;"> © 2026 Live Vaastu. All rights reserved. </td> </tr> 
                    
                    
                    </td> </tr> </table>`,
                    
                };
        
                const response = await apiInstance.sendTransacEmail(emailData);
                
           
                } 
                
            } catch (aiError) {
                console.error('OpenAI error, using default response:', aiError);
                // Continue with default values if OpenAI fails
            }
        }

        

        res.json({
            success: true,
            message: 'Answers saved successfully',
            data: aiResponse
        });

    } catch (error) {
        console.error('Error saving answers:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving answers'
        });
    }
});

router.post("/save-report", async (req, res) => {
    try {
        const { session_id, reportHtml } = req.body;

        
        if (!session_id || !reportHtml) {
            return res.status(400).json({
                success: false,
                message: "session_id and reportHtml are required"
            });
        }

    const user = await UserSubmission.findOne({ session_id });
     
        
     if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
    let oldReport = JSON.parse(user.vastu_report)
    oldReport.report_html = reportHtml
     user.vastu_report  = JSON.stringify(oldReport);
     user.report_check = true;
     await user.save();

        

        res.json({
            success: true,
            message: "Report saved successfully"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }

});


// check user images completeness/

router.get("/check-user-images/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserSubmission.findOne({ session_id: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const profileImageValid =
            user.profile_image &&
            user.profile_image.url ;

        const mapImagesValid =
            Array.isArray(user.map_images) &&
            user.map_images.length >0

        return res.json({
            success: true,
            data: {
                profileImageValid,
                mapImagesValid,
                allValid: profileImageValid && mapImagesValid
            }
        });

    } catch (err) {
        console.error("Error checking user images:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


// send otp to email
router.post("/send-email-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email required" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

         await EmailOtp.findOneAndUpdate(
      { email },
      {
        email_otp: otp,
        email_otp_expires: expiresAt,
        email_verified: false
      },
      { upsert: true, new: true }
    );


        // mail OTP
        const apiInstance = new Brevo.TransactionalEmailsApi();
                apiInstance.setApiKey(
                    Brevo.TransactionalEmailsApiApiKeys.apiKey,
                    process.env.BREVO_API_KEY
                );
        
                const emailData = {
                    sender: { 
                        email: process.env.BREVO_EMAIL, 
                        name: "Vastu Verification" 
                    },
                    to: [{ email: email }],
                    subject: "Your OTP for Vastu Report",
                    htmlContent: `<p>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`,
                    
                };
        
                const response = await apiInstance.sendTransacEmail(emailData);
                
                    res.json({
                success: true,
                message: "OTP sent successfully",
                
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'failed to send otp'
        });
    }
});


router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await EmailOtp.findOne({ email });

    if (!record) {
      return res.json({
        success: false,
        message: "Please send OTP."
      });
    }

   
    if (record.email_otp_expires < new Date()) {
      await EmailOtp.deleteOne({ email });
      return res.json({
        success: false,
        message: "OTP expired"
      });
    }

  
    if (record.email_otp !== otp) {
      return res.json({
        success: false,
        message: "Invalid OTP"
      });
    }

   
    record.email_verified = true;
    await record.save();

    
    await EmailOtp.deleteOne({ email });

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
});



router.get("/user-plans/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const reports = await UserSubmission.find({ customer_email: email })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;