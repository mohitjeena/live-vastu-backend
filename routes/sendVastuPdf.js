const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
// const transporter = require("../utils/email");
const sendPdfMail = require("../services/mail");
const { generateFinalHtml,extractAnswers } =require("../utils/generatePdf")
const UserDetails = require("../models/userDetails")
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const html_to_pdf = require('html-pdf-node');

const axios = require('axios')




router.post("/send-vastu-pdf", async (req, res) => {
      try {
           const { session_id } = req.body;
   
       const user = await UserSubmission.findOne({ session_id });
        
           
       if (!user) {
           return res.json({ success: false });
       }

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

     const response = await axios.post(
  "https://api.doppio.sh/v1/render/pdf",
  {
    html: finalHtml,
    print_options: {
      format: "A4",
      print_background: true
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.DOPPIO_API_KEY}`
    }
  }
);

// base64 PDF milega
const pdfBase64 = response.data.data;
const pdfBuffer =await Buffer.from(pdfBase64, "base64");




        //  const file = {
        //     content: finalHtml
        // };

        // const options = {
        //     format: "A4",
        //     printBackground: true,
        //     margin: {
        //         top: "0px",
        //         bottom: "0px",
        //         left: "0px",
        //         right: "0px",
        //     },
        // };


        //    const pdfBuffer = await pdf.generatePdf(file, options);

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