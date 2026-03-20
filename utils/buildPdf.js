const axios = require("axios");

async function generatePdfFromUrl(pdfPageUrl) {
  try {
    const response = await axios.post(
      "https://api.doppio.sh/v1/render/pdf/sync",
      {
        page: {
          goto: {
            url: pdfPageUrl,
            options: {
              waitUntil: ["networkidle0"]
            }
          },
          pdf: {
            printBackground: true,
            format: "A4"
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DOPPIO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;

  } catch (error) {
    console.log("Doppio Error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = generatePdfFromUrl