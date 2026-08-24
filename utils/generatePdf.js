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

  // Match HTML blocks: h1, h2, h3, p, ul, ol, table, hr
  const blockRegex = /<(h[1-3]|p|ul|ol|table|hr)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*\/?>/gi;
  const blocks = [];
  let match;

  while ((match = blockRegex.exec(clean)) !== null) {
    blocks.push(match[0]);
  }

  // If no blocks matched via regex, fallback
  if (blocks.length === 0) {
    blocks.push(clean);
  }

  const pages = [];
  let currentPageBlocks = [];
  let currentWords = 0;
  let currentTitle = "Vastu Shastra Diagnostic Report";
  let pageTitle = currentTitle;
  const MAX_WORDS = 220; // Target words per A4 page

  for (const block of blocks) {
    // Check if block is a heading
    const hMatch = block.match(/<h([1-3])[^>]*>(.*?)<\/h\1>/i);
    if (hMatch) {
      const headingLevel = hMatch[1];
      const headingText = hMatch[2].replace(/<[^>]*>/g, "").trim();

      // If it's h1 or h2, update section title
      if (headingLevel === "1" || headingLevel === "2") {
        currentTitle = headingText;
      }

      // If current page is already fairly full, start a new page for this major heading
      if (currentWords > 100) {
        pages.push({ title: pageTitle, content: currentPageBlocks.join("\n") });
        currentPageBlocks = [];
        currentWords = 0;
        pageTitle = currentTitle;
      } else if (currentPageBlocks.length === 0) {
        pageTitle = currentTitle;
      }

      currentPageBlocks.push(block);
      currentWords += countWords(block) + 10;
      continue;
    }

    // Check if block is a list (ul or ol)
    const listMatch = block.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
    if (listMatch) {
      const listTag = listMatch[1];
      const listContent = listMatch[2];
      const liMatches = listContent.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];

      let currentListItems = [];

      for (const li of liMatches) {
        const liWords = countWords(li);

        if (currentWords + liWords > MAX_WORDS && currentWords > 60) {
          if (currentListItems.length > 0) {
            currentPageBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:20px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
            currentListItems = [];
          }

          pages.push({ title: pageTitle, content: currentPageBlocks.join("\n") });
          currentPageBlocks = [];
          currentWords = 0;
          pageTitle = currentTitle;
        }

        currentListItems.push(li);
        currentWords += liWords + 5;
      }

      if (currentListItems.length > 0) {
        currentPageBlocks.push(`<${listTag} class="fix-list" style="list-style:none;padding-left:20px;margin:8px 0;">${currentListItems.join("\n")}</${listTag}>`);
      }
      continue;
    }

    // Regular block (p, table, hr, etc.)
    const blockWords = countWords(block);
    if (currentWords + blockWords > MAX_WORDS && currentWords > 60) {
      pages.push({ title: pageTitle, content: currentPageBlocks.join("\n") });
      currentPageBlocks = [];
      currentWords = 0;
      pageTitle = currentTitle;
    }

    currentPageBlocks.push(block);
    currentWords += blockWords;
  }

  if (currentPageBlocks.length > 0) {
    pages.push({ title: pageTitle, content: currentPageBlocks.join("\n") });
  }

  // Merge short pages into previous page if combined words <= 260
  for (let i = pages.length - 1; i > 0; i--) {
    const prevWords = countWords(pages[i - 1].content);
    const currWords = countWords(pages[i].content);
    if (currWords < 95 && prevWords + currWords <= 260) {
      pages[i - 1].content += "\n<br>\n" + pages[i].content;
      pages.splice(i, 1);
    }
  }

  // Render each page wrapped in standard vastu-page template with border, header, and footer
  let resultHtml = "";

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Only add page break between pages (kitchen/common.html already ends with a page break)
    if (i > 0) {
      resultHtml += `<div style="page-break-after: always;"></div>`;
    }

    resultHtml += `
      <div class="vastu-page ai-report-page" style="border: 6px solid #D60000; background-color: #f7f3ef; height: 1123px; width: 100%; box-sizing: border-box; position: relative; padding: 25px 40px 100px 40px; overflow: hidden;">
        
        <!-- Header (Logo on Left, Main Heading on Right on all pages) -->
        <div class="effect-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D60000; padding-bottom: 8px; margin-bottom: 15px;">
          <div>
            <img src="https://cdn.shopify.com/s/files/1/0758/2911/7240/files/vastu-site-logo.png" style="width: 120px; display: block;" alt="Live Vaastu">
          </div>
          <h3 style="color: #D60000; font-family: 'Josefin Sans', sans-serif; font-size: 16px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">
            VASTU SHASTRA REPORT
          </h3>
        </div>

        <!-- Content Area -->
        <div class="usage-content" style="padding: 0; height: 860px; overflow: hidden;">
          ${page.content}
        </div>

        <!-- Footer (Exact same as hardcoded pages) -->
        <div class="footer-container" style="position: absolute; bottom: 20px; left: 40px; right: 40px; width: auto;">
          <div class="line" style="height: 1px; background: #cfcfcf; margin-bottom: 10px;"></div>
          <div class="footer" style="display: flex; justify-content: space-between; font-size: 11px; color: #9b9b9b; font-family: 'Josefin Sans', sans-serif;">
            <span>WEB: <br><b><a href="https://livevaastu.in/" target="_blank" style="color: #D60000; text-decoration: none;">livevaastu.in</a></b></span>
            <span>EMAIL: <br><b><a href="mailto:contact@livevaastu.com" style="color: #D60000; text-decoration: none;">contact@livevaastu.com</a></b></span>
            <span>MOBILE: <br><b><a href="tel:9555666667" style="color: #D60000; text-decoration: none;">95556 66667</a></b></span>
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