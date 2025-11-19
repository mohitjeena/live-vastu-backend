const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateVastuReport = async (userAnswers) => {
    try {
        // Prepare the prompt for OpenAI
        const prompt = createVastuPrompt(userAnswers);
        
        console.log('Sending request to OpenAI for JSON response...');
        
        const response = await client.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: `You are a Vastu Shastra expert. Analyze home directions and provide a JSON response with score and report.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_completion_tokens: 500,
            response_format: { type: "json_object" } // Force JSON response
        });

        console.log('OpenAI JSON response received');
        const jsonResponse = JSON.parse(response.choices[0].message.content);
        return jsonResponse;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('Failed to generate Vastu report');
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