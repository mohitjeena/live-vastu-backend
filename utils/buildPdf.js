const axios = require("axios");

const DEFAULT_AI_HEADER_TEMPLATE = `
  <div style="width:100%; margin: 0 25px; padding: 0 0 8px 0; font-family:'Josefin Sans', sans-serif; border-bottom:2px solid #D60000; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
    <div style="display:flex; align-items:center; gap:8px;">
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="#D60000" stroke-width="4" fill="#FFF8F6"/>
        <path d="M50 12 L50 88 M12 50 L88 50 M23 23 L77 77 M23 77 L77 23" stroke="#AC7F5E" stroke-width="3"/>
        <circle cx="50" cy="50" r="18" fill="#D60000"/>
        <circle cx="50" cy="50" r="8" fill="#FFF8F6"/>
      </svg>
      <div style="display:flex; flex-direction:column; justify-content:center;">
        <span style="color:#D60000; font-size:15px; font-weight:800; letter-spacing:0.8px; line-height:1.1;">LIVE VAASTU</span>
        <span style="color:#666666; font-size:7.5px; font-weight:600; letter-spacing:0.5px; margin-top:2px;">DR. ANAND BHARADWAJ</span>
      </div>
    </div>
    <span style="color:#D60000; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">VASTU SHASTRA REPORT</span>
  </div>
`;

const DEFAULT_AI_FOOTER_TEMPLATE = `
  <div style="width:100%; margin: 0 25px; padding: 0; font-family:'Josefin Sans', sans-serif; font-size:9px; text-align:center; box-sizing:border-box;">
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
      top: "100px",
      bottom: "90px",
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
