import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      console.error('[Verify ID Token Error]', err);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token.' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing reportId.' },
        { status: 400 }
      );
    }

    const reportRef = adminDb.collection('reports').doc(reportId);
    const docSnap = await reportRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Report not found.' },
        { status: 404 }
      );
    }

    const reportData = docSnap.data();
    if (!reportData) {
      return NextResponse.json(
        { error: 'Report is empty.' },
        { status: 500 }
      );
    }

    if (reportData.citizenId === userId) {
      return NextResponse.json(
        { error: 'You cannot confirm your own report.' },
        { status: 400 }
      );
    }

    const confirmations = reportData.confirmations || [];
    if (confirmations.includes(userId)) {
      return NextResponse.json(
        { error: 'You have already confirmed this report.' },
        { status: 400 }
      );
    }

    const updatedConfirmations = [...confirmations, userId];
    await reportRef.update({
      confirmations: updatedConfirmations,
      updatedAt: new Date().toISOString(),
    });

    // Increment points for reporter
    const reporterId = reportData.citizenId;
    if (reporterId) {
      try {
        const userRef = adminDb.collection('users').doc(reporterId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          const currentPoints = userData?.points || 0;
          await userRef.update({
            points: currentPoints + 5,
          });
          console.log(`Incremented points for reporter ${reporterId} by 5.`);
        }
      } catch (err) {
        console.error('Failed to increment user points:', err);
      }
    }

    return NextResponse.json({
      success: true,
      confirmations: updatedConfirmations,
    });
  } catch (error: any) {
    console.error('[POST /api/reports/confirm Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to confirm report.' },
      { status: 500 }
    );
  }
}
