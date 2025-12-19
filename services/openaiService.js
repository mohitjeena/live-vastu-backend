const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers, plan_type = 'basic') => {
  try {
    // Different prompts based on plan type
    const prompt = createVastuPrompt(userAnswers, plan_type);

    console.log(`Generating ${plan_type} Vastu report...`);
    console.log(plan_type);
    

    const response = await client.responses.create({
      model: "gpt-5-nano", 
      input: [
        {
          role: "system",
          content:
            `You are a senior Vastu Shastra expert with 30 years experience. 
            ${plan_type === 'basic' ? 
              'Provide concise analysis in 2 paragraphs.' : 
              'Provide detailed, comprehensive analysis in 10-14 pages.'}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      
    });
    let report = null;
    let raw_text = response.output_text
    try {
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

HTML REQUIREMENTS:
- Use <h1>, <h2>, <h3> for headings
- Use <p> for paragraphs
- Use <ul><li> for lists
- Use <strong> where needed
- No inline CSS
- Clean semantic HTML
- Large detailed content (10–14 pages equivalent)

REPORT STRUCTURE:
1. Executive Summary
2. Overall Vastu Score Explanation
3. Strengths
4. Weaknesses
5. Room-wise Analysis
6. Direction-wise Analysis
7. Remedies (with priority)
8. Action Plan (Immediate / Short / Long term)
9. Final Conclusion

HOME DETAILS:
- Property Type: ${userAnswers.property_type}
- Purpose: ${userAnswers.purpose}

VASTU INPUT DATA:
`;

userAnswers.answers.forEach(answer => {
  prompt += `\n- ${answer.question_text}: ${answer.answer}`;
});

    }

    return prompt;
};

module.exports = { generateVastuReport };