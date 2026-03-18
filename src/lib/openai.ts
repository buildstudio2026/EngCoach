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
    Generate exactly 10 natural and engaging English conversation questions.
    
    Structure of 10 questions:
    1. 7 Questions: Specifically target the user's saved expressions below to help them practice their notes.
    2. 3 Questions: Generate creative, general conversation questions on new topics (not related to the saved expressions) to keep the practice fresh and varied.
    
    User expressions to practice:
    ${expressions.map(e => `- ${e}`).join('\n')}
    
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
          "example": "A natural example answer",
          "targetExpression": "The specific user expression targeted by this question"
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
  GENERATE_REVIEW_QUIZ: (expressions: any[]) => `
    Generate a review quiz for these 30 English expressions.
    Return exactly 30 quiz items in JSON format.
    
    Processing Rules based on expression type:
    1. type "alternative" or "grammar": Generate a "Fill in the blanks" quiz. 
       - Identify the most meaningful and challenging part of the 'expression' (the "core" idiom, advanced vocabulary, or specific grammar pattern).
       - Replace THIS specific part with "___". 
       - CRITICAL: Never blank out simple, common words like 'do', 'have', 'is', 'go', 'the', 'a' unless they are part of a fixed phrase being tested.
       - The 'answer' should be ONLY the specific word(s) that fill those blanks.
    2. type "expression" or any others: Generate a "Translate to English" quiz.
       - Provide the 'meaning' (Korean).
       - The 'answer' should be the full English 'expression'.

    Input expressions:
    ${expressions.map(e => `- [${e.type}] ${e.expression} (${e.meaning})`).join('\n')}

    Return JSON format:
    {
      "quizzes": [
        {
          "type": "blank|translate",
          "question": "The quiz question text (with ___ for blank type, or Korean for translate type)",
          "meaning": "The Korean meaning for context",
          "answer": "The correct answer (just the blank part for 'blank', full string for 'translate')",
          "originalId": "id of the expression",
          "fullExpression": "The full original English expression for reference"
        }
      ]
    }
  `,
};
