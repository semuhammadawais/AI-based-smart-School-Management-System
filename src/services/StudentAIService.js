import axios from 'axios';

const API_KEY = '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';

export const generateStudentInsight = async studentData => {
  try {
    const prompt = `
You are a friendly student mentor AI.

Your job is to help the student improve daily.

Student Data:
${JSON.stringify(studentData)}

Return ONLY valid JSON:

{
  "motivation": "",
  "todayFocus": "",
  "weakArea": "",
  "tip": "",
  "studyPlan": ""
}

Rules:
- Use very simple English
- Keep sentences short
- Be encouraging and positive
- No markdown, no explanation
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data?.choices?.[0]?.message?.content || '{}';

    // Clean markdown if model adds it
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError);

      return {
        motivation: 'Keep going, you are improving step by step!',
        todayFocus: 'Focus on your weak subjects today',
        weakArea: 'Check recent mistakes and revise them',
        tip: 'Study 25 minutes then take a 5-minute break',
        studyPlan: '2 hours daily: 1 hour study + 1 hour practice',
      };
    }
  } catch (error) {
    console.log('Student AI Error:', error?.response?.data || error?.message);

    return {
      motivation: 'Dont give up, you are doing great!',
      todayFocus: 'Revise one subject today',
      weakArea: 'Practice more in difficult topics',
      tip: 'Stay consistent every day',
      studyPlan: 'Make a simple daily study routine',
    };
  }
};
