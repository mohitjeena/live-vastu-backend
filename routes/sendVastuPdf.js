const express = require('express');
const router = express.Router();
const UserSubmission = require('../models/UserSubmission');
const nodemailer = require("nodemailer");
const pdf = require("html-pdf-node");

router.post("/send-vastu-pdf", async (req, res) => {
      try {
           const { session_id, reportHtml } = req.body;
   
       const user = await UserSubmission.findOne({ session_id });
        
           
       if (!user) {
           return res.json({ success: false });
       }
   
           // Convert HTML to PDF
           const file = { content: reportHtml };
           const pdfBuffer = await pdf.generatePdf(file, {
               format: "A4",
               printBackground: true,
               margin: {
                   top: "20px",
                   bottom: "20px",
                   left: "20px",
                   right: "20px"
               }
           });
   
           // Send Email
           const transporter = nodemailer.createTransport({
               service: "gmail",
               auth: {
                   user: "mjeenaalm09@gmail.com",
                   pass: "hnhzxtmxlatlleoj",
               },
           });
   
           const mailOptions = {
               from: "mjeenaalm09@gmail.com",
               to: user.customer_email || 'mjeenaalm01@gmail.com',
               subject: "Your Vastu Report",
               text: "Please find your PDF report attached.",
               attachments: [
                   {
                       filename: "report.pdf",
                       content: pdfBuffer,
                       contentType: "application/pdf"
                   }
               ]
           };
   
           await transporter.sendMail(mailOptions);
   
           res.json({
               success: true,
               message: "Email sent successfully!"
           });
   
       } catch (err) {
           console.log(err);
           res.status(500).json({
               success: false,
               error: err.message,
           });
       }
});


module.exports = router;