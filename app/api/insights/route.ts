import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { runInsightAgent } from '@/lib/services/agents/insight';
import { Report } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDb.collection('reports').get();
    const reports: Report[] = [];
    
    snapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as Report);
    });

    if (reports.length === 0) {
      return NextResponse.json({
        insight: 'No municipal data has been registered yet to generate trend observations.'
      });
    }

    if (reports.length < 5) {
      return NextResponse.json({
        insight: 'There is currently not enough municipal data to identify any significant civic trend patterns.'
      });
    }

    // Build categories and location summaries
    const categoryCounts: Record<string, number> = {};
    const locations: string[] = [];

    reports.forEach((report) => {
      const category = report.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      if (report.geo) {
        locations.push(`${category} near Lat ${report.geo.lat.toFixed(4)}, Lng ${report.geo.lng.toFixed(4)}`);
      }
    });

    const dataSummary = `
Total Reports Filed: ${reports.length}
Category Distribution:
${Object.entries(categoryCounts)
  .map(([cat, count]) => `- ${cat}: ${count} report(s)`)
  .join('\n')}

Geo Coordinates Sample:
${locations.slice(0, 20).join('\n')}
    `.trim();

    // Run the existing Gemini insight agent with the data summary
    const insight = await runInsightAgent(dataSummary);

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error('[GET /api/insights Error]', error);
    return NextResponse.json(
      { error: 'Insights are temporarily unavailable' },
      { status: 500 }
    );
  }
}
