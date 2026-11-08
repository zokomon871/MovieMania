import React from 'react';
import { getTrendingSeriesFromDb, getPopularSeriesFromDb, searchSeries } from '@/lib/seriesService';
import { SeriesExplorer } from '@/components/series/SeriesExplorer';

export const revalidate = 3600;

export default async function SeriesPage() {
  let [trending, popular] = await Promise.all([
    getTrendingSeriesFromDb(20),
    getPopularSeriesFromDb(1, 20),
  ]);

  if (trending.length === 0) {
    trending = await searchSeries('', 'All', 'rating', 0, 1);
  }
  if (popular.length === 0) {
    popular = trending.slice(10);
  }

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="container" style={{ paddingTop: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
            TV Shows & Series
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
            Stream popular television series and anime with complete season and episode navigation.
          </p>
        </div>

        <SeriesExplorer initialTrending={trending} initialPopular={popular} />
      </div>
    </main>
  );
}

