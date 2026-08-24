const fs = require("fs");
const path = require("path");
const mapping = require("../vastu_chunks.json");


function loadHtml(filePath) {
  try {
    const fullPath = path.join(__dirname, "..", filePath);

    // ✅ Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${filePath}`);
      return ""; // skip silently
    }

    return fs.readFileSync(fullPath, "utf8");

  } catch (err) {
    console.error("Error loading file:", filePath, err.message);
    return ""; // fail safe
  }
}


function injectDetails(template, data) {
  let html = template;
  
  function replace(obj, prefix = "") {
    Object.keys(obj).forEach(key => {
      let value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        replace(value, newKey);
      } else {
        if(newKey == "updatedAt")
        {
         
          
          const formattedDate = new Date(value).toLocaleDateString("en-GB", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
          value = formattedDate;
        }
        html = html.replaceAll(`{{${newKey}}}`, value);
      }
    });
  }

  replace(data);
  return html;
}


function normalizeDirection(val) {
  console.log('answer value',val);
  
  const map = {
    n: "north", s: "south", e: "east", w: "west",
    ne: "north-east", nw: "north-west",
    se: "south-east", sw: "south-west"
  };

  return map[val?.toLowerCase()] || val?.toLowerCase().replace(/\s+/g, "-");
}

function extractAnswers(answers) {
  return {
    mainDoor: normalizeDirection(
      answers.find(a => a.question_key === "mainDoorFacing")?.answer.toLowerCase().trim()
    ),

    bedrooms: [
      ...new Set(
        answers
          .filter(a => a.question_key === "bedroomFacing")
          .map(a => normalizeDirection(a.answer.toLowerCase().trim()))
      )
    ],

    toilets: [
      ...new Set(
        answers
          .filter(a => a.question_key === "toiletFacing")
          .map(a => normalizeDirection(a.answer.toLowerCase().trim()))
      )
    ],

    kitchen: normalizeDirection(
      answers.find(a => a.question_key === "kitchenDirection")?.answer.toLowerCase().trim()
    )
  };
}


function extractBodyContent(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function cleanHtml(html) {
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "");
}


function paginateAiReportToPages(aiHtml) {
  if (!aiHtml) return "";

  let clean = cleanHtml(aiHtml);
  clean = extractBodyContent(clean);

  // Clean old wrappers
  clean = clean.replace(/<div[^>]*class=["']ai-report-content["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*vastu-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-container[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-flow-body[^"']*["'][^>]*>/gi, "");

  return `
    <style>
      .ai-report-wrapper {
        page-break-before: always;
        break-before: page;
        position: relative;
        background-color: #f7f3ef;
      }

      /* 1. Red Border har page par repeat hoga */
      .page-border {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 6px solid #D60000;
        pointer-events: none;
        box-sizing: border-box;
      }

      /* 2. Header har page par repeat hoga */
      .ai-header-fixed {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 70px;
        padding: 20px 35px 0px 35px;
        background-color: #f7f3ef;
      }

      /* 3. Footer har page par repeat hoga */
      .ai-footer-fixed {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 75px;
        padding: 0px 35px 15px 35px;
        background-color: #f7f3ef;
      }

      /* 4. Content area - Padding header aur footer ke liye space banayegi */
      .ai-content-body {
        padding-top: 85px;
        padding-bottom: 85px;
        padding-left: 35px;
        padding-right: 35px;
      }

      .ai-content-body p, 
      .ai-content-body li,
      .ai-content-body div {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    </style>

    <div class="ai-report-wrapper">
      
      <!-- Border -->
      <div class="page-border"></div>

      <!-- Header (Fixed to repeat on every page) -->
      <div class="ai-header-fixed">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D60000; padding-bottom: 8px;">
          <div>
            <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" style="width: 120px; display: block;" alt="Live Vaastu">
          </div>
          <h3 style="color: #D60000; font-family: 'Josefin Sans', sans-serif; font-size: 16px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
            VASTU SHASTRA REPORT
          </h3>
        </div>
      </div>

      <!-- Footer (Fixed to repeat on every page) -->
      <div class="ai-footer-fixed">
        <div style="width: 100%; margin: 0 auto 10px auto; height: 1px; background: #ddd;"></div>
        <div style="display: flex; justify-content: space-evenly; align-items: center; font-size: 13.5px; color: #777; font-family: 'Josefin Sans', sans-serif; width: 100%;">
          <span style="font-size: 12.5px; color: #777;">WEB: <br><b style="font-size: 13.5px;"><a href="https://livevaastu.in/" target="_blank" style="color: #D60000; text-decoration: none;">livevaastu.in</a></b></span>
          <span style="font-size: 12.5px; color: #777;">EMAIL: <br><b style="font-size: 13.5px;"><a href="mailto:contact@livevaastu.com" style="color: #D60000; text-decoration: none;">contact@livevaastu.com</a></b></span>
          <span style="font-size: 12.5px; color: #777;">MOBILE: <br><b style="font-size: 13.5px;"><a href="tel:9555666667" style="color: #D60000; text-decoration: none;">95556 66667</a></b></span>
        </div>
      </div>

      <!-- Flowing Content -->
      <div class="ai-content-body">
        ${clean}
      </div>

    </div>
  `;
}


function generateFinalHtml(userAnswers, detailsData, aiHtml, planType = 'basic') {
  let html = "";
  console.log('userAnswers',userAnswers);
  
  html += loadHtml(mapping.common.cover);

  // 1️⃣ DETAILS PAGE
  const detailsTemplate = loadHtml(mapping.common.details);
  html += injectDetails(detailsTemplate, detailsData);

  html += loadHtml(mapping.common.introduction);

  // 2️⃣ MAIN DOOR
  if (mapping.mainDoor[userAnswers.mainDoor]) {
    html += loadHtml(mapping.mainDoor[userAnswers.mainDoor]);
  }

  // 3️⃣ BEDROOMS
  if (userAnswers.bedrooms.length) {

     userAnswers.bedrooms.forEach(dir => {
      if (mapping.bedroom[dir]) {
        html += loadHtml(mapping.bedroom[dir]);
      }
    });
   
  }

  // for-common-bedroom
   if (mapping.bedroom.common) {
      html += loadHtml(mapping.bedroom.common);
    }

  // 4️⃣ TOILETS
  userAnswers.toilets.forEach(dir => {
    if (mapping.toilet[dir]) {
      html += loadHtml(mapping.toilet[dir]);
    }
  });

  // 5️⃣ KITCHEN
  if (mapping.kitchen[userAnswers.kitchen]) {
    html += loadHtml(mapping.kitchen[userAnswers.kitchen]);
  }
    //  KITCHEN-COMMON
  
    html += loadHtml(mapping.kitchen.common);
  

  // 7️⃣ AI REPORT (LAST)
  if (planType === 'basic' || planType === 'bronze') {
    const aiClean = cleanHtml(aiHtml);
    const aiBody = extractBodyContent(aiClean);
    html += `
    <div class="vastu-page">
      ${aiBody}
    </div>
  `;
  } else {
    // For paid plans (silver, gold, platinum), format sections into complete styled pages
    html += paginateAiReportToPages(aiHtml);
  }

  html += "</body></html>";

  return html;
}


exports.generateFinalHtml = generateFinalHtml;
exports.extractAnswers = extractAnswers;