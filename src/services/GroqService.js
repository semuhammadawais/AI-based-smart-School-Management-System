import axios from 'axios';

const API_KEY = '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';

export const generateStudentReport = async studentData => {
  try {
    const prompt = `
You are a school performance analyst. Analyze this student's REAL data and return a JSON report.

REAL STUDENT DATA (use ONLY these numbers, do not invent or assume anything):
- Student Name: ${studentData.studentName}
- Class: ${studentData.class}
- Attendance: ${studentData.attendance.presentDays} days present, ${
      studentData.attendance.absentDays
    } days absent, ${studentData.attendance.percentage}% attendance rate
- Average Marks: ${studentData.academic.averageMarks} out of 100
- Subject-wise Results: ${JSON.stringify(studentData.academic.subjects)}

STRICT RULES:
1. Base EVERY field strictly on the numbers above. Do not invent strengths or weaknesses.
2. healthScore: calculate as (attendance_percentage * 0.4) + (average_marks * 0.6), round to integer.
3. riskLevel: "Low" if healthScore >= 75, "Medium" if >= 50, "High" if below 50.
4. strengths: only list genuine strengths from the real data. If attendance is 0%, do NOT list it as a strength.
5. weaknesses: only list real weaknesses. If a subject has low marks, name that subject specifically.
6. recommendations: give 3 specific, actionable steps based on the real data.
7. academicSummary: 2-3 sentences, mention actual numbers (marks, attendance %).
8. futurePrediction: 1-2 sentences based on current trend.

Return ONLY this JSON, no markdown, no extra text:
{
  "healthScore": <integer 0-100>,
  "riskLevel": <"Low" | "Medium" | "High">,
  "academicSummary": <string>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "recommendations": [<string>, <string>, <string>],
  "futurePrediction": <string>
}
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a strict JSON-only responder. You only output valid JSON with no markdown, no backticks, no explanation. You never invent data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // lower = more factual, less creative
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data.choices?.[0]?.message?.content || '{}';
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.log('Groq Error:', error?.response?.data || error?.message);
    return {
      healthScore: studentData?.academic?.averageMarks || 0,
      riskLevel: 'Medium',
      academicSummary: 'Unable to generate detailed AI report.',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      futurePrediction: '',
    };
  }
};
