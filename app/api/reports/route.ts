import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { seedDatabase } from '@/lib/services/seed';
import { processReportLifecycle } from '@/lib/services/agents/manager';
import { Report } from '@/lib/types';

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  try {
    // Seed system config and departments if not present
    await seedDatabase();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius'); // in km

    let queryRef: any = adminDb.collection('reports');

    if (statusParam) {
      queryRef = queryRef.where('status', '==', statusParam);
    }

    const snapshot = await queryRef.get();
    const reports: Report[] = [];

    snapshot.forEach((docSnap: any) => {
      reports.push(docSnap.data() as Report);
    });

    // Apply geo-radius filtering in-memory if coordinates are supplied
    if (latParam && lngParam && radiusParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      const radius = parseFloat(radiusParam);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
        const filtered = reports.filter((report) => {
          if (!report.geo) return false;
          const dist = calculateDistance(lat, lng, report.geo.lat, report.geo.lng);
          return dist <= radius;
        });
        return NextResponse.json(filtered);
      }
    }

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('[GET /api/reports Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to list reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Seed system config and departments if not present
    await seedDatabase();

    const body = await req.json();
    const { citizenId, mediaUrl, geo, description } = body;

    if (!citizenId || !mediaUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: citizenId and mediaUrl are mandatory.' },
        { status: 400 }
      );
    }

    // Process the citizen submission through the multi-agent pipeline
    const processedReport = await processReportLifecycle({
      citizenId,
      mediaUrl,
      geo: geo,
      description: description || '',
    });

    return NextResponse.json(processedReport, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/reports Error]', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit report' }, { status: 500 });
  }
}
