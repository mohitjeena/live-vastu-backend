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

  // Strip wrapping outer containers and headers
  let clean = cleanHtml(aiHtml);
  clean = extractBodyContent(clean);

  // Strip any old outer wrappers
  clean = clean.replace(/<div[^>]*class=["']ai-report-content["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-wrapper[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-flow[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*vastu-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<\/div>\s*$/gi, "");

  // Split content into section blocks by <h2> tags (representing the 15 major sections)
  let rawSections = clean
    .split(/(?=<h2[^>]*>)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (rawSections.length === 0) {
    rawSections = [clean];
  }

  // If the first section does NOT have an <h2> (e.g. it is the <h1> Title & subtitle block),
  // merge it with the first <h2> section (Executive Summary) so it fills page 1 without creating blank pages
  if (rawSections.length > 1 && !rawSections[0].match(/<h2[^>]*>/i)) {
    rawSections[1] = rawSections[0] + "<br>" + rawSections[1];
    rawSections.shift();
  }

  let pagesHtml = "";

  for (let i = 0; i < rawSections.length; i++) {
    const sectionHtml = rawSections[i];
    if (!sectionHtml || sectionHtml.trim().length === 0) continue;

    // Extract title from the <h2> tag for the top header
    let sectionTitle = "Vastu Shastra Report";
    const headingMatch = sectionHtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (headingMatch) {
      sectionTitle = headingMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (sectionTitle.length > 42) {
        sectionTitle = sectionTitle.substring(0, 39) + "...";
      }
    }

    pagesHtml += `
      <div style="page-break-after: always;"></div>
      <div class="ai-vastu-page">
        <!-- Header -->
        <div class="ai-page-header">
          <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" alt="Live Vaastu">
          <h3>${sectionTitle}</h3>
        </div>

        <!-- Content -->
        <div class="ai-page-body">
          ${sectionHtml}
        </div>

        <!-- Footer -->
        <div class="ai-page-footer">
          <div class="footer-contacts">
            <span>WEB: <br><a href="https://livevaastu.in/" target="_blank">livevaastu.in</a></span>
            <span>EMAIL: <br><a href="mailto:contact@livevaastu.com">contact@livevaastu.com</a></span>
            <span>MOBILE: <br><a href="tel:9555666667">95556 66667</a></span>
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