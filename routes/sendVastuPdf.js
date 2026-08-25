const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
// const transporter = require("../utils/email");
const sendPdfMail = require("../services/mail");
const { generateFinalHtml, generateStaticHtml, generateAiReportHtml, extractAnswers } = require("../utils/generatePdf");
const UserDetails = require("../models/userDetails");
const { generatePdfFromUrl, generateStaticPdfFromUrl, generateAiPdfFromUrl } = require("../utils/buildPdf");
const uploadPdfToDrive = require("../utils/uploadPdfToDrive");
const { PDFDocument } = require("pdf-lib");

const axios = require('axios');


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

// 1. Static Pages HTML Endpoint (Cover, Details, Intro, Direction Templates)
router.get("/temp-pdf-static/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await UserSubmission.findOne({ session_id: id });
        if (!user) {
            return res.status(404).send("User submission not found for session id: " + id);
        }

        const details = await UserDetails.findOne({ userId: user._id });
        const userAnswers = extractAnswers(user.answers || []);
        const staticHtml = generateStaticHtml(userAnswers, details?.toObject() || {});

        res.send(staticHtml);
    } catch (error) {
        console.error("Error in /temp-pdf-static/:id:", error);
        res.status(500).send("Error: " + error.message);
    }
});

// 2. AI Report HTML Endpoint (Clean continuous AI report)
router.get("/temp-pdf-ai/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await UserSubmission.findOne({ session_id: id });
        if (!user) {
            return res.status(404).send("User submission not found for session id: " + id);
        }

        const aiHtml = user.vastu_report || "";
        const formattedAiHtml = generateAiReportHtml(aiHtml);

        res.send(formattedAiHtml);
    } catch (error) {
        console.error("Error in /temp-pdf-ai/:id:", error);
        res.status(500).send("Error: " + error.message);
    }
});

// 3. Unified HTML Endpoint (Full report for web preview or fallback)
router.get("/temp-pdf/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await UserSubmission.findOne({ session_id: id });
        if (!user) {
            return res.status(404).send("User submission not found for session id: " + id);
        }

        // 👉 Details fetch (IMPORTANT)
        const details = await UserDetails.findOne({ userId: user._id });

        // 👉 Extract answers
        const userAnswers = extractAnswers(user.answers || []);

        const aiHtml = user.vastu_report || "";

        // 👉 Final HTML
        const finalHtml = generateFinalHtml(
          userAnswers,
          details?.toObject() || {},
          aiHtml,
          user.plan_type
        );

        res.send(finalHtml); 
    } catch (error) {
        console.error("Error in /temp-pdf/:id:", error);
        res.status(500).send("Error: " + error.message);
    }
});

router.post('/generate-report/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

        const isPaidPlanWithAi = ['silver', 'gold', 'platinum'].includes(user.plan_type) && !!user.vastu_report;
        let finalPdfUploadData;

        if (isPaidPlanWithAi) {
            console.log(`[GENERATE-REPORT] Generating separate static & AI PDFs for ${sessionId} (${user.plan_type})...`);
            
            const staticPdfPageUrl = `https://live-vastu-backend.onrender.com/api/pdf/temp-pdf-static/${sessionId}`;
            const aiPdfPageUrl = `https://live-vastu-backend.onrender.com/api/pdf/temp-pdf-ai/${sessionId}`;

            // 1. Render both PDFs concurrently via Doppio
            const [staticResult, aiResult] = await Promise.all([
                generateStaticPdfFromUrl(staticPdfPageUrl),
                generateAiPdfFromUrl(aiPdfPageUrl)
            ]);

            if (staticResult.renderStatus !== 'SUCCESS') {
                throw new Error('Static PDF render failed: ' + JSON.stringify(staticResult));
            }
            if (aiResult.renderStatus !== 'SUCCESS') {
                throw new Error('AI PDF render failed: ' + JSON.stringify(aiResult));
            }

            // 2. Fetch both PDF byte streams
            const [staticBufferRes, aiBufferRes] = await Promise.all([
                axios.get(staticResult.documentUrl, { responseType: 'arraybuffer' }),
                axios.get(aiResult.documentUrl, { responseType: 'arraybuffer' })
            ]);

            // 3. Merge both PDFs using pdf-lib
            const mergedPdfDoc = await PDFDocument.create();

            const staticPdfDoc = await PDFDocument.load(staticBufferRes.data);
            const staticPages = await mergedPdfDoc.copyPages(staticPdfDoc, staticPdfDoc.getPageIndices());
            staticPages.forEach(page => mergedPdfDoc.addPage(page));

            const aiPdfDoc = await PDFDocument.load(aiBufferRes.data);
            const aiPages = await mergedPdfDoc.copyPages(aiPdfDoc, aiPdfDoc.getPageIndices());
            aiPages.forEach(page => mergedPdfDoc.addPage(page));

            const mergedPdfBytes = await mergedPdfDoc.save();
            console.log(`[GENERATE-REPORT] PDFs merged successfully for ${sessionId}. Total pages: ${mergedPdfDoc.getPageCount()}`);

            finalPdfUploadData = Buffer.from(mergedPdfBytes);
        } else {
            // Basic / Bronze fallback: Unified PDF
            console.log(`[GENERATE-REPORT] Generating unified PDF for ${sessionId} (${user.plan_type})...`);
            const pdfPageUrl = `https://live-vastu-backend.onrender.com/api/pdf/temp-pdf/${sessionId}`;
            const result = await generatePdfFromUrl(pdfPageUrl);

            if (result.renderStatus !== 'SUCCESS') {
                throw new Error('PDF render failed: ' + JSON.stringify(result));
            }

            finalPdfUploadData = result.documentUrl;
        }

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

        const driveResult = await uploadPdfToDrive(finalPdfUploadData, sessionId);

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
        await user.save();

        return res.status(200).json("pdf generated successfully");
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