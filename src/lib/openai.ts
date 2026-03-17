import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // We'll handle this in the routes, but for now we set it to empty string if missing
  // to prevent the client from crashing on initialization.
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing',
});

export const PROMPTS = {
  GENERATE_QUESTIONS: (expressions: string[]) => `
    ${expressions.length > 0 
      ? `User expressions to practice:\n${expressions.map(e => `- ${e}`).join('\n')}\n\nGenerate 10 natural and engaging English conversation questions that naturally prompt the user to use these expressions.`
      : 'Generate 10 natural, varied, and engaging English conversation questions about daily life, interests, and experiences.'}
    
    Guidelines:
    - Cover a wide range of real-life topics: work-life balance, health and wellness, social trends, personal growth, technology's impact on life, weekend plans, etc.
    - Focus on natural, conversational English that people actually use in real life.
    - Each question should be distinct to avoid repitition.
    
    Also provide a Korean translation and a natural example answer for each question.
    Return the response in JSON format:
    {
      "questions": [
        { 
          "question": "the English question", 
          "meaning": "한국어 해석",
          "example": "A natural example answer using the targeted expressions if possible"
        },
        ...
      ]
    }
  `,
  ANALYZE_CONVERSATION: (sentences: string[]) => `
    Analyze these user sentences from today's English practice:
    ${sentences.map(s => `- ${s}`).join('\n')}

    Please extract exactly 9 unique suggestions, 3 for each category:
    1. 3 Native Alternatives (type: "alternative"): Natural, fluent replacements for user sentences.
    2. 3 Useful Expressions (type: "expression"): New idioms or phrases relevant to the topic.
    3. 3 Grammar Tips (type: "grammar"): Explanations or corrections for grammar mistakes.

    Strict Rules:
    - Return EXACTLY 9 items (3 per category).
    - NO overlap: Each suggestion must address a unique point and belong to ONLY one category.
    - explanation: Why is this better or what is the grammar rule? (Write in Korean)
    - meaning: What does the suggestion mean? (Write in Korean)
    - Return in JSON format:
    {
      "suggestions": [
        { 
          "original": "the user's original sentence or phrase",
          "expression": "the improved or suggested English text", 
          "type": "alternative|expression|grammar",
          "meaning": "한국어 뜻",
          "explanation": "왜 이게 더 좋은지 또는 문법 설명 (한국어)"
        }
      ]
    }
  `,
};
