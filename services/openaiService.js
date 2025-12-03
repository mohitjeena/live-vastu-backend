const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers, plan_type = 'basic') => {
  try {
    // Different prompts based on plan type
    const prompt = createVastuPrompt(userAnswers, plan_type);

    console.log(`Generating ${plan_type} Vastu report...`);

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

    return JSON.parse(response.output_text);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate Vastu report");
  }
};



const createVastuPrompt = (userAnswers,plan_type = "basic") => {
  if(plan_type === "basic"){
    let prompt = `Analyze this home for Vastu Shastra compliance and return JSON with exactly this structure:
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
- "report": String with 8-9 lines in 2 paragraphs
  - First paragraph: Analysis of current Vastu compliance
  - Second paragraph: Specific remedies and recommendations
  - End with: "For complete analysis, consider our premium plans."
- Keep it professional but easy to understand`;
  }
  else {
          prompt = `Analyze this home for Vastu Shastra compliance and return EXACT JSON format:
{
    "score": 85,
    "report": "Main report text here...",
    "overview": "Brief overview of findings",
    "strengths": ["List of positive aspects"],
    "weaknesses": ["List of Vastu issues"],
    "remedies": ["Specific remedies with priority"],
    "room_analysis": {
        "living_room": "Analysis text",
        "bedroom": "Analysis text",
        "kitchen": "Analysis text",
        "bathroom": "Analysis text"
    },
    "directions_analysis": {
        "north": "Analysis",
        "south": "Analysis",
        "east": "Analysis",
        "west": "Analysis"
    },
    "action_plan": {
        "immediate": ["Actions within 1 week"],
        "short_term": ["Actions within 1 month"],
        "long_term": ["Actions within 6 months"]
    }
}

HOME DETAILS:
- Property Type: ${userAnswers.property_type}
- Purpose: ${userAnswers.purpose}

VASTU DATA:`;
    
    userAnswers.answers.forEach(answer => {
        prompt += `\n- ${answer.question_text}: ${answer.answer}`;
    });

    prompt += `\n\nPREMIUM REQUIREMENTS (10-14 pages equivalent):
- "score": Detailed scoring with breakdown
- "report": Comprehensive 10-14 page analysis with sections
- "overview": Executive summary (1 page)
- "strengths": List all positive Vastu elements
- "weaknesses": Detailed list of issues found
- "remedies": Specific remedies with materials/instructions
- "room_analysis": Each room detailed analysis
- "directions_analysis": Each direction impact
- "action_plan": Step-by-step implementation timeline
- Format: Professional but understandable
- Include: Diagrams suggestion, priority levels, costs if applicable`;

    }

    return prompt;
};

module.exports = { generateVastuReport };