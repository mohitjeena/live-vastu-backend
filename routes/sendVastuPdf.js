const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");
const transporter = require("../utils/email");

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

        const info = await transporter.sendMail({
            from: "livevastu <mjeenaalm01@gmail.com>",  
            to: user.customer_email || 'mjeenaalm09@gmail.com',
            subject: "Your Vastu Report",
            text: "Your Vastu report is attached.",
            attachments: [
                {
                    filename: "vastu-report.pdf",
                    content: pdfBuffer
                }
            ]
        });

        res.json({ success: true, message: "Email sent!", info });
   
   
       } catch (err) {
           console.log(err);
           res.status(500).json({
               success: false,
               error: err.message,
           });
       }
});


module.exports = router;