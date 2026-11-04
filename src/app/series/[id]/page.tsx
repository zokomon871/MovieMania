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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '70vh',
          backgroundImage: `url(${backdrop})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: 0,
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '32px' }}>
        <Link
          href="/series"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Series
        </Link>

        <div style={{ marginBottom: '36px' }}>
          <SeriesPlayerView series={series} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px', alignItems: 'start' }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <img src={poster} alt={series.title} style={{ width: '100%', display: 'block' }} />
          </div>

          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '14px', lineHeight: 1.1 }}>
              {series.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>
                <Star size={18} fill="var(--accent)" />
                {series.rating ? series.rating.toFixed(1) : 'NR'} / 10
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                <Calendar size={16} />
                {series.year}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Synopsis</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {series.overview || 'No synopsis available for this TV series.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

