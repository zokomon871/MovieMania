'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play, Layers } from 'lucide-react';
import { ISeries } from '@/lib/types';
import { getImageUrl } from '@/lib/mediaUtils';

interface SeriesCardProps {
  series: ISeries;
  rank?: number;
}

export function SeriesCard({ series, rank }: SeriesCardProps) {
  const poster = getImageUrl(series.poster || series.backdrop || null);

  return (
    <Link href={`/series/${series.id}`} className="movie-card-item" style={{ textDecoration: 'none' }}>
      <div className="movie-poster-box">
        <img src={poster} alt={series.title} loading="lazy" />

        {rank !== undefined && (
          <div className="media-rank-badge">
            #{rank}
          </div>
        )}

        {series.seasonsCount && series.seasonsCount > 1 ? (
          <div className="media-season-pill">
            <Layers size={11} color="var(--accent)" />
            {series.seasonsCount} S
          </div>
        ) : (
          <div className="media-hd-pill">TV</div>
        )}

        <div className="movie-card-overlay">
          <div className="movie-play-btn">
            <Play size={20} fill="#fff" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <h4 className="media-card-title" title={series.title}>
          {series.title}
        </h4>
        <div className="media-card-meta">
          <span>{series.year || 'Series'}</span>
          <span className="media-card-rating">
            <Star size={12} fill="var(--accent)" />
            {series.rating ? series.rating.toFixed(1) : 'NR'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default SeriesCard;
