const Brevo = require("@getbrevo/brevo");

 const sendPdfMail = async (toEmail, pdfUrl) => {
    try {
        const apiInstance = new Brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(
            Brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const emailData = {
            sender: { 
                email: process.env.BREVO_EMAIL, 
                name: "Vastu Report" 
            },
            to: [{ email: toEmail }],
            subject: "Your Vastu Report",
             htmlContent: `
          <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Your Vastu Scan Report is Ready</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, sans-serif; color:#222;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:870px; border:1px solid #eeeeee;">
          
          <tr>
            <td style="background:#2f4156; color:#ffffff; text-align:center; padding:18px 20px; font-size:20px; font-weight:bold;">
              Your Vastu Scan Report is Ready
            </td>
          </tr>

          <tr>
            <td style="padding:28px 22px 30px 22px; font-size:13px; line-height:1.7;">
              <p>Dear User,</p>

              <p>
                Thank you for using <strong>Live Vaastu</strong>.
              </p>

              <p>
                Your <strong>Vastu Scan Report</strong> has been successfully prepared based on the information you provided during your Vastu assessment.
              </p>

              <p>
                Our system has analyzed your property details according to Vastu principles. Your personalized report is now available for download.
              </p>

              <p style="margin-bottom:8px;"><strong>Report Includes:</strong></p>

              <ul style="padding-left:20px; margin-top:0;">
                <li>Direction-wise Vastu Analysis</li>
                <li>Energy Balance Assessment</li>
                <li>Positive &amp; Negative Zones</li>
                <li>Key Vastu Observations</li>
                <li>Personalized Recommendations</li>
              </ul>

              <p>
                To access your report, please click the link below.
              </p>

              <p style="margin:18px 0;">
                <a href="${pdfUrl}" style="color:#0056b3; text-decoration:underline; font-weight:bold;">
                  Download Your Vastu Report
                </a>
              </p>

              <p>
                If you have any questions or would like a detailed consultation, our team will be happy to assist you.
              </p>

              <p>
                Thank you for choosing Live Vaastu.
              </p>

              <p style="margin-top:22px;">
                Warm regards,<br />
                <strong>Live Vaastu Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f1f1f1; text-align:center; padding:14px 20px; font-size:11px; color:#555;">
              © 2026 Live Vaastu. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
        };

        const response = await apiInstance.sendTransacEmail(emailData);
        console.log("Email sent:", response);

        return { success: true , message: "PDF mailed."};

    } catch (error) {
        console.error("Brevo API Error:", error);
        return { success: false, error: error.message };
    }
};


module.exports =  sendPdfMail
