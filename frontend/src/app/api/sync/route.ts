import { NextRequest, NextResponse } from 'next/server';
import { runSyncPipeline, getSyncStats } from '@/lib/syncEngine';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getSyncStats();
    let dbSyncMeta = null;
    try {
      const db = await getDb();
      dbSyncMeta = await db.collection('sync_meta').findOne({ key: 'last_sync' });
    } catch {
      // ignore if db not ready yet
    }

    return NextResponse.json({
      success: true,
      stats,
      meta: dbSyncMeta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Non-blocking trigger or synchronous run
    const { searchParams } = new URL(req.url);
    const asyncMode = searchParams.get('async') === 'true';

    if (asyncMode) {
      // Trigger in background
      runSyncPipeline().catch(console.error);
      return NextResponse.json({
        success: true,
        message: 'Sync started in background',
        stats: getSyncStats(),
      });
    }

    const stats = await runSyncPipeline();
    return NextResponse.json({
      success: stats.status === 'completed',
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
