import Brevo from "@getbrevo/brevo";

 const sendPdfMail = async (toEmail, pdfBuffer) => {
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
            htmlContent: "<p>Your report is attached.</p>",
            attachment: [
                {
                    name: "vastu-report.pdf",
                    content: pdfBuffer.toString("base64")
                }
            ]
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
