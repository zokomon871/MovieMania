import React from 'react';
import { getTrendingSeries, getPopularSeries } from '@/lib/seriesService';
import { SeriesExplorer } from '@/components/series/SeriesExplorer';

export const revalidate = 3600;

export default async function SeriesPage() {
  const [trending, popular] = await Promise.all([
    getTrendingSeries(20),
    getPopularSeries(1, 20),
  ]);

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '20px' }}>
        <SeriesExplorer initialTrending={trending} initialPopular={popular} />
      </div>
    </main>
  );
}
