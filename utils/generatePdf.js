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


// Estimate physical pixel height for any HTML element on A4 page (at 96 DPI)
function estimateBlockHeight(block) {
  if (/<h1[^>]*>/i.test(block)) return 55;
  if (/<h2[^>]*>/i.test(block)) return 45;
  if (/<h3[^>]*>/i.test(block)) return 35;
  if (/<hr[^>]*\/?>/i.test(block)) return 15;
  if (/<table[^>]*>/i.test(block)) {
    const rowCount = (block.match(/<tr[^>]*>/gi) || []).length;
    return Math.max(rowCount * 36 + 20, 50);
  }
  if (/<li[^>]*>/i.test(block)) {
    const plain = block.replace(/<[^>]*>/g, "").trim();
    const lines = Math.max(1, Math.ceil(plain.length / 80));
    return lines * 24 + 10;
  }
  // Paragraph (<p>) or other text
  const plain = block.replace(/<[^>]*>/g, "").trim();
  const lines = Math.max(1, Math.ceil(plain.length / 80));
  return lines * 24 + 14;
}

function paginateAiReportToPages(aiHtml) {
  if (!aiHtml) return "";

  // Strip wrapping outer containers and headers
  let clean = cleanHtml(aiHtml);
  clean = extractBodyContent(clean);

  // Clean old wrappers
  clean = clean.replace(/<div[^>]*class=["']ai-report-content["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*vastu-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-page[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-container[^"']*["'][^>]*>/gi, "");
  clean = clean.replace(/<div[^>]*class=["'][^"']*ai-report-flow-body[^"']*["'][^>]*>/gi, "");

  // Extract all blocks in one continuous sequence (no artificial splitting per h2)
  const blockRegex = /<(h[1-3]|p|ul|ol|table|hr)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*\/?>/gi;
  const rawBlocks = [];
  let match;

  while ((match = blockRegex.exec(clean)) !== null) {
    rawBlocks.push(match[0]);
  }

  if (rawBlocks.length === 0) {
    rawBlocks.push(clean);
  }

  // A4 page printable height capacity (1123px - 80px padding = 1043px available, safety target = 970px)
  const PAGE_CAPACITY = 970;
  const finalPages = [];
  let currentBlocks = [];
  let currentHeight = 0;

  for (const block of rawBlocks) {
    const listMatch = block.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
    if (listMatch) {
      const listTag = listMatch[1];
      const liMatches = splitTopLevelListItems(listMatch[2]);
      let currentListItems = [];

      for (const li of liMatches) {
        const liHeight = estimateBlockHeight(li);

        if (currentHeight + liHeight > PAGE_CAPACITY && currentBlocks.length > 0) {
          if (currentListItems.length > 0) {
            currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:18px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
            currentListItems = [];
          }
          finalPages.push(currentBlocks.join("\n"));
          currentBlocks = [];
          currentHeight = 0;
        }

        currentListItems.push(li);
        currentHeight += liHeight;
      }

      if (currentListItems.length > 0) {
        currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:18px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
      }
      continue;
    }

    const bHeight = estimateBlockHeight(block);
    const isHeading = /<h[1-3][^>]*>/i.test(block);

    // If block doesn't fit, OR if it's a heading near the bottom (> 820px), start a fresh page
    if (currentBlocks.length > 0 && (currentHeight + bHeight > PAGE_CAPACITY || (isHeading && currentHeight > 820))) {
      finalPages.push(currentBlocks.join("\n"));
      currentBlocks = [];
      currentHeight = 0;
    }

    currentBlocks.push(block);
    currentHeight += bHeight;
  }

  if (currentBlocks.length > 0) {
    finalPages.push(currentBlocks.join("\n"));
  }

  // Render each page with crisp red border and clean padding
  let resultHtml = "";

  for (let i = 0; i < finalPages.length; i++) {
    let pageContent = finalPages[i].replace(/<hr[^>]*\/?>\s*$/gi, "").trim();

    if (i > 0) {
      resultHtml += `<div style="page-break-after: always;"></div>`;
    }

    resultHtml += `
      <div class="vastu-page ai-report-page" style="border: 6px solid #D60000; background-color: #f7f3ef; height: 1123px; width: 100%; box-sizing: border-box; position: relative; padding: 40px; overflow: hidden;">
        <div class="usage-content" style="padding: 0;">
          ${pageContent}
        </div>
      </div>
    `;
  }

  return resultHtml;
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