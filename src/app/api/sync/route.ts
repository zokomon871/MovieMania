import { NextRequest, NextResponse } from 'next/server';
import { runSyncPipeline, getSyncStats } from '@/lib/syncEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trigger = searchParams.get('trigger') === 'true';

  if (trigger) {
    const asyncMode = searchParams.get('async') === 'true';
    if (asyncMode) {
      runSyncPipeline().catch(console.error);
      return NextResponse.json({
        success: true,
        message: 'Sync started in background',
        stats: getSyncStats(),
      });
    }

    const stats = await runSyncPipeline();
    return NextResponse.json({ success: stats.status === 'completed', stats });
  }

  const stats = getSyncStats();
  return NextResponse.json({ success: true, stats });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const asyncMode = searchParams.get('async') === 'true';

    if (asyncMode) {
      runSyncPipeline().catch(console.error);
      return NextResponse.json({
        success: true,
        message: 'Sync started in background',
        stats: getSyncStats(),
      });
    }

    const stats = await runSyncPipeline();
    return NextResponse.json({ success: stats.status === 'completed', stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
