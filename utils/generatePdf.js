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

// Correctly splits top-level <li> elements even when they contain nested <ul> lists
function splitTopLevelListItems(ulContent) {
  const items = [];
  let depth = 0;
  let currentItem = "";

  const tokens = ulContent.split(/(<\/?(?:li|ul|ol)[^>]*>)/i);

  for (const token of tokens) {
    if (/^<li[^>]*>/i.test(token)) {
      if (depth === 0 && currentItem.trim().length > 0) {
        items.push(currentItem.trim());
        currentItem = "";
      }
      depth++;
      currentItem += token;
    } else if (/^<\/li>/i.test(token)) {
      depth--;
      currentItem += token;
      if (depth === 0) {
        items.push(currentItem.trim());
        currentItem = "";
      }
    } else {
      currentItem += token;
    }
  }

  if (currentItem.trim().length > 0) {
    items.push(currentItem.trim());
  }

  return items.filter(it => it.trim().length > 0);
}

// Calculate exact Physical Line Units for any block
function getLineUnits(block) {
  if (/<h1[^>]*>/i.test(block)) return 3.0;
  if (/<h2[^>]*>/i.test(block)) return 2.5;
  if (/<h3[^>]*>/i.test(block)) return 1.8;
  if (/<hr[^>]*\/?>/i.test(block)) return 0.8;
  if (/<table[^>]*>/i.test(block)) {
    const rowCount = (block.match(/<tr[^>]*>/gi) || []).length;
    return Math.max(rowCount * 1.4, 2.5);
  }
  if (/<li[^>]*>/i.test(block)) {
    const innerLis = (block.match(/<li[^>]*>/gi) || []).length;
    const words = countWords(block);
    const textLines = Math.ceil(words / 14) || 1;
    return textLines + (innerLis * 0.5);
  }
  // Paragraph (<p>) or other text
  const words = countWords(block);
  const textLines = Math.ceil(words / 14) || 1;
  return textLines + 0.5;
}

function paginateSection(sectionHtml, maxLinesPerPage = 30) {
  const blockRegex = /<(h[1-3]|p|ul|ol|table|hr)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*\/?>/gi;
  const blocks = [];
  let match;

  while ((match = blockRegex.exec(sectionHtml)) !== null) {
    blocks.push(match[0]);
  }

  if (blocks.length === 0) {
    return [sectionHtml];
  }

  // Calculate total section line units
  let totalSectionLines = 0;
  for (const b of blocks) {
    if (/<(ul|ol)[^>]*>/i.test(b)) {
      const lis = splitTopLevelListItems(b);
      for (const li of lis) totalSectionLines += getLineUnits(li);
    } else {
      totalSectionLines += getLineUnits(b);
    }
  }

  // If the whole section fits safely on 1 page (up to 31 lines), keep it as 1 single page!
  if (totalSectionLines <= 31) {
    return [sectionHtml];
  }

  // Otherwise, split into sub-pages
  const subPages = [];
  let currentBlocks = [];
  let currentLines = 0;

  for (const block of blocks) {
    const listMatch = block.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
    if (listMatch) {
      const listTag = listMatch[1];
      const liMatches = splitTopLevelListItems(listMatch[2]);
      let currentListItems = [];

      for (const li of liMatches) {
        const liLines = getLineUnits(li);
        if (currentLines + liLines > maxLinesPerPage && currentLines > 8) {
          if (currentListItems.length > 0) {
            currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:18px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
            currentListItems = [];
          }
          subPages.push(currentBlocks.join("\n"));
          currentBlocks = [];
          currentLines = 0;
        }
        currentListItems.push(li);
        currentLines += liLines;
      }

      if (currentListItems.length > 0) {
        currentBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:18px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
      }
      continue;
    }

    const bLines = getLineUnits(block);
    if (currentLines + bLines > maxLinesPerPage && currentLines > 8) {
      subPages.push(currentBlocks.join("\n"));
      currentBlocks = [];
      currentLines = 0;
    }

    currentBlocks.push(block);
    currentLines += bLines;
  }

  if (currentBlocks.length > 0) {
    subPages.push(currentBlocks.join("\n"));
  }

  return subPages;
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

  // Split by <h2> sections so EVERY major title starts at the top of a page (perfect left alignment like Image 3!)
  let rawSections = clean
    .split(/(?=<h2[^>]*>)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (rawSections.length === 0) {
    rawSections = [clean];
  }

  // If the first section does NOT contain <h2> (it is the Title block), merge with 1. Executive Summary
  if (rawSections.length > 1 && !rawSections[0].match(/<h2[^>]*>/i)) {
    rawSections[1] = rawSections[0] + "<br>" + rawSections[1];
    rawSections.shift();
  }

  const finalPages = [];

  for (const section of rawSections) {
    const sectionPages = paginateSection(section, 30);
    for (const sp of sectionPages) {
      finalPages.push(sp);
    }
  }

  // Merge any very short trailing page into previous page if combined <= 300 words
  for (let i = finalPages.length - 1; i > 0; i--) {
    const prevWords = countWords(finalPages[i - 1]);
    const currWords = countWords(finalPages[i]);
    if (currWords < 90 && prevWords + currWords <= 300) {
      finalPages[i - 1] += "\n<br>\n" + finalPages[i];
      finalPages.splice(i, 1);
    }
  }

  // Render each page wrapped in standard vastu-page template with border, header, and footer
  let resultHtml = "";

  for (let i = 0; i < finalPages.length; i++) {
    let pageContent = finalPages[i];

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

        <!-- Content Area (Safe headroom, no artificial overflow cut) -->
        <div class="usage-content" style="padding: 0; min-height: 750px; max-height: 880px;">
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