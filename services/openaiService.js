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
            `You are a senior Vastu Shastra consultant with 30+ years of experience.
              You strictly follow classical Vastu Shastra principles.. 
              This report must be written in the professional analytical style and methodology commonly followed by
                    Dr. Puneet Chawla, a well-known Vastu Shastra expert.

                      IMPORTANT:
              - Do NOT claim personal consultation
              - Do NOT imply physical site visit
              - Present the report as expert-guided analysis
            ${plan_type === 'basic' ? 
              'Provide concise analysis in 2 paragraphs.' : 
              'Provide detailed, comprehensive analysis in 15-20 pages.'}`,
        },
        {
          role: "user",
          content
        },
      ],
       max_output_tokens: 16000,
       
    });
    let report = null;
    let raw_text = response.output_text
    try {
      console.log(raw_text.ai_score)
      report = JSON.parse(raw_text);
      
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
      limit: 20 
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




  if(plan_type === "basic"){

 console.log(uniqueTopics);
 


    let prompt = `
    Information to generate best vastu report : 
    ${finalContext}

    use this information and use your logic to generate best vastu report.
    Analyze this home for Vastu Shastra compliance and return JSON with exactly this structure:
{
    "score": 85,
    "report": "Your analysis report here..."
}
Given answers by user according to questions :
HOME DETAILS:\n`;
    prompt += `- Type: ${userAnswers.property_type}\n`;
    prompt += `- Purpose: ${userAnswers.purpose}\n\n`;
    prompt += `ANSWERS PROVIDED:\n`;
    userAnswers.answers.forEach(answer => {
        prompt += `- ${answer.question_text}: ${answer.answer}\n`;
    });
    
    prompt += `\nREQUIREMENTS:
- "score": Number between 0-100 representing Vastu compliance
- "report": String with 15-20 lines in 2 paragraphs
  - First paragraph: Analysis of current Vastu compliance
  - Second paragraph: Specific remedies and recommendations
  - End with: "For complete analysis, consider our premium plans."
- Keep it professional but easy to understand`;

return prompt;
  }
  else {
          prompt = `
IMPORTANT RULES:
- Return ONLY valid JSON
- Do NOT add any text outside JSON
- Do NOT use markdown
- Use proper HTML tags
- Escape double quotes inside HTML if needed

Return JSON in EXACT format:
{
  "score": 0,
  "report_html": ""
}

TASK:
Generate a PROFESSIONAL Vastu Shastra report in HTML format.
Length must be equivalent to 15–20 pages.

HTML REQUIREMENTS:
- Use <h1>, <h2>, <h3> for headings
- Use <p> for paragraphs
- Use <ul><li> for lists
- Use <strong> where needed
- No inline CSS
- No JavaScript
- Clean semantic HTML
- Large detailed content (10–14 pages equivalent)

SCORING GUIDELINES:
- Score range: 0–100
- Consider orientation, room placement, entrances, defects, and severity
- Explain score reasoning clearly inside report_html

IMPORTANT LENGTH REQUIREMENT:
- The "report_html" must be long: approximately **10,000 words** (~10 pages).
- Each major section below should be ~400–700 words.
- Keep writing until you have covered all sections in depth; do not stop early.
- Use professional, non-repetitive language.

REPORT STRUCTURE:
1. Executive Summary
2. Overall Vastu Score Explanation
3. Strengths
4. Weaknesses
5. Room-wise Analysis
6. Direction-wise Analysis
7. Dosha Analysis
8. Remedies with Priority
9. Action Plan
10. Final Conclusion

HOME DETAILS:
- Property Type: ${userAnswers.property_type}
- Purpose: ${userAnswers.purpose}

USERS ANSWERS:
`;

userAnswers.answers.forEach(answer => {
  prompt += `\n- ${answer.question_text}: ${answer.answer}`;
});

    }

    return prompt;
};

module.exports = { generateVastuReport };