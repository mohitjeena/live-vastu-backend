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
      aiHtml
    );

    res.send(finalHtml); 
    } catch (error) {
         console.log(error);
    res.status(500).send("Error");
    }

   
});

router.get('/generate-report/:sessionId', async (req, res) => {
    try {
        const {sessionId} = req.params;

        
        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

         const pdfPageUrl = `https://live-vastu-backend.onrender.com/api/pdf/temp-pdf/${session_id}`;

    
    const result = await generatePdfFromUrl(pdfPageUrl);

    if(result.renderStatus == 'SUCCESS')
    {
       user.pdf_url =  result.documentUrl;
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

        

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to download PDF');
    }
});


module.exports = router;