import { Report, SystemConfig } from '@/lib/types';
import { STATUS_LIFECYCLE } from '@/lib/constants';

export async function runEscalationAgent(report: Report, config: SystemConfig): Promise<Report> {
  const now = new Date().toISOString();

  try {
    const routedLog = report.history.find(
      (log) => log.status === 'routed' || log.status === STATUS_LIFECYCLE.ROUTED
    );

    if (routedLog) {
      const routedTime = new Date(routedLog.timestamp).getTime();
      const nowTime = new Date(now).getTime();
      const hoursElapsed = (nowTime - routedTime) / (1000 * 60 * 60);

      const priority = report.priority || 'MODERATE';
      const allowedHours = config.slaHoursByPriority?.[priority] ?? 48;

      if (
        hoursElapsed > allowedHours &&
        report.status !== STATUS_LIFECYCLE.RESOLVED &&
        report.status !== STATUS_LIFECYCLE.ESCALATED
      ) {
        const hoursOverdue = hoursElapsed - allowedHours;
        report.status = STATUS_LIFECYCLE.ESCALATED;
        report.history.push({
          status: STATUS_LIFECYCLE.ESCALATED,
          timestamp: now,
          note: `Escalation Agent: SLA breach detected. Priority [${priority}] allows ${allowedHours} hours. Elapsed: ${hoursElapsed.toFixed(2)} hours (${hoursOverdue.toFixed(2)} hours overdue).`,
        });
        report.updatedAt = now;
      }
    }
  } catch (error: any) {
    console.error('[EscalationAgent Error]', error);
    report.status = STATUS_LIFECYCLE.NEEDS_REVIEW;
    report.history.push({
      status: STATUS_LIFECYCLE.NEEDS_REVIEW,
      timestamp: now,
      note: `Escalation evaluation failed: ${error?.message || 'Unknown error'}. Marked for review.`,
    });
    report.updatedAt = now;
  }

  return report;
}
