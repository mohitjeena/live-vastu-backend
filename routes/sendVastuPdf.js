const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
// const transporter = require("../utils/email");
const sendPdfMail = require("../services/mail");
const { generateFinalHtml,extractAnswers } =require("../utils/generatePdf")
const UserDetails = require("../models/userDetails")
const generatePdfFromUrl = require("../utils/buildPdf")
const uploadPdfToDrive = require("../utils/uploadPdfToDrive");

const axios = require('axios')


router.post("/send-vastu-pdf", async (req, res) => {
      try {
           const { session_id } = req.body;
   
       const user = await UserSubmission.findOne({ session_id });
        
           
       if (!user) {
           return res.json({ success: false });
       }


    if(user.pdf_url)
    {
        const sent = await sendPdfMail(user.customer_email, user.pdf_url);
        return res.json(sent);
    }
    else{
        return res.json({
            success: true,
            message: "first generate the pdf before send to mail."
        })
    }
   
   
       } catch (err) {
           console.log(err);
           res.status(500).json({
               success: false,
               error: err.message,
           });
       }
});


router.get("/temp-pdf/:id",async (req, res) => {

    try {
         const { id } = req.params;

   const user = await UserSubmission.findOne({ session_id: id });

     // 👉 Details fetch (IMPORTANT)
    const details = await UserDetails.findOne({ userId: user._id });

   // 👉 Extract answers
    const userAnswers = extractAnswers(user.answers);

       const aiHtml = user.vastu_report;

        // 👉 Final HTML
    const finalHtml = generateFinalHtml(
      userAnswers,
      details?.toObject() || {},
      aiHtml,
      user.plan_type
    );

    res.send(finalHtml); 
    } catch (error) {
         console.log(error);
    res.status(500).send("Error");
    }

   
});

router.post('/generate-report/:sessionId', async (req, res) => {
    try {
        const {sessionId} = req.params;

        
        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

         const pdfPageUrl = `https://live-vastu-backend.onrender.com/api/pdf/temp-pdf/${sessionId}`;

    
    const result = await generatePdfFromUrl(pdfPageUrl);

    if(result.renderStatus == 'SUCCESS')
    {
        // Delete the old PDF from Google Drive if it exists
        if (user.pdf_report && user.pdf_report.file_id && !user.pdf_report.is_deleted) {
            try {
                const oldFileId = user.pdf_report.file_id;
                console.log(`[RE-GENERATE] Deleting old PDF ${oldFileId} from Google Drive...`);
                const drive = require("../config/googleDrive");
                await drive.files.delete({ fileId: oldFileId });
                console.log(`[RE-GENERATE] Successfully deleted old PDF: ${oldFileId}`);
            } catch (deleteError) {
                if (deleteError.code !== 404 && !deleteError.message?.includes("File not found")) {
                    console.error("[RE-GENERATE] Failed to delete old PDF:", deleteError.message || deleteError);
                }
            }
        }

         const driveResult = await uploadPdfToDrive(
      result.documentUrl,
      sessionId
    );

      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      user.pdf_report = {
      url: driveResult.url,
      file_id: driveResult.file_id,
      filename: driveResult.filename,
      generated_at: new Date(),
      expires_at: expiresAt,
      is_deleted: false,
      };

      
      user.pdf_url = driveResult.url;


       user.save();
        return res.status(200).json("pdf generated successfully")
    }


    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to generate PDF');
    }
});


router.get('/download-report/:sessionId', async (req, res) => {
    try {
        const {sessionId} = req.params;

        
        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

        if(user.pdf_url)
        {
            res.status(200).json({
                success: true,
                pdf: user.pdf_url,
                message: "pdf downloaded successfully"
            })
        }
        else{
            return res.status(200).json({
                success: true,
                message: "first generate the pdf before download the pdf."
            })
        }

        

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to download PDF');
    }
});


// Temporary Test Route: Expire PDF manually and trigger cleanup task
router.post("/test-cleanup-delete/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

        if (!user.pdf_report || !user.pdf_report.file_id) {
            return res.status(400).send('No PDF report exists for this session');
        }

        // Artificially change the expiry to 1 second ago (expired)
        user.pdf_report.expires_at = new Date(Date.now() - 1000);
        await user.save();

        console.log(`[TEST] Expired PDF report manually for session: ${sessionId}`);

        // Import and run the cleanup task immediately
        const { cleanupExpiredPdfs } = require("../utils/cleanupScheduler");
        await cleanupExpiredPdfs();

        res.status(200).json({
            success: true,
            message: "Test cleanup run complete. Check Google Drive and database for changes."
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to manually trigger test cleanup');
    }
});

module.exports = router;