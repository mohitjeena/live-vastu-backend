const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
const transporter = require("../utils/email");
const sendPdfMail = require("../services/mail");

router.post("/send-vastu-pdf", async (req, res) => {
      try {
           const { session_id, reportHtml } = req.body;
   
       const user = await UserSubmission.findOne({ session_id });
        
           
       if (!user) {
           return res.json({ success: false });
       }
   
         const file = {
            content: `
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <style>
                            body { font-family: Arial; padding: 20px; }
                        </style>
                    </head>
                    <body>
                        ${reportHtml}
                    </body>
                </html>
            `,
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

       const sent = await sendPdfMail(user.customer_email || 'mjeenaalm09@gmail.com', pdfBuffer);

        return res.json(sent);
   
   
       } catch (err) {
           console.log(err);
           res.status(500).json({
               success: false,
               error: err.message,
           });
       }
});


module.exports = router;