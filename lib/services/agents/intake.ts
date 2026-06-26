import { Report, SystemConfig, IntakePayload } from '@/lib/types';
import { STATUS_LIFECYCLE, SeverityLevel } from '@/lib/constants';
import { adminDb } from '@/lib/firebase-admin';
import { ai } from '@/lib/gemini';

export async function runIntakeAgent(payload: IntakePayload): Promise<Report> {
  const now = new Date().toISOString();
  
  if (!payload.geo) {
    throw new Error('Geolocation is missing. Please provide latitude and longitude coordinates manually.');
  }
  
  // Initialize standard report structure with defaults
  const reportId = 'rep_' + Math.random().toString(36).substring(2, 15);
  const report: Report = {
    id: reportId,
    citizenId: payload.citizenId,
    mediaUrl: payload.mediaUrl,
    description: payload.description || '',
    geo: payload.geo,
    category: 'Other',
    severity: 'LOW',
    confidence: 0,
    status: STATUS_LIFECYCLE.SUBMITTED,
    duplicateOf: null,
    department: null,
    priority: null,
    history: [
      {
        status: STATUS_LIFECYCLE.SUBMITTED,
        timestamp: now,
        note: 'Report successfully submitted by citizen.',
      }
    ],
    createdAt: now,
    updatedAt: now,
  };

  let succeededWithModel = '';

  try {
    // 1. Fetch config from Firestore (adminDb)
    const configSnap = await adminDb.collection('config').doc('system_config').get();
    if (!configSnap.exists) {
      throw new Error('System configuration is missing in config/system_config collection.');
    }
    const config = configSnap.data() as SystemConfig;

    // 2. Extract base64 image data and mimeType from mediaUrl if it's a data URI
    let base64Data = '';
    let mimeType = 'image/jpeg';
    
    if (payload.mediaUrl && payload.mediaUrl.startsWith('data:')) {
      const match = payload.mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = payload.mediaUrl;
      }
    } else {
      base64Data = payload.mediaUrl || '';
    }

    if (!base64Data) {
      throw new Error('No image file or image data was provided.');
    }

    // 3. Build detailed prompt for Gemini Vision API
    const geminiPrompt = `
      You are the municipal Intake Agent of the "Community Hero" citizen issue reporting platform.
      Analyze this image of a public or municipal issue, along with the citizen-provided description.
      
      Citizen Description: "${payload.description || 'No description provided.'}"
      
      Your task is to classify this report.
      
      Allowed Categories: [${config.categories.map(c => `"${c}"`).join(', ')}]
      Allowed Severity Levels: [${config.severityLevels.map(s => `"${s}"`).join(', ')}]
      
      You must return a JSON object conforming exactly to this structure:
      {
        "category": "One of the allowed categories listed above",
        "severity": "One of the allowed severity levels listed above",
        "confidence": A floating point number between 0.0 and 1.0 representing your classification confidence,
        "reasoning": "A concise explanation of why this category and severity level were chosen based on visual and textual evidence"
      }
    `;

    // 4. Call Gemini Vision API with retry mechanism for transient errors (503 and 429)
    let response: any;
    let attempts = 0;
    const maxAttempts = 3;
    let delayMs = 1000; // start delay at 1-2 seconds (1000ms)
    let retriesAttempted = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            geminiPrompt,
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        succeededWithModel = 'gemini-3.5-flash';
        break; // Success, exit retry loop
      } catch (err: any) {
        const isTransient = (
          err.status === 503 || err.status === 429 ||
          err.statusCode === 503 || err.statusCode === 429 ||
          err.code === 503 || err.code === 429 ||
          /503|unavailable|429|rate limit|resource exhausted/i.test(err.message || '')
        );

        if (isTransient) {
          if (attempts < maxAttempts) {
            retriesAttempted++;
            console.warn(`[IntakeAgent] Transient error on attempt ${attempts} (${err.message}). Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs += 500; // slightly increase delay (e.g. 1.0s, 1.5s, etc.)
          } else {
            console.warn(`[IntakeAgent] All ${maxAttempts} attempts on gemini-3.5-flash exhausted due to transient errors. Proceeding to gemini-3.1-flash-lite fallback...`);
            break;
          }
        } else {
          // Non-transient error, fail immediately without trying fallback model
          throw err;
        }
      }
    }

    // If we didn't succeed with gemini-3.5-flash, try gemini-3.1-flash-lite as a final fallback
    if (!succeededWithModel) {
      try {
        console.log(`[IntakeAgent] Attempting one final fallback with gemini-3.1-flash-lite...`);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            geminiPrompt,
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        succeededWithModel = 'gemini-3.1-flash-lite';
      } catch (fallbackErr: any) {
        // If the fallback also fails, we throw an error with details about retries and fallback failure
        throw new Error(`All attempts failed. gemini-3.5-flash retries exhausted (${retriesAttempted} retries attempted). gemini-3.1-flash-lite fallback failed with: ${fallbackErr.message || 'Unknown error'}`);
      }
    }

    const responseText = response?.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Clean any markdown formatting if present
    let cleanJsonText = responseText.trim();
    if (cleanJsonText.startsWith('```json')) {
      cleanJsonText = cleanJsonText.substring(7, cleanJsonText.length - 3).trim();
    } else if (cleanJsonText.startsWith('```')) {
      cleanJsonText = cleanJsonText.substring(3, cleanJsonText.length - 3).trim();
    }

    const result = JSON.parse(cleanJsonText);

    // Validate the parsed response structure and values
    const parsedCategory = result.category;
    const parsedSeverity = result.severity;
    const parsedConfidence = typeof result.confidence === 'number' ? result.confidence : 0;
    const reasoning = result.reasoning || 'No reasoning provided by agent.';

    const isValidCategory = config.categories.includes(parsedCategory);
    const isValidSeverity = config.severityLevels.includes(parsedSeverity);

    if (isValidCategory && isValidSeverity && parsedConfidence >= 0.5) {
      // SUCCESS path
      report.category = parsedCategory;
      report.severity = parsedSeverity as SeverityLevel;
      report.confidence = parsedConfidence;
      report.status = STATUS_LIFECYCLE.CATEGORIZED;
      
      report.history.push({
        status: STATUS_LIFECYCLE.CATEGORIZED,
        timestamp: new Date().toISOString(),
        note: `[V2-FALLBACK-ACTIVE] AI Categorization Succeeded (Model: ${succeededWithModel}, Confidence: ${(parsedConfidence * 100).toFixed(1)}%). Category: "${parsedCategory}", Severity: "${parsedSeverity}". Reasoning: ${reasoning}`,
      });
    } else {
      // UNSUCCESSFUL/LOW CONFIDENCE path
      report.category = isValidCategory ? parsedCategory : 'Other';
      report.severity = (isValidSeverity ? parsedSeverity : 'LOW') as SeverityLevel;
      report.confidence = parsedConfidence;
      report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;

      let failureReason = 'Low classification confidence.';
      if (!isValidCategory) failureReason = `Invalid category "${parsedCategory}" returned by AI.`;
      else if (!isValidSeverity) failureReason = `Invalid severity level "${parsedSeverity}" returned by AI.`;

      report.history.push({
        status: STATUS_LIFECYCLE.NEEDS_REVIEW,
        timestamp: new Date().toISOString(),
        note: `[V2-FALLBACK-ACTIVE] Intake Agent: Moved to Needs Review. Cause: ${failureReason} (Model: ${succeededWithModel}, Confidence: ${(parsedConfidence * 100).toFixed(1)}%). Reasoning: ${reasoning}`,
      });
    }

  } catch (error: any) {
    console.error('[IntakeAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: new Date().toISOString(),
      note: `[V2-FALLBACK-ACTIVE] Intake execution failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
  }

  report.updatedAt = new Date().toISOString();
  return report;
}
