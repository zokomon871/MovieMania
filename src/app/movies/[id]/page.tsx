import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, ArrowLeft } from 'lucide-react';
import { getMovieDetails } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/mediaUtils';
import { VODPlayer } from '@/components/player/VODPlayer';

export default async function MoviePlayerPage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id);
  if (!movie) notFound();

  const backdrop = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');
  const poster = getImageUrl(movie.poster_path);

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '100px', position: 'relative' }}>
      <div
        className="vod-backdrop-cover"
        style={{ backgroundImage: `url(${backdrop})` }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '24px' }}>
        <Link
          href="/movies"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Movies
        </Link>

        <div style={{ marginBottom: '28px' }}>
          <VODPlayer imdbId={movie.id || params.id} tmdbId={movie.tmdbId} title={movie.title} />
        </div>

        <div className="vod-detail-grid">
          <div className="vod-poster-box">
            <img src={poster} alt={movie.title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '14px' }} />
          </div>

          <div className="vod-info-box">
            <h1 className="vod-title">
              {movie.title}
            </h1>

            <div className="vod-meta">
              <div className="vod-rating">
                <Star size={18} fill="var(--accent)" />
                {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'} / 10
              </div>
              <div className="vod-year">
                <Calendar size={16} />
                {movie.release_date?.substring(0, 4)}
              </div>
            </div>

            <div className="vod-synopsis-box">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Synopsis</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {movie.overview}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
