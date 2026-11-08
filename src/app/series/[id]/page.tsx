import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, ArrowLeft } from 'lucide-react';
import { fetchSeriesDetails } from '@/lib/seriesService';
import { getImageUrl } from '@/lib/mediaUtils';
import { SeriesPlayerView } from '@/components/series/SeriesPlayerView';

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const series = await fetchSeriesDetails(params.id);
  if (!series) notFound();

  const backdrop = getImageUrl(series.backdrop || series.poster || null, 'original');
  const poster = getImageUrl(series.poster || series.backdrop || null);

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '100px', position: 'relative' }}>
      <div
        className="vod-backdrop-cover"
        style={{ backgroundImage: `url(${backdrop})` }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '24px' }}>
        <Link
          href="/series"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Series
        </Link>

        <div style={{ marginBottom: '28px' }}>
          <SeriesPlayerView series={series} />
        </div>

        <div className="vod-detail-grid">
          <div className="vod-poster-box">
            <img src={poster} alt={series.title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '14px' }} />
          </div>

          <div className="vod-info-box">
            <h1 className="vod-title">
              {series.title}
            </h1>

            <div className="vod-meta">
              <div className="vod-rating">
                <Star size={18} fill="var(--accent)" />
                {series.rating ? series.rating.toFixed(1) : 'NR'} / 10
              </div>
              <div className="vod-year">
                <Calendar size={16} />
                {series.year}
              </div>
            </div>

            <div className="vod-synopsis-box">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Synopsis</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {series.overview || 'No synopsis available for this TV series.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
