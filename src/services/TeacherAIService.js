import axios from 'axios';

const API_KEY = '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';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Base Grok (Groq) API caller
 */
const callGrok = async prompt => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational data analyst for teachers. You analyze school data and give clear, simple, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.log(
      'Teacher AI API Error:',
      error?.response?.data || error.message,
    );

    return 'Unable to generate AI response at the moment.';
  }
};

/**
 * 📊 Class Performance Analysis
 */
export const analyzeClassPerformance = async students => {
  const prompt = `
Analyze this class data and calculate:

1. Total students
2. Pass percentage (marks >= 40)
3. Fail percentage
4. Average class performance
5. Active students (attendance >= 75%)
6. Weak students (marks < 50)
7. Top performers

Then give clear insights and suggestions for improvement.

Class Data:
${JSON.stringify(students)}

Return in simple readable format. No JSON.
`;

  return await callGrok(prompt);
};

/**
 * ⚠️ Students Requiring Attention
 */
export const analyzeAttentionStudents = async students => {
  const prompt = `
Identify students who need attention.

Rules:
- Low attendance (< 75%)
- Low marks (< 50)
- Declining performance

For each student provide:
- Name
- Issue
- Risk level (Low / Medium / High)
- Recommendation

Class Data:
${JSON.stringify(students)}

Return clean structured teacher-friendly output.
`;

  return await callGrok(prompt);
};

/**
 * 💡 Teaching Recommendations
 */
export const generateTeachingRecommendations = async students => {
  const prompt = `
You are a senior education advisor.

Based on this class data:

Give:

1. Weak subject areas
2. Teaching improvements
3. Student engagement ideas
4. Exam preparation strategy
5. Class improvement plan

Make it practical and simple for teachers.

Class Data:
${JSON.stringify(students)}

No JSON. Only readable suggestions.
`;

  return await callGrok(prompt);
};
