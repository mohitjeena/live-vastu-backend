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


function formatAiReportToPages(aiHtml) {
  if (!aiHtml) return "";
  
  // If aiHtml already contains formatted .ai-report-page sections, clean and return body content
  if (aiHtml.includes("ai-report-page")) {
    const aiClean = cleanHtml(aiHtml);
    return extractBodyContent(aiClean);
  }

  // Clean raw html tags from aiHtml
  const aiClean = cleanHtml(aiHtml);
  const rawContent = extractBodyContent(aiClean);

  // Split content into section blocks by h1, h2, or h3 tags
  const rawSections = rawContent
    .split(/(?=<h[1-3][^>]*>)/i)
    .filter(s => s && s.trim().length > 0);

  const sectionsToRender = rawSections.length > 0 ? rawSections : [rawContent];

  let pagesHtml = "";

  for (const section of sectionsToRender) {
    // Extract heading text for the top header
    let sectionTitle = "Vastu Shastra Report";
    const headingMatch = section.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (headingMatch) {
      sectionTitle = headingMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (sectionTitle.length > 38) {
        sectionTitle = sectionTitle.substring(0, 35) + "...";
      }
    }

    pagesHtml += `
      <div style="page-break-after: always;"></div>
      <div class="vastu-page ai-report-page" style="border: 6px solid #D60000; background-color: #f7f3ef; min-height: 1123px; height: auto !important; overflow: visible !important; width: 100%; box-sizing: border-box; position: relative; padding: 30px 40px 90px 40px;">
        <!-- Header -->
        <div class="effect-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cfcfcf; padding-bottom: 10px; margin-bottom: 25px;">
          <div>
            <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" style="width: 120px; display: block;" alt="Live Vaastu">
          </div>
          <h3 style="color: #D60000; font-family: 'Josefin Sans', sans-serif; font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            ${sectionTitle}
          </h3>
        </div>

        <!-- Content -->
        <div class="usage-content" style="padding: 0;">
          ${section}
        </div>

        <!-- Footer -->
        <div class="footer-container" style="position: absolute; bottom: 20px; left: 40px; right: 40px; box-sizing: border-box;">
          <div class="line" style="height: 1px; background: #cfcfcf; margin-bottom: 12px;"></div>
          <div class="footer" style="display: flex; justify-content: space-between; font-size: 11px; color: #9b9b9b; font-family: 'Josefin Sans', sans-serif;">
            <span>WEB: <br><b><a href="https://livevaastu.in/" target="_blank" style="color: #D60000; text-decoration: none;">livevaastu.in</a></b></span>
            <span>EMAIL: <br><b><a href="mailto:contact@livevaastu.com" style="color: #D60000; text-decoration: none;">contact@livevaastu.com</a></b></span>
            <span>MOBILE: <br><b><a href="tel:9555666667" style="color: #D60000; text-decoration: none;">95556 66667</a></b></span>
          </div>
        </div>
      </div>
    `;
  }

  return pagesHtml;
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
    html += formatAiReportToPages(aiHtml);
  }

  html += "</body></html>";

  return html;
}


exports.generateFinalHtml = generateFinalHtml;
exports.extractAnswers = extractAnswers;