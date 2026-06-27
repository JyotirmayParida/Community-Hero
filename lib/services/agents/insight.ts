import { ai } from '../../gemini';

export async function runInsightAgent(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the following municipal report data and provide a predictive civic trend insight.

DATA SUMMARY:
${prompt}

STRICT CONSTRAINTS:
1. Output MUST be plain prose ONLY. Absolutely no markdown symbols like asterisks (**), hashtags (###), bullet points, list items (-), blockquotes (>), or backticks.
2. The response must contain a MAXIMUM of 2 sentences.
3. The insight must be written for a citizen reading a public dashboard (friendly, clear, and highly informative).
4. Do NOT draft any letters or complaints. Do NOT include notes for developers, technical meta-commentary, or status updates.
5. If the data is insufficient, sparse, or does not show any clear, recurring patterns, state plainly in exactly one sentence that there is currently not enough municipal data to identify clear trend patterns. Do not invent speculative analysis to fill space.`,
      config: {
        systemInstruction: 'You are a municipal data analysis engine that outputs plain-text-only dashboard insights for citizens.',
        temperature: 0.1,
      },
    });

    let text = response.text || '';
    
    // Fallback: Programmatically strip out standard markdown artifacts
    text = text
      .replace(/[#*`_>~]/g, '') // Remove standard formatting characters
      .replace(/^\s*-\s+/gm, '') // Remove leading list hyphens
      .replace(/\s+/g, ' ') // Collapse multiple spaces and lines
      .trim();

    return text || 'There is currently not enough municipal data to identify clear trend patterns.';
  } catch (error: any) {
    console.error('[InsightAgent Error]', error);
    return 'Insights are temporarily unavailable';
  }
}

