import { ai } from '../../gemini';

export async function runInsightAgent(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text || 'No insights generated.';
  } catch (error: any) {
    console.error('[InsightAgent Error]', error);
    return 'Insights are temporarily unavailable';
  }
}
