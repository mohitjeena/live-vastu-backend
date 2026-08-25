const axios = require("axios");

const DEFAULT_AI_HEADER_TEMPLATE = `
  <div style="width:100%; background-color: #f7f3ef; margin:0 25px; padding:10px 10px 8px 10px; font-family:'Josefin Sans', Arial, sans-serif; border-bottom:2px solid #D60000; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196 63" style="height:36px; width:auto; display:block;">
      <path fill="#B12424" d="M118 22h7l3 17 1.496-3.465 1.941-4.472.987-2.288c2.463-5.662 2.463-5.662 3.576-6.775q3.5-.062 7 0 .506 2.625 1 5.25l.563 2.953C145 33 145 33 145 37c1.707-1.036 1.707-1.036 3-3l-.625-3.375C147 27 147 27 149 24.063c3.674-2.526 5.625-2.55 10-2.063l3 1 1-1a91 91 0 0 1 5.129-.098l3.135.01 3.298.026 3.311.013q4.064.018 8.127.049c.106 5.482-.531 9.767-2 15l3-1c1.037-3.254 1.037-3.254 1.688-7.062.25-1.29.502-2.581.761-3.91L190 22h6q-.387 3.345-.812 6.688l-.458 3.761c-.86 4.18-2.078 7.253-5.48 9.926-3.386.94-5.872.485-9.25-.375-2.247-2.237-2.982-3.38-3.074-6.578l.387-2.672.363-2.703L178 28h-5l-.148 2.012c-.743 8.77-.743 8.77-2.852 12.988h-6l2-14c-4.605-1.453-4.605-1.453-7 0l1.563 1.625C162 33 162 33 162.063 36c-1.063 3-1.063 3-3.625 5.438-4.507 2.048-6.626 1.43-11.438.562l-3 1c-2.687-.437-2.687-.437-5-1v-3h-5l-2 4-12-1v-3c-1.975.348-1.975.348-4 1l-1 2c-3.062.625-3.062.625-6 1 .616-4.96 2.798-8.937 5.063-13.312l1.142-2.245Q116.595 24.718 118 22m36 5v2l4-1zm-35 4 1 2Zm31 4v2h5l-2-2z"/>
      <path fill="#FDB813" d="M12 0h2c4.952 8.71 4.952 8.71 4 14-1.49 3.436-3.2 6.718-5 10l-1 2 3.25-.312C19 26 19 26 21.5 28.063c1.941 3.8 1.576 5.864.5 9.937-2 2-2 2-4.437 2.313C14.607 39.953 13.81 39.288 12 37c1.398 2.929 2.737 5.649 4.688 8.25C18 47 18 47 18 49h3l.813-1.687C23 45 23 45 24.625 42.937 26.812 38.266 26.947 34.055 26 29c-1.62-3.238-3.475-6.212-5.43-9.258C18.462 16.062 18.107 14.11 19 10l3-2 .563 3.375c1.187 4.872 3.8 8.363 6.78 12.328C33.013 28.79 33.934 32.788 33 39c-2.403 6.941-7.187 15.594-14 19-.656 2.527-.656 2.527-1 5-3.137-.321-4.693-.723-7.062-2.863C3.81 51.128-1.078 42.139-.626 30.379c1.404-7.59 5.47-14.259 9.813-20.547C11.312 6.512 11.688 3.892 12 0m-1 16 1 2Zm-1 2-1 4 2-4zm-2 4-1 4 2-4zm-2 4 1 4Zm-1 4v7h1v-7zm8 1-1 2c1.812 2.062 1.812 2.062 4 4h3v-5zm-7 7 1 2Zm1 3 1 2Zm2 4 1 2Zm5 7 1 2Z"/>
      <path fill="#B12424" d="M39 22h7q-.463 3.188-.937 6.375l-.528 3.586C44 35 44 35 43 37h7l3-15h13l2 7 4-7h19v6l-4 1v6h-6v2h8v5l-15 1 1-14-2.625 6.438C70.898 39.058 70.898 39.058 69 42c-3.21.91-3.21.91-6 1-1.425-3.99-2.4-7.805-3-12-1.273 3.648-2.328 7.194-3 11-7.04.939-13.903 1.108-21 1-.306-6.736-.048-14.903 3-21"/>
      <path fill="#B12324" d="M98 22h7l1 7 4-7h6c-1.437 4.608-3.224 8.967-5.312 13.313l-.858 1.916c-1.455 3.01-2.273 4.548-5.435 5.814C102 43 102 43 100 41c-.41-1.971-.41-1.971-.633-4.352l-.254-2.578-.238-2.695-.262-2.719A954 954 0 0 1 98 22"/>
      <path fill="#241E21" d="M99.25 48.813 102 50v2h-6l-1 4h3l-1-3c5.248-1.82 8.433-1.928 14-1 2.681-.386 2.681-.386 5-1h6v-2h3v10c-9 0-9 0-12.375-.562-3.33-.402-5.42-.17-8.625.562l-2-1-3.437.625C95 59 95 59 93.063 57.875 91.624 55.336 91.497 53.872 92 51c2.525-3.01 3.397-3.15 7.25-2.187M105 53v4h2v-4zm8 0 1 4v-4zm8 0 1 4Z"/>
      <path fill="#241F21" d="m145 48 1 2 2.5.875C151 52 151 52 151.938 53.938 152 56 152 56 150 59l-2.187-.562c-2.715-.588-2.715-.588-5 0-4.277.855-8.456.62-12.813.562V49h2v7h5v-7c5.75-1 5.75-1 8-1"/>
      <path fill="#241F20" d="M86 7c6.625-.25 6.625-.25 10 2l2-2c3.125.375 3.125.375 6 1 .098 6.152.098 6.152 0 8-1 1-1 1-3.937 1.063L97 17h-6v-7h-2v7h-3zM59 48l1 3h5l1 8c-9 0-9 0-12-1l-1-2-1 3h-3c-1.316-3.62-2-6.096-2-10h8l1 2z"/>
      <path fill="#241F21" d="m37 4 3.813-.125 2.144-.07C45 4 45 4 48 6c.398 2.094.398 2.094.375 4.5l.023 2.406L48 15c-3.089 2.06-3.71 2.239-7.187 2.125L37 17zm4 3v7l4-1V8z"/>
      <path fill="#241E21" d="M64 4c6.836-.195 6.836-.195 9 0l2 2c-.187 2.5-.187 2.5-1 5-3 2-3 2-6 2v4h-4zm4 3v2h3V7z"/>
      <path fill="#231E20" d="M156 7h3v3h2V7h3l1 2 1-2h3c-.458 3.47-.891 6.674-2 10h-9z"/>
      <path fill="#241F21" d="M137 4h4v3l5 1v9h-3v-7c-2.287 1.839-2.287 1.839-2.125 4.625L141 17h-4z"/>
      <path fill="#241E21" d="M87 48h2c1.417 4.25.193 6.719-1 11l-1.937-.562L84 58l-1 1c-2.5.125-2.5.125-5 0-1-1-1-1-1.125-4C77 52 77 52 78 51l2.875.125c3.113.199 3.113.199 4.875-1.625zm-7 5v4l2-1-1-3zM134 4c2 2 2 2 2 5l-7-1v5l7-1-1 4c-6.374 1.323-6.374 1.323-8.937 0-1.647-3.099-1.431-5.561-1.063-9 2.161-3.722 4.986-3.427 9-3"/>
      <path fill="#231F21" d="M151.438 6.75 154 7c2.43 3.644 2.162 5.712 2 10h-8c-.84-3.361-1.177-5.704 0-9 1-1 1-1 3.438-1.25"/>
      <path fill="#241F21" d="M178.438 6.813C181 7 181 7 183 9c.27 2.688.087 5.291 0 8h-8c-.84-3.361-1.177-5.704 0-9 1-1 1-1 3.438-1.187"/>
      <path fill="#241F20" d="M191.563 6.938 194 7c1.85 3.123 2.294 5.38 2 9-1 1-1 1-4.062 1.063L189 17c-1.585-2.518-2.037-3.679-1.687-6.687.98-3.296.98-3.296 4.25-3.376"/>
      <path fill="#231F20" d="M107 7c3.125.375 3.125.375 6 1 .625 3.375.625 3.375 1 7l-2 2c-3.625-.375-3.625-.375-7-1-.125-3.375-.125-3.375 0-7z"/>
      <path fill="#241F21" d="M76 7h3v7h2V7h3v10c-3.375.188-3.375.188-7 0-2.567-3.85-1.833-5.586-1-10"/>
      <path fill="#241E21" d="M38 49h3c3 6.625 3 6.625 3 10h-3v-2h-4v2h-3q.715-2.22 1.438-4.437l.808-2.497C37 50 37 50 38 49"/>
      <path fill="#231E20" d="m119 4 1 6h-2v4h2v3l-5-1c-.25-1.434-.474-2.873-.687-4.312l-.387-2.426C114 7 114 7 115.356 5.207 117 4 117 4 119 4"/>
      <path fill="#231F20" d="M49 7h7v3h-3v7h-4z"/>
      <path fill="#241F21" d="m66 51 1.813.563c2.351.658 2.351.658 5.187-.563-.229 1.462-.484 2.92-.75 4.375l-.422 2.46C71 60 71 60 68.922 61.29L67 62l-1-3h2l-1-2.312C66 54 66 54 66 51"/>
      <path fill="#241E21" d="M170 4h3v13h-3z"/>
      <path fill="#241F21" d="M152 49h3v10h-3zM184 4h3v5l-3 1z"/><path fill="#241F20" d="M55 14h3v3h-3z"/>
    </svg>
    <span style="color:#D60000; font-size:12.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">VASTU SHASTRA REPORT</span>
  </div>
`;

const DEFAULT_AI_FOOTER_TEMPLATE = `
  <div style="width:100%; background-color: #f7f3ef; margin:0 25px; padding:6px 10px 12px 10px; font-family:'Josefin Sans', Arial, sans-serif; box-sizing:border-box;">
    <div style="border-top:1px solid #dcd5cc; margin-bottom:8px; width:100%;"></div>
    <div style="display:flex; justify-content:space-evenly; align-items:center; color:#555555; font-size:11px; text-align:center;">
      <span>WEB: <br><b style="color:#D60000; font-size:12.5px;"><a href="https://livevaastu.in/" target="_blank" style="color: #D60000;
    text-decoration: none;">livevaastu.in</a></b></span>
      <span>EMAIL: <br><b style="color:#D60000; font-size:12.5px;"><a href="mailto:contact@livevaastu.com" style="color: #D60000;
    text-decoration: none;">contact@livevaastu.com</a></b></span>
      <span>MOBILE: <br><b style="color:#D60000; font-size:12.5px;"><a href="tel:9555666667" style="color: #D60000;
    text-decoration: none;">95556 66667</a></b></span>
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
    margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" }
  });
}

module.exports = generatePdfFromUrl;
module.exports.generatePdfFromUrl = generatePdfFromUrl;
module.exports.generateStaticPdfFromUrl = generateStaticPdfFromUrl;
module.exports.generateAiPdfFromUrl = generateAiPdfFromUrl;
