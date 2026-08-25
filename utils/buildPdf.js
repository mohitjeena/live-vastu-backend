const axios = require("axios");

const DEFAULT_AI_HEADER_TEMPLATE = `
  <div style="width:100%; margin: 0 25px; padding: 10px 0 8px 0; font-family:'Josefin Sans', sans-serif; border-bottom:2px solid #D60000; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
    <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" style="width:105px; height:auto; display:block;" alt="Logo">
    <span style="color:#D60000; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">VASTU SHASTRA REPORT</span>
  </div>
`;

const DEFAULT_AI_FOOTER_TEMPLATE = `
  <div style="width:100%; margin: 0 25px; padding: 0 0 10px 0; font-family:'Josefin Sans', sans-serif; font-size:9px; text-align:center; box-sizing:border-box;">
    <div style="border-top:1px solid #ddd; margin-bottom:6px; width:100%;"></div>
    <div style="display:flex; justify-content:space-evenly; color:#777;">
      <span>WEB: <br><b style="color:#D60000; font-size:9.5px;">livevaastu.in</b></span>
      <span>EMAIL: <br><b style="color:#D60000; font-size:9.5px;">contact@livevaastu.com</b></span>
      <span>MOBILE: <br><b style="color:#D60000; font-size:9.5px;">95556 66667</b></span>
    </div>
  </div>
`;

function encodeBase64(str) {
  if (!str) return str;
  return Buffer.from(str.trim(), "utf-8").toString("base64");
}

async function generatePdfFromUrl(pdfPageUrl, customPdfOptions = {}) {
  try {
    const pdfConfig = {
      printBackground: true,
      format: "A4",
      ...customPdfOptions
    };

    if (pdfConfig.headerTemplate) {
      pdfConfig.headerTemplate = encodeBase64(pdfConfig.headerTemplate);
    }
    if (pdfConfig.footerTemplate) {
      pdfConfig.footerTemplate = encodeBase64(pdfConfig.footerTemplate);
    }

    const response = await axios.post(
      "https://api.doppio.sh/v1/render/pdf/sync",
      {
        page: {
          goto: {
            url: pdfPageUrl,
            options: {
              waitUntil: ["load", "domcontentloaded"]
            }
          },
          pdf: pdfConfig
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DOPPIO_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000
      }
    );

    return response.data;

  } catch (error) {
    console.log("Doppio Error:", error.response?.data || error.message);
    throw error;
  }
}

async function generateStaticPdfFromUrl(staticPdfUrl) {
  return generatePdfFromUrl(staticPdfUrl, {
    printBackground: true,
    format: "A4",
    margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" }
  });
}

async function generateAiPdfFromUrl(aiPdfUrl) {
  return generatePdfFromUrl(aiPdfUrl, {
    printBackground: true,
    format: "A4",
    displayHeaderFooter: true,
    margin: {
      top: "60px",
      bottom: "60px",
      left: "20px",
      right: "20px"
    },
    headerTemplate: DEFAULT_AI_HEADER_TEMPLATE,
    footerTemplate: DEFAULT_AI_FOOTER_TEMPLATE
  });
}

module.exports = generatePdfFromUrl;
module.exports.generatePdfFromUrl = generatePdfFromUrl;
module.exports.generateStaticPdfFromUrl = generateStaticPdfFromUrl;
module.exports.generateAiPdfFromUrl = generateAiPdfFromUrl;