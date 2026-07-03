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
<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif; color:#222;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden;">
          
          <tr>
            <td style="background:#B32A2D; padding:28px 25px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:26px; line-height:34px;">
                Your Vastu Scan Report is Ready
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 28px;">
              <p style="font-size:16px; line-height:26px; margin:0 0 18px;">Namaste 🙏</p>

              <p style="font-size:16px; line-height:26px; margin:0 0 18px;">
                Thank you for using our <strong>Vastu Scan</strong> service. We have successfully analyzed your property details, and your personalized <strong>Vastu Scan Report</strong> is now ready.
              </p>

              <p style="font-size:16px; line-height:26px; margin:0 0 22px;">
                This report includes a detailed analysis of your space based on key Vastu principles and highlights important observations related to energy balance, direction alignment, and areas that may need attention.
              </p>

              <h2 style="font-size:20px; color:#B32A2D; margin:0 0 15px;">
                What’s Included in Your Report:
              </h2>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:25px;">
                <tr><td style="font-size:15px; line-height:26px;">✅ Direction-wise Vastu Analysis</td></tr>
                <tr><td style="font-size:15px; line-height:26px;">✅ Identification of Positive & Negative Energy Zones</td></tr>
                <tr><td style="font-size:15px; line-height:26px;">✅ Key Vastu Observations for Your Property</td></tr>
                <tr><td style="font-size:15px; line-height:26px;">✅ Areas That May Be Causing Imbalance</td></tr>
                <tr><td style="font-size:15px; line-height:26px;">✅ Personalized Recommendations for Improvement</td></tr>
              </table>

              <p style="font-size:16px; line-height:26px; margin:0 0 24px;">
                You can download your complete report by clicking the button below.
              </p>

              <div style="text-align:center; margin:30px 0;">
                <a href="${pdfUrl}" 
                   style="background:#FDB913; color:#000000; text-decoration:none; padding:14px 28px; border-radius:6px; font-weight:bold; display:inline-block; font-size:16px;">
                  Download Your Vastu Report
                </a>
              </div>

              <p style="font-size:16px; line-height:26px; margin:0 0 18px;">
                We hope this report helps you create a more balanced, peaceful, and prosperous environment for your home or workplace.
              </p>

              <p style="font-size:16px; line-height:26px; margin:0 0 22px;">
                If you would like a detailed consultation or guidance on remedies, feel free to connect with our team.
              </p>

              <p style="font-size:16px; line-height:26px; margin:0 0 8px;">
                <strong>Wishing you positivity, prosperity, and harmony.</strong> ✨
              </p>

              <p style="font-size:16px; line-height:26px; margin:0;">
                <strong>Team Live Vaastu</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#222222; padding:18px 25px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:13px; line-height:20px;">
                © Live Vaastu. All rights reserved.
              </p>
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
