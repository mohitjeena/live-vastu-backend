const OpenAI = require("openai");
const Chunk = require("../models/Chunk");
const { marked } = require("marked");
const juiceModule = require("juice");
const juice = juiceModule.default || juiceModule;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers, plan_type = 'basic') => {
  try {
    const content = [];

       if (plan_type === "platinum" && userAnswers.profile_image && userAnswers.map_images.length !== 0) {
        console.log('entered in images in premium plus')

        content.push({
  type: "input_text",
  text: `
IMAGE CONTEXT:
- First image is the PROFILE IMAGE of user.
- Other are map images.

INSTRUCTIONS:
- Use map images to understand direction, room placement, and plot orientation.
`
});

function getFastCloudinaryUrl(url) {
  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_700/'
  );
}

      if (userAnswers.profile_image?.url) {
        content.push({
          type: "input_image",
          image_url: getFastCloudinaryUrl(userAnswers.profile_image.url)
        });
      }

       userAnswers.map_images?.forEach(img => {
        if (img.url) {
          content.push({
            type: "input_image",
            image_url: getFastCloudinaryUrl(img.url)
          });
        }
      });
    }

     content.push({
      type: "input_text",
      text: await createVastuPrompt(userAnswers, plan_type)
    });


    console.log(`Generating ${plan_type} Vastu report...`);
    console.log(plan_type);
    

    const response = await client.responses.create({
      model: "gpt-5-nano", 
      input: [
        {
          role: "system",
          content:
            `You are Dr. Puneet Chawla, a senior Vastu & Astro-Vastu consultant. 
              Write like a real consultant preparing a preliminary diagnostic note from your desk after reviewing the client’s form.

               STRICT RULES:
                - Use ONLY 8 directions: N, NE, E, SE, S, SW, W, NW, Unknown.
                - Do NOT mention Vastu Chakra, 16 directions, 32 directions, grids, charts, mandalas.
                - Do NOT mention any competitor, any YouTuber, any “internet style,” or comparison.
                - Do NOT claim certainty. Use professional likelihood language: “often”, “commonly”, “in practical cases”.
                - Controlled seriousness is allowed. Avoid superstition words: “curse”, “black magic”, “totka”, “dosha”.
                - Do NOT mention AI, model, algorithm, scoring, API, prompt, or automation.
                - Keep the tone calm, firm, diagnostic, and authoritative.
              - Do NOT claim personal consultation
              - Do NOT imply physical site visit
              - Present the report as expert-guided analysis

              CONTROLLED FEAR TONE:
            - Use “slow-settlement”, “progressive”, “accumulates”, “repeating disturbance”.
            - Never say “disaster”. Never threaten. No melodrama.
            - Link each defect to practical outcomes: sleep, mental clarity, finance retention, arguments, child focus.

            ASTRO-VASTU TOUCH (light):
            - Mention planetary tendencies only as supporting language (Sun/Moon/Mars/Venus/Saturn) and only 1–2 times total.
            - Keep it subtle: “Mars-type agitation”, “Moon-type restlessness”, “Saturn-type delay”.

            ${plan_type === 'basic' ? 'Provide concise analysis in 4-5 pages.' : 'Provide detailed, comprehensive analysis in 15-20 pages.'}`,
        },
        {
          role: "user",
          content
        },
      ],
       max_output_tokens: 20000,
       
    });
    let report = null;
    let raw_text = response.output_text;
    try {
      if (plan_type === 'basic') {
        report = await JSON.parse(raw_text);
      } else {
        // Parse markdown to HTML
        const htmlContent = marked.parse(raw_text);
        
        // Define stylesheet for premium reports to be inlined by Juice
        const cssRules = `
          .ai-report-content {
            font-family: 'Josefin Sans', sans-serif;
            color: #333333;
            line-height: 1.7;
            font-size: 16px;
            background-color: #f7f3ef;
          }
          .ai-report-content h1, 
          .ai-report-content h2, 
          .ai-report-content h3 {
            color: #D60000;
            font-weight: bold;
            page-break-after: avoid;
            break-after: avoid;
          }
          .ai-report-content h1 {
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 12px;
            border-bottom: 2px solid #D60000;
            padding-bottom: 8px;
          }
          .ai-report-content h2 {
            font-size: 22px;
            margin-top: 28px;
            margin-bottom: 12px;
            border-bottom: 1px solid #D60000;
            padding-bottom: 4px;
          }
          .ai-report-content h3 {
            font-size: 18px;
            margin-top: 22px;
            margin-bottom: 10px;
          }
          .ai-report-content p {
            margin: 12px 0;
            text-align: justify;
            text-justify: inter-word;
            font-size: 16px;
            line-height: 1.7;
            color: #333333;
            font-weight: 500;
          }
          .ai-report-content ul {
            list-style: none;
            padding: 0;
            margin: 12px 0;
            padding-left: 20px;
          }
          .ai-report-content ol {
            padding: 0;
            margin: 12px 0;
            padding-left: 20px;
          }
          .ai-report-content ul li, 
          .ai-report-content ol li {
            margin: 10px 0;
            font-size: 16px;
            color: #333333;
            position: relative;
            font-weight: 600;
            line-height: 1.6;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .ai-report-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #ffffff;
          }
          .ai-report-content tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .ai-report-content th, 
          .ai-report-content td {
            border: 1px solid #cccccc;
            padding: 10px;
            text-align: left;
          }
          .ai-report-content th {
            background-color: #010101;
            color: #C88200;
            font-weight: bold;
          }
        `;

        // Wrap the HTML with the style block and container
        const wrappedHtml = `
          <style>${cssRules}</style>
          <div class="ai-report-content">
            ${htmlContent}
          </div>
        `;

        // Inline all styles using juice
        report = juice(wrappedHtml);
      }
    } catch (error) {
      console.log('error while report parsing or styling');
      console.error(error);
      report = raw_text;
    }
    return report;
    
    
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate Vastu report");
  }
};


function buildSearchQuery(answers) {
  return answers
    .map(a => `${a.question_text} Answer: ${a.answer}`)
    .join(". ");
}

async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small", 
    input: text
  });
  return res.data[0].embedding;
}

async function vectorSearch(questionEmbedding) {
  const results = await Chunk.aggregate([
    {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: questionEmbedding,
      numCandidates: 60,
      limit: 30 
    }
  },
  {
    $project: {
      topic: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
  ]);

  return results;
}

const createVastuPrompt =async (userAnswers,plan_type) => {

  const searchQuery = buildSearchQuery(userAnswers.answers);

   const embedding = await getEmbedding(searchQuery);

   const results = await vectorSearch(embedding)

   const uniqueTopics = [
  ...new Set(results.map(r => r.topic))
];

const topicContexts = {};

for (const topic of uniqueTopics) {
  const chunks = await Chunk.find({ topic })
    .sort({ order: 1 });

  topicContexts[topic] = chunks
    .map(c => c.text.trim())
    .join("");
}

const finalContext = Object.entries(topicContexts)
  .map(([topic, text]) => `### ${topic}\n${text}`)
  .join("\n\n");


console.log(uniqueTopics);

  if(plan_type === "basic"){

    let prompt = `
 Analyze this home for Vastu Shastra compliance and return JSON with exactly this structure:

{
    "score": "<calculated_score_between_0_to_100>",
    "report": "Your analysis report here..."
}

SCORING RULES:
- Start from 100
- Deduct points for each Vastu violation
- Major issue: -2 to -3
- Minor issue: -1 to -2

CRITICAL INSTRUCTION:
- Score MUST be dynamically calculated based on user answers
- Do NOT use any fixed/default value like 85
- Score should reflect actual vastu compliance
- You MUST generate the Vastu report ONLY using the information provided in the CONTEXT section below, combined with the user's answers.
- Do NOT rely on external knowledge.
- If something is missing, infer carefully using Vastu principles
from the CONTEXT only.

REPORT FORMAT RULES:
- "score": Number between 0-100 representing Vastu compliance
- "report": 
- report MUST contain exactly TWO sections with 140-150 lines
- Use <h3> for section titles
- Use <p> for paragraphs
- Each section should have 70–80 lines
- Keep language professional and easy to understand

REPORT SECTION STRUCTURE:

<h3>Current Vastu Analysis</h3>
<p>...</p>

<h3>Vastu Strengths</h3>
<p>...</p>

<h3>Energy Flow & Space Utilization</h3>
<p>...</p>

<h3>Remedies & Recommendations</h3>
<p>...</p>

CONTENT GUIDELINES:
- Analysis should explain current vastu compliance clearly
- Remedies should be practical and actionable
- End remedies section with:
  "For complete analysis, consider our premium plans."

Given answers by user according to questions :
\n`;
    prompt += `- Type: ${userAnswers.property_type}\n`;
    prompt += `- Purpose: ${userAnswers.purpose}\n\n`;
    prompt += `ANSWERS PROVIDED:\n`;
    userAnswers.answers.forEach(answer => {
        prompt += `- ${answer.question_text}: ${answer.answer}\n`;
    });
    
    prompt += `\n

CONTEXT (FROM DATABASE – RAG):
${finalContext}
`;

return prompt;
  }
  else {
    prompt = `
IMPORTANT RULES (STRICT):

- Return ONLY a clean, professional, and well-structured Markdown document.
- Do NOT return JSON
- Do NOT return HTML or code blocks
- Do NOT add explanations, comments, or extra text
- Use proper Markdown headings (#, ##, ###), bold text, bulleted lists (-), numbered lists (1.), and tables where appropriate to structure the report.
- Ensure well-structured formatting suitable for a 10–15 page professional report
- Do NOT mention OpenAI or AI in the report

TASK:
Generate a PROFESSIONAL Vastu Shastra report in Markdown format.
Length must be equivalent to 15–20 pages.

CRITICAL INSTRUCTION:
You MUST generate the Vastu report ONLY using the information provided
in the CONTEXT section below, combined with the user's answers.
Use the provided CONTEXT as the primary source of analysis.
You may apply general Vastu reasoning only where necessary
to connect findings naturally and professionally.
Do not invent unrelated facts.

DESIGN & FORMATTING GUIDELINES:
- Structure the report cleanly with section dividers and headers
- Use Markdown bolding for key findings or priorities
- Use tables to structure data (like priorities or short-term action plans)
- Use standard bullet lists (-) for remedies and recommendations

IMPORTANT LENGTH REQUIREMENT:

${plan_type === 'silver' ? `
- The report must be long: approximately **12,000 words** (~12 pages).
- Moderate detail level
- Focus on practical Vastu analysis and remedies
- Each major section below should be ~800–1000 words.
`
:
plan_type === 'gold' ? `
- The report must be long: approximately **13,000 words** (~13 pages).
- Deep and highly personalized analysis
- Include financial, health, relationship, and energy impact analysis
- Include advanced remedies and reasoning
- Each major section below should be ~1000–1100 words.
`
:
`
- The report must be long: approximately **14,000 - 15,000 words** (~14 - 15 pages).
- Ultra-premium consultation-style report
- Include map-based analysis
- Include personalized energy insights
- Include advanced lifestyle and spiritual suggestions
- Include luxury-level remedies
- Each major section below should be ~1200–1400 words.
`
}

- Keep writing until you have covered all sections in depth; do not stop early.
- Use professional, non-repetitive language.

REPORT STRUCTURE:
1. Executive Summary
2. Overall Vastu Score Explanation
3. Data Sources Used for Analysis
4. Strengths
5. Weaknesses
6. Room-wise Analysis
7. Direction-wise Analysis
8. Dosha Analysis
9. Remedies with Priority Levels
10. Short-term Action Plan (0–30 days)
11. Long-term Recommendations
12. Lifestyle & Behavioral Suggestions (as per Vastu)
13. Expected Outcomes After Remedies
14. Disclaimer
15. Final Conclusion

HOME DETAILS:
- Property Type: ${userAnswers.property_type}
- Purpose: ${userAnswers.purpose}

USERS ANSWERS:
`;

userAnswers.answers.forEach(answer => {
  prompt += `\n- ${answer.question_text}: ${answer.answer}`;
});

prompt += `\n CONTEXT (FROM DATABASE – RAG):\n
${finalContext}
`;

    }

    return prompt;
};

module.exports = { generateVastuReport };