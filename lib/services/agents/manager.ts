import { runIntakeAgent } from './intake';
import { runDedupAgent } from './dedup';
import { runRoutingAgent } from './routing';
import { runEscalationAgent } from './escalation';
import { Report, IntakePayload, SystemConfig } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';

export async function processReportLifecycle(
  payload: IntakePayload
): Promise<Report> {
  // Step 1: Run Intake Agent (performs category and severity assessment via Gemini Vision)
  let report = await runIntakeAgent(payload);

  // Step 2: Run Dedup Agent (checks for duplicates of the determined category in proximity)
  if (report.status !== 'needs_review') {
    report = await runDedupAgent(report);
  }

  // Step 3: Run Routing Agent (routes to the correct municipal department & sets priority SLAs)
  if (report.status !== 'needs_review') {
    report = await runRoutingAgent(report);
  }

  // Step 4: Run Escalation Agent (evaluates and escalates high-criticality or severe logs)
  if (report.status !== 'needs_review') {
    let config: SystemConfig;
    try {
      const configSnap = await adminDb.collection('config').doc('system_config').get();
      if (configSnap.exists) {
        config = configSnap.data() as SystemConfig;
      } else {
        throw new Error('System config document is missing.');
      }
    } catch (err) {
      console.warn('[Manager] Defaulting system config for escalation agent:', err);
      config = {
        categories: [],
        severityLevels: [],
        slaHoursByPriority: { LOW: 48, MODERATE: 24, HIGH: 12, SEVERE: 8 }
      };
    }
    report = await runEscalationAgent(report, config);
  }

  // Save the final processed report document to Firestore via adminDb
  try {
    await adminDb.collection('reports').doc(report.id).set(report);
  } catch (error) {
    console.error('[Manager] Failed to write processed report to Firestore:', error);
  }

  return report;
}
