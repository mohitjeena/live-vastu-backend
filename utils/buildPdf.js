const axios = require("axios");

const DEFAULT_AI_HEADER_TEMPLATE = `
  <div style="width:100%; background-color: #f7f3ef; margin:0 25px; padding:10px 10px 8px 10px; font-family:'Josefin Sans', Arial, sans-serif; border-bottom:2px solid #D60000; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1261 426" style="height:36px; width:auto; display:block;"><path fill="#fdb813" fill-rule="evenodd" d="m94 20-1 1-1 20-6 17-15 27-18 26-1 3-15 23-14 29-3 11-2 3-1 8-3 9v7l-2 5v34l1 1 1 12 4 13v4l2 3v3l3 6 3 11 2 2 1 5 2 2 1 4 15 28 19 28 28 35 8 7h2l3 2h8l4-2 4-5v-3l2-4v-6l-1-1-1-7-3-5-17-18-21-26-10-14-1-3-7-10-3-7-2-2v-2l-2-2-6-13-3-10-2-3-1-7-2-3v-5l-1-1-1-9-1-1v-14l-1-1 1-20 1-1 2-14 2-3 1-7 2-3 1-5 15-32 18-30 12-24 1-5 4-9 1-7 2-2 2 2-1 12-2 3-1 10-2 3v3l-3 6v3l-3 5v2l-3 5-3 9-2 2v2l-9 17-1 4-2 2v2l-8 16-1 5-5 11-1 7-2 3-2 15-1 1v31l1 1 1 10 4 14 2 3 4 12 16 29 20 27 15 17 10 9 6 3h5l6-3 12-12 17-20 9-12 9-15 3-3 14-28v-3l3-5v-4l3-7v-5l2-7v-25l-1-1v-6l-4-12v-3l-3-5-2-7-4-6v-2l-23-34-5-5-15-20-11-18-5-16V74l-5 9-1 7-1 1v17l1 1v4l9 21 25 39 12 24 3 11 2 3v5l1 1 1 24-1 1-1 12-2 3-1 7-5 9-1 4-2 2v2l-3 3-4 8-16 20-20 19-6-6-10-14-4-4-23-35-1-4-2-2-8-22v-18l5-12 5-5 9-5h13l9 3 2 2h2l9 8 3 5 2 7-1 8-4 8-5 5-4 2h-8l-3-1-8-8-4-8v-2l-3-4-3-1-2 2v4l1 1 2 11 3 6 8 8 9 4h11l6-3h2l3-2 8-9 3-6 1-8 1-1v-15l-4-13-6-10-11-10-6-3h-3l-5-2-20 1-14 4-3 2h-2l-2-2 1-5 3-7 2-2v-2l2-2 2-5 22-37v-2l3-5 5-14 1-8 2-5V71l-2-4-1-9-9-21Z"/><path fill="#b12524" fill-rule="evenodd" d="m1149 159-1 8-1 1v5l-1 1v7l-2 4v6l-1 1v5l-1 1-2 16-1 1-1 12-2 5v8l-1 1 1 16 4 8 8 8 9 4 9 1 1 1h17l18-5 11-7 7-7 7-13v-3l2-4v-5l2-5 1-12 1-1v-5l2-6v-6l2-4v-7l1-1v-5l2-6 2-18-1-1h-3l-1 1-2-1h-15l-1 1h-4l-13 77-2 6-7 7-7 3h-6l-5-2-4-4-1-3v-10l1-1v-5l1-1v-5l1-1v-5l2-7v-6l2-4v-6l1-1v-5l2-6 1-13 2-4v-4l-1-1h-7l-1 1-3-1h-16l-1 1Zm-15-1h-6l-1 1-2-1h-82l-2 2-1 10-1 1-1 9-1 1v5h27l2 2-3 24-1 1-1 9-1 1v7l-2 4v6l-1 1v5l-1 1v5l-2 7v6l-2 6v6h33l1-1v-5l1-1 2-17 2-5v-7l1-1v-5l2-6 1-12 2-5v-6l2-6 1-11 3-3h28l2-12 1-1v-7l1-1v-6Zm-226 0-1 1h-3l-1-1h-25l-1 1h-5l-13 27v2l-2 2v2l-9 17v2l-3 4v2l-5 9v2l-2 2-2 6-4 6v2l-4 7v2l-3 4v2l-5 9v2l-3 4v3h27l2-1 3-9 2-2v-3l6-8h28l3 3 1 14 2 6h33l1-1v-7l-2-5-1-17-1-1-1-12-1-1v-9l-2-5v-10l-1-1-1-12-1-1v-8l-1-1v-8l-2-7v-7l-1-1v-3Zm-27 44 2 2v9l1 1v7l1 2-3 4h-11l-2-2v-2l5-9 3-9Zm-86-43-2-1h-21l-1 1-2-1h-9l-3 2-1 4-2 2v2l-6 11v2l-3 4v2l-8 15v2l-3 4v2l-10 19v2l-2 2v2l-5 9v2l-3 4v2l-8 15v2l-4 7 1 1h28l6-13v-2l2-2v-3l5-3h27l3 3v10l1 1 1 9h35l-1-11-1-1v-7l-1-1v-7l-1-1v-8l-2-6v-8l-1-1-2-21-1-1v-7l-1-1v-6l-1-1v-8l-2-7v-8Zm-29 42 2 2v4l1 1 1 17-2 2h-11l-2-2v-2l4-7v-2l2-2 1-5Zm-30-43h-3l-1 1-2-1h-20l-2 1-3 6v2l-3 4v2l-3 5-3 9-2 2-4 11-11 22v2l-2 2-2-2-1-8-1-1v-10l-1-1v-7l-1-1v-7l-1-1-2-28-3-2-2 1-1-1h-18l-1 1-7-1-2 1v9l2 6v7l1 1v6l1 1 2 22 2 6v9l2 5 1 16 1 1 1 12 1 1v8l1 1v5l1 2h32l1-1 2-6 2-2v-2l6-11v-2l12-23v-2l33-69Zm-235 0-2 2v4l-1 1v7l-2 6v6l-2 5-1 13-1 1v4l-2 6v7l-3 10v7l-2 6v5l-1 1v5l-2 6v6l-1 1-1 9 1 1h84l2-5v-6l1-1 2-15h-48l-3-3v-5l2-4v-5l2-2h29l2-3 3-24-1-1h-27l-2-2v-6l2-7 2-2h48v-6l2-5 2-16-1-1Zm-8 0h-7l-1 1-2-1h-16l-4 3v2l-13 27v2l-2 2v2l-9 18v2l-6 10-3-5-1-19-1-1v-6l-1-1-3-35-2-1-1 1-2-1h-23l-1 1-1-1h-3l-1 1v6l2 7v8l2 7 2 21 2 5v10l1 1v6l2 7 1 16 2 6v8l1 1v5l2 4h31l18-36v-2l9-17v-2l2-2v-2l6-11v-2l2-2v-2l6-11v-2l2-2 1-4 10-20Zm-111 0-1 1-1-1-1 1-3-1-3 1-1-1h-19l-3 1-2 7-1 13-3 10v7l-1 1v5l-2 6-1 12-2 6v6l-2 5v7l-3 10-1 14-2 4v4l1 1h32l1-1 1-8 1-1 1-12 1-1 1-10 1-1v-5l1-1v-5l1-1v-5l1-1 1-10 1-1v-7l2-4 2-20 2-4v-6l1-1 1-10 1-1v-2Zm-122 0-2 3v7l-3 10v6l-1 1v5l-1 1-1 11-2 6v6l-1 1v5l-2 6v6l-1 1v5l-2 5v6l-1 1v5l-2 6v6l-1 1-1 8 1 1h80l1-1v-5l2-5v-6l2-7-1-3h-44l-2-2 2-16 1-1v-6l2-5 1-12 1-1 2-16 2-6v-7l3-10v-9l-1-1Zm758 3-13-4h-20l-1 1h-4l-17 7-11 10-6 10-3 9v17l4 8 5 5 11 6 27 9 2 2v6l-3 3-6 3h-16l-5-2-6-6-2-3v-2l-2-2-19 13-4 4v3l3 5 7 7 10 6h3l4 2 25 1 1-1h6l4-2h3l9-4 6-4 8-8 5-9 4-13v-14l-4-9-5-5-6-4-23-8h-3l-6-3-3-3v-4l4-4 6-2h9l3 1 11 10 3-1 7-6 7-4 5-4v-4l-8-9Z"/><path fill="#231f20" fill-rule="evenodd" d="M977 370v11h10v-11Zm-40-30-7 6-3 6v17l3 6 4 4 4 2h3l1 1 13-1 6-4 3-5v-2l-8-1-1-1-4 5-2 1h-5l-5-4-1-5 2-2h25v-8l-2-6-3-5-6-4-3-1h-11Zm1 12 5-5h6l4 3 2 5-2 2h-13l-2-2Zm-57-13-1 2v38l1 2h10v-42Zm-161 1-4 2-7 9v3l-1 1v11l1 1v3l6 8 9 4h10l7-3 6-6 3-7v-12l-3-7-4-4-8-4h-11l-1 1Zm7 7h4l4 2 2 2 3 7v4l-2 6-5 5h-3l-1 1-5-2-5-6v-11l1-2Zm-60-5-7 8-1 7-1 1 2 13 2 3 7 6 7 2 12-1 5-3 6-7v-2l2-3v-12l-3-6-9-8h-3l-1-1h-11Zm11 5 6 1 5 5 1 3-1 12-5 5h-3l-1 1-6-2-4-5v-3l-1-1 1-10 5-5Zm-166-8-8 4-4 4-3 7v12l1 1v3l5 7 7 4 13 1 7-3 4-3 4-6 2-6v-7l-4-10-5-5-7-3Zm4 8 7 1 5 6v4l1 1-2 9-5 5h-3l-1 1-1-1h-3l-6-7v-11l1-2Zm-48-8h-9l-1 1-5 17-2 3v3l-3 3-2-2v-3l-2-3v-3l-6-16h-10l-1 1 6 14 1 5 2 3 1 5 2 3 1 5 2 3v6l-4 5h-3l-1 1-2-1-2 1v6l2 2h10l4-2 4-4 5-14 2-3 1-6 3-5v-3l4-8 2-8 2-3Zm-78 3-4 5v3l9 2 4-5h3l1-1 1 1h3l3 3v3l-5 3h-4l-1 1h-4l-6 2-4 4-2 5v4l2 5 3 3 5 2h8l5-2 2-2 4 3h9v-4l-1-1v-27l-2-5-5-4-3-1h-15Zm18 19 2 2v6l-5 5h-7l-3-3v-4l5-4h3Zm424-37-1 3 1 3-1 1 1 2v23l-1 1 1 24h39v-9l-1-1-2 1-1-1h-23l-2-2v-9l1-1-1-3v-28l1-2-1-2Zm145-1-1 1v14l1 1v9l1 1v14l2 3h4l1-1v-8l1-1 1-15 1-1v-16l-1-1Zm-97 1v9h11v-9l-2-1h-8Zm-84-1h-8l-1 1v17l-2 2-6-4h-10l-4 2-4 4-4 10v11l3 8 2 3 4 3 5 2h6l7-3 2-2 2 2v2h9l1-3-1-3 1-1v-49Zm-21 24h6l4 4 2 5-1 12-2 3-4 3h-5l-5-4-2-5v-10l1-3Zm-467-23 3 9v4l2 4v4l3 8v5l2 4 1 8 2 4v4l2 3h11l1-1 1-7 2-4v-4l2-3v-5l3-6v-5l3-5 2 2v3l2 4 1 8 2 3 4 19 1 1h11l1-1 2-10 2-4 1-9 8-29v-4l-1-1h-8l-2 1-6 30-3 4-3-5v-4l-5-15-1-9-2-2h-11l-2 1-1 8-2 3-1 7-2 4v4l-2 6-2 2-3-4v-5l-3-9v-4l-1-1v-4l-2-7-1-1h-9Zm-54-1-4 6v3l-6 13v3l-2 2v2l-2 3-1 5-3 5v3l-3 5-2 8h11l3-6 1-5 5-3 1 1h16l1-1 3 3 2 8 2 3h11l1-1-2-3-1-5-2-2v-3l-8-17-1-5-2-3-6-17-2-2Zm5 16 2 2 1 5 4 9-2 3-3 1-1-1h-6l-2-2 4-13Zm666-16-11-1-6 2-2 2v2l-2 3v6l-2 2h-3l-1 2v6h4l2 2v31l1 1h9l1-2v-30l2-2h6v-7l-1-1h-5l-2-2v-4l3-3h4l1 1 2-1v-5l1-1Zm-306-1-9 3-9 8-4 8-1 16 1 1v4l4 9 6 6 5 3 7 2h12l10-3 9-6v-22l-1-1h-24v9l1 1h10l2 2v5l-2 2-7 3h-10l-8-6-3-7v-6l-1-1 1-1 1-10 6-7h2l3-2h9l4 2 5 7 7-1 4-2-3-7-5-5-6-3h-4l-1-1Zm-48 1-12-1-5 2-3 3-1 10-2 2h-3l-1 1v7h4l2 2v31l1 1h9l1-2v-30l2-2h5l1-1v-6l-1-1h-5l-2-2v-4l3-3h5l1 1 1-1-1-2 2-4ZM361 104v13l1 1h11l2-1v-13Zm636-40 17 53h4l1 1h8l1-1v-2l2-3 4-19 4-5 3 5v3l6 21 1 1 2-1 1 1h8l3-2 1-7 4-9 1-7 2-3 1-6 2-3 5-17h-14v3l-4 10v4l-4 9v4l-2 2-3-5v-4l-3-8v-4l-4-11h-13l-1 1-2 7v4l-4 11v4l-3 5-2-2v-3l-3-7v-4l-2-3-3-13Zm-506 0-1 1v38l3 9 5 5 6 2h8l6-2 7-6 2 2v4l1 1 1-1 3 1 7-1 1-1V65l-1-1h-13v28l-1 1v8l-2 3-5 4h-8l-4-3-1-2v-5l-1-1V64Zm717 0-5 3-4 5-1 3v8l1 3 5 5 6 3 19 5 4 5-5 5h-11l-6-5-1-3-12 1-2 1 3 7 5 5 12 4h12l1-1h4l6-3 7-8V95l-2-4-4-3h-2l-5-3-8-1-4-2-6-1-4-3v-2l5-4h9l2 1 4 5h6l1-1h5l2-2-2-4-6-6-6-2-14-1-1 1Zm-92 7-2 6 12 3 6-7h9l5 4v3l1 1-4 3-20 4-4 2-4 4-3 7v4l1 1v3l3 5 4 3 6 2h9l6-2 5-4 6 5 1-1 3 1 7-1-1-5-2-3V73l-2-4-7-5-7-1-1-1h-10l-1 1-8 1Zm31 23-2 10-6 5h-7l-5-4v-6l3-3 12-4h3ZM946 70l-3 6 1 2h4l7 2 6-7h10l4 4v4l-4 3-16 3-9 4-3 4-2 6v4l2 6 4 5 8 3h9l9-4 2-2h1l2 2v2l2 1h11l1-2-2-4v-6l-1-1V75l-2-6-7-5-8-1-1-1h-9l-1 1-8 1Zm27 22 2 2v8l-1 2-6 5h-8l-4-4v-6l4-4ZM692 63l-7 4-4 4-4 7v3l-2 5v10l1 1 1 7 5 8 7 5 7 2 15-1 3-2h2l6-6 3-5v-2l-13-2-5 6-2 1h-7l-7-6-1-6 2-2h34v-9l-1-1-1-7-3-5-6-6-6-3h-4l-1-1Zm-2 18 6-7 2-1h6l7 6 1 5-2 2h-18l-2-2Zm-53-19-9 3-8 8-4 11v13l1 1v4l4 8 4 4 8 4 15 1 10-4 5-5 3-6-4-2-10-1-1 3-4 4h-8l-7-6-2-6 2-2h35l-1-14-4-8-6-6-11-4Zm-5 17 5-5 2-1h6l7 6 1 5-2 2h-18l-2-2Zm-31-12-7-4-10-1-7 2-7 6-2-2v-4h-12l-1 2v50l1 1h3l1 1h3l1-1 4 1 1-1V85l2-6 7-6h7l5 5 1 3v36l2 1 2-1 1 1h7l2-1V77l-1-1v-4Zm-242-3-7-2h-4l-4 2-4 4-3-4h-12v53l1 1 2-1 1 1 3-1 1 1 2-1 2 1 2-1V85l1-1v-3l2-3 4-3h5l4 2 4-9Zm394-19-13 8-1 2v7l-2 2h-4l-1 1 1 1-1 1v4l1 1v3h4l2 2v23l1 1v11l1 2 5 4 12 1 6-2v-9l-1-1h-7l-3-3V77l2-2h8l1-3-1-3 1-2-1-3h-8l-2-2Zm435-2h-12l-1 1v13h5l2 2-1 4-3 3-3 1-1 2 3 5 3-1 5-4 3-5v-3l1-1V44Zm-100 0-1 1v73l1 1 2-1 1 1h8l2-1V44l-1-1Zm-207 0-1 1v73l2 1h9l1-1 1 1 1-1V85l3-8 3-3 3-1h7l5 5v6l1 1v32l2 1 3-1 2 1h3l1-1 1 1 2-1V77l-3-8-6-5-6-2h-7l-6 2-6 5-2-2V43Zm-418 1h-7l-1-1h-34l-1 1v73l2 1 2-1 1 1 2-1 1 1 1-1 3 1 3-1V91l2-2h22l10-4 5-5 3-6v-5l1-1-1-10-3-6-5-5Zm-28 13 2-2h9l1 1 10 1 5 5v8l-6 6h-4l-1 1h-14l-2-2ZM249 43l-1 2v71l2 2 1-1h8l1 1 28-1 13-6 5-6 3-6v-2l2-3v-9l1-1-1-16-4-11-8-9-8-4h-7l-1-1Zm18 12h8l1 1 10 1 7 6 3 6v23l-4 8-5 4-3 1h-19l-2-2V58Zm561-13-9 3-7 5-8 11-2 10-1 1v17l1 1v4l2 6 4 6 10 9 8 3h6l1 1 12-1 9-4 5-4 7-12v-3l-3-2-11-2v2l-4 7-8 6h-9l-5-2-7-7-1-6-2-4V73l2-4v-3l3-5 4-4 8-3h6l6 3 5 5 2 4 13-2 1-3-4-8-5-5-6-4h-3l-4-2Z"/></svg>
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
