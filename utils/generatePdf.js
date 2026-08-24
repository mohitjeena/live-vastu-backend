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


function countWords(str) {
  return str.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function estimateHeight(block) {
  if (/<h1[^>]*>/i.test(block)) return 45;
  if (/<h2[^>]*>/i.test(block)) return 40;
  if (/<h3[^>]*>/i.test(block)) return 30;
  if (/<table[^>]*>/i.test(block)) {
    const rowCount = (block.match(/<tr[^>]*>/gi) || []).length;
    return Math.max(rowCount * 28, 50);
  }
  if (/<hr[^>]*\/?>/i.test(block)) return 15;
  if (/<li[^>]*>/i.test(block)) {
    const words = countWords(block);
    const lines = Math.ceil(words / 13) || 1;
    return (lines * 22) + 9;
  }
  const words = countWords(block);
  const lines = Math.ceil(words / 15) || 1;
  return (lines * 22) + 10;
}

function paginateAiReportToPages(aiHtml, maxPageHeight = 840) {
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

  // Match all top-level blocks
  const blockRegex = /<(h[1-3]|p|ul|ol|table|hr)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*\/?>/gi;
  const blocks = [];
  let match;

  while ((match = blockRegex.exec(clean)) !== null) {
    blocks.push(match[0]);
  }

  if (blocks.length === 0) {
    blocks.push(clean);
  }

  const pages = [];
  let currentBlocks = [];
  let currentHeight = 0;

  for (const block of blocks) {
    // If it's a list (ul or ol), handle individual list items so long lists split smoothly
    const listMatch = block.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
    if (listMatch) {
      const listTag = listMatch[1];
      const liMatches = listMatch[2].match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
      let currentListItems = [];

      for (const li of liMatches) {
        const liH = estimateHeight(li);
        if (currentHeight + liH > maxPageHeight && currentHeight > 200) {
          if (currentListItems.length > 0) {
            currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:20px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
            currentListItems = [];
          }
          pages.push(currentBlocks.join("\n"));
          currentBlocks = [];
          currentHeight = 0;
        }
        currentListItems.push(li);
        currentHeight += liH;
      }

      if (currentListItems.length > 0) {
        currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:20px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
      }
      continue;
    }

    // If it's a heading (h1, h2, h3) and the page is already 80% full, push heading to next page (prevents orphan headings)
    const isHeading = /<h[1-3][^>]*>/i.test(block);
    const bHeight = estimateHeight(block);

    if (isHeading && currentHeight > 700) {
      pages.push(currentBlocks.join("\n"));
      currentBlocks = [block];
      currentHeight = bHeight;
      continue;
    }

    if (currentHeight + bHeight > maxPageHeight && currentHeight > 200) {
      pages.push(currentBlocks.join("\n"));
      currentBlocks = [];
      currentHeight = 0;
    }

    currentBlocks.push(block);
    currentHeight += bHeight;
  }

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join("\n"));
  }

  // Render each page wrapped in standard vastu-page template with border, header, and footer
  let resultHtml = "";

  for (let i = 0; i < pages.length; i++) {
    let pageContent = pages[i];

    // Remove any trailing <hr> tags from the page content so they don't sit above the footer line
    pageContent = pageContent.replace(/<hr[^>]*\/?>\s*$/gi, "").trim();

    // Only add page break between pages (kitchen/common.html already ends with a page break)
    if (i > 0) {
      resultHtml += `<div style="page-break-after: always;"></div>`;
    }

    resultHtml += `
      <div class="vastu-page ai-report-page" style="border: 6px solid #D60000; background-color: #f7f3ef; height: 1123px; width: 100%; box-sizing: border-box; position: relative; padding: 25px 40px 0 40px; overflow: hidden;">
        
        <!-- Header (Logo on Left, Consistent Main Title on Right) -->
        <div class="effect-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D60000; padding-bottom: 8px; margin-bottom: 15px;">
          <div>
            <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" style="width: 120px; display: block;" alt="Live Vaastu">
          </div>
          <h3 style="color: #D60000; font-family: 'Josefin Sans', sans-serif; font-size: 16px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">
            VASTU SHASTRA REPORT
          </h3>
        </div>

        <!-- Content Area (Height expanded to 940px so content never gets clipped) -->
        <div class="usage-content" style="padding: 0; height: 940px; overflow: hidden;">
          ${pageContent}
        </div>

        <!-- Footer (Exact same as hardcoded pages, centered with left: 0) -->
        <div class="footer-container" style="position: absolute; bottom: 20px; left: 0; right: 0; width: 100%; text-align: center;">
          <div class="line" style="width: 90%; margin: 0 auto; height: 1px; background: #ddd;"></div>
          <div class="footer" style="position: static; margin-top: 25px; display: flex; justify-content: space-evenly; align-items: center; font-size: 13.5px; color: #777; font-family: 'Josefin Sans', sans-serif; width: 100%;">
            <span style="font-size: 12.5px; color: #777;">WEB: <br><b style="font-size: 13.5px;"><a href="https://livevaastu.in/" target="_blank" style="color: #D60000; text-decoration: none;">livevaastu.in</a></b></span>
            <span style="font-size: 12.5px; color: #777;">EMAIL: <br><b style="font-size: 13.5px;"><a href="mailto:contact@livevaastu.com" style="color: #D60000; text-decoration: none;">contact@livevaastu.com</a></b></span>
            <span style="font-size: 12.5px; color: #777;">MOBILE: <br><b style="font-size: 13.5px;"><a href="tel:9555666667" style="color: #D60000; text-decoration: none;">95556 66667</a></b></span>
          </div>
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