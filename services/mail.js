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
            subject: "Your Vastu Report PDF",
             htmlContent: `
            <h3>Your report is ready ✅</h3>
            <p>Click below to download:</p>
            <a href="${pdfUrl}" target="_blank">Download PDF</a>
            `
        };

        const response = await apiInstance.sendTransacEmail(emailData);
        console.log("Email sent:", response);

        return { success: true };

    } catch (error) {
        console.error("Brevo API Error:", error);
        return { success: false, error: error.message };
    }
};


module.exports =  sendPdfMail
