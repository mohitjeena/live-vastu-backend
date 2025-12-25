const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers, plan_type = 'basic') => {
  try {
    const content = [];

    // Base instruction
    content.push({
      type: "input_text",
      text: "Analyze the property using classical Vastu Shastra principles."
    });

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

      if (userAnswers.profile_image?.url) {
        content.push({
          type: "input_image",
          image_url: userAnswers.profile_image.url
        });
      }

       userAnswers.map_images?.forEach(img => {
        if (img.url) {
          content.push({
            type: "input_image",
            image_url: img.url
          });
        }
      });
    }

     content.push({
      type: "input_text",
      text: createVastuPrompt(userAnswers, plan_type)
    });


    console.log(`Generating ${plan_type} Vastu report...`);
    console.log(plan_type);
    

    const response = await client.responses.create({
      model: "gpt-4.1", 
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


const createVastuPrompt = (userAnswers,plan_type) => {
  if(plan_type === "basic"){
    let prompt = `
    Analyze this home for Vastu Shastra compliance and return JSON with exactly this structure:
{
    "score": 85,
    "report": "Your analysis report here..."
}

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