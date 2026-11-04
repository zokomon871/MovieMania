'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play, Layers } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

export function SeriesCard({ series }: { series: ISeries }) {
  const poster = getImageUrl(series.poster || series.backdrop || null);

  return (
    <Link href={`/series/${series.id}`} className="movie-card-item" style={{ textDecoration: 'none' }}>
      <div className="movie-poster-box" style={{ position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-surface)' }}>
        <img src={poster} alt={series.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="movie-card-overlay">
          <div className="movie-play-btn">
            <Play size={20} fill="#fff" />
          </div>
        </div>
        {series.seasonsCount && series.seasonsCount > 1 && (
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={11} color="var(--accent)" />
            {series.seasonsCount} S
          </div>
        )}
      </div>

      <div style={{ marginTop: '8px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {series.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>{series.year || 'Series'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent)', fontWeight: 600 }}>
            <Star size={12} fill="var(--accent)" />
            {series.rating ? series.rating.toFixed(1) : 'NR'}
          </span>
        </div>
      </div>
    </Link>
  );
}

