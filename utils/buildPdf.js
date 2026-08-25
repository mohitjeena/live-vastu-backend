const axios = require("axios");

const DEFAULT_AI_HEADER_TEMPLATE = `
  <div style="width:100%; background-color:#f7f3ef; margin:0; padding:10px 25px 8px 25px; font-family:'Josefin Sans', Arial, sans-serif; border-bottom:2px solid #D60000; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
    <div style="display:flex; align-items:center; gap:8px;">
      <svg width="26" height="34" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2 C22 10, 32 16, 35 26 C38 35, 32 46, 20 48 C8 46, 2 35, 5 26 C8 16, 18 10, 20 2 Z" fill="#F5A623"/>
        <path d="M20 12 C21 17, 28 22, 29 28 C30 34, 26 40, 20 42 C14 40, 10 34, 11 28 C12 22, 19 17, 20 12 Z" fill="#F7F3EF"/>
        <path d="M20 20 C20.5 23, 24 26, 24 30 C24 34, 22 37, 20 38 C18 37, 16 34, 16 30 C16 26, 19.5 23, 20 20 Z" fill="#F5A623"/>
      </svg>
      <div style="display:flex; flex-direction:column; line-height:1.1; font-family:'Josefin Sans', Arial, sans-serif;">
        <span style="color:#111111; font-size:9.5px; font-weight:800; letter-spacing:0.2px;">Dr. Puneet Chawla's</span>
        <span style="color:#D60000; font-size:18px; font-weight:900; letter-spacing:-0.4px; font-family:'Impact', 'Arial Black', sans-serif;">LIVE VAASTU</span>
        <span style="color:#111111; font-size:7.5px; font-weight:800; letter-spacing:0.3px;">A Way of Good Life!</span>
      </div>
    </div>
    <span style="color:#D60000; font-size:12.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">VASTU SHASTRA REPORT</span>
  </div>
`;

const DEFAULT_AI_FOOTER_TEMPLATE = `
  <div style="width:100%; background-color:#f7f3ef; margin:0; padding:6px 25px 12px 25px; font-family:'Josefin Sans', Arial, sans-serif; box-sizing:border-box;">
    <div style="border-top:1px solid #dcd5cc; margin-bottom:8px; width:100%;"></div>
    <div style="display:flex; justify-content:space-evenly; align-items:center; color:#555555; font-size:11px; text-align:center;">
      <span>WEB: <br><b style="color:#D60000; font-size:12.5px;">livevaastu.in</b></span>
      <span>EMAIL: <br><b style="color:#D60000; font-size:12.5px;">contact@livevaastu.com</b></span>
      <span>MOBILE: <br><b style="color:#D60000; font-size:12.5px;">95556 66667</b></span>
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
      top: "85px",
      bottom: "75px",
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
