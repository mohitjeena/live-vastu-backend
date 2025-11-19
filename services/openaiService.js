const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers) => {
  try {
    const prompt = createVastuPrompt(userAnswers);

    console.log("Sending request to OpenAI for JSON...");

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content:
            "You are a Vastu Shastra expert. Respond ONLY with valid JSON object.",
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



const createVastuPrompt = (userAnswers) => {
    let prompt = `Analyze this home for Vastu Shastra compliance and return JSON with exactly this structure:
{
    "score": 85,
    "report": "Your analysis report here..."
}

HOME DETAILS:\n`;
    
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

    return prompt;
};

module.exports = { generateVastuReport };