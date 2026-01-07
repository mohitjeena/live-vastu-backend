const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
// const transporter = require("../utils/email");
const sendPdfMail = require("../services/mail");

router.post("/send-vastu-pdf", async (req, res) => {
      try {
           const { session_id } = req.body;
   
       const user = await UserSubmission.findOne({ session_id });
        
           
       if (!user) {
           return res.json({ success: false });
       }
   
       const reportHtml = user.vastu_report;
         const file = {
            content: reportHtml
        };

        const options = {
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                bottom: "20px",
                left: "20px",
                right: "20px",
            },
        };


           const pdfBuffer = await pdf.generatePdf(file, options);

       const sent = await sendPdfMail(user.customer_email, pdfBuffer);

        return res.json(sent);
   
   
       } catch (err) {
           console.log(err);
           res.status(500).json({
               success: false,
               error: err.message,
           });
       }
});

router.get('/download-report/:sessionId', async (req, res) => {
    try {
        const {sessionId} = req.params;

        
        const user = await UserSubmission.findOne({ session_id: sessionId });
        if (!user) {
            return res.status(404).send('user not found');
        }

        if(!user.vastu_report)
        {
            return res.status(404).send('report not found');
        }


        const reportHtml = user.vastu_report;

        // 2️⃣ Build HTML file
        const file = {
            content:  reportHtml
        };

        // 3️⃣ PDF options
        const options = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px',
            },
        };

        // 4️⃣ Generate PDF buffer
        const pdfBuffer = await pdf.generatePdf(file, options);

        // 5️⃣ Send PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="vastu-report.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to generate PDF');
    }
});


module.exports = router;