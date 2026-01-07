const OpenAI = require("openai");
const Chunk = require("../models/Chunk")
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers, plan_type = 'basic') => {
  try {
    const content = [];

       if (plan_type === "premium_plus" && userAnswers.profile_image && userAnswers.map_images.length !== 0) {
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

            ${plan_type === 'basic' ? 
              'Provide concise analysis in 2 paragraphs.' : 
              'Provide detailed, comprehensive analysis in 15-20 pages.'}`,
        },
        {
          role: "user",
          content
        },
      ],
       max_output_tokens: 20000,
       
    });
    let report = null;
    let raw_text = response.output_text
    try {
      if(plan_type === 'basic')
      {
      report =await JSON.parse(raw_text);
      }
      else{
        report = raw_text;
      }
      
    } catch (error) {
      console.log('error while report parsing to json');
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
    "score": 85,
    "report": "Your analysis report here..."
}

CRITICAL INSTRUCTION:
You MUST generate the Vastu report ONLY using the information provided
in the CONTEXT section below, combined with the user's answers.
Do NOT rely on external knowledge.
If something is missing, infer carefully using Vastu principles
from the CONTEXT only.

REPORT FORMAT RULES:
- "score": Number between 0-100 representing Vastu compliance
- "report": 
- report MUST contain exactly TWO sections with 15-20 lines
- Use <h3> for section titles
- Use <p> for paragraphs
- Each section should have 5–7 lines
- Keep language professional and easy to understand

SECTION STRUCTURE:

<h3>Current Vastu Analysis</h3>
<p>Paragraph content here...</p>

<h3>Remedies & Recommendations</h3>
<p>Paragraph content here...</p>

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

- Return ONLY a COMPLETE and VALID HTML document
- Do NOT return JSON
- Do NOT return markdown
- Do NOT add explanations, comments, or extra text
- The response MUST start with <html> and end with </html>
- Use proper semantic HTML tags (h1, h2, h3, p, ul, li, table, tr, td)
- Ensure well-structured formatting suitable for a 10–15 page professional report
- Do NOT include code blocks
- Do NOT mention OpenAI or AI in the report

TASK:
Generate a PROFESSIONAL Vastu Shastra report in HTML format.
Length must be equivalent to 15–20 pages.

CRITICAL INSTRUCTION:
You MUST generate the Vastu report ONLY using the information provided
in the CONTEXT section below, combined with the user's answers.
Do NOT rely on external knowledge.
If something is missing, infer carefully using Vastu principles
from the CONTEXT only.


IMPORTANT LENGTH REQUIREMENT:
- The report must be long: approximately **14,000 words** (~14 pages).
- Each major section below should be ~1200–1400 words.
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