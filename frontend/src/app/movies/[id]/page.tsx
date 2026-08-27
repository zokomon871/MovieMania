import React from 'react';
import { getMovieDetails, getImageUrl } from '@/lib/tmdb';
import VODPlayer from '@/components/VODPlayer';
import Link from 'next/link';
import { Star, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function MoviePlayerPage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id);

  if (!movie) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '100px' }}>
      {/* Cinematic Backdrop */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '70vh',
        backgroundImage: `url(${getImageUrl(movie.backdrop_path || movie.poster_path, 'original')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        zIndex: 0,
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '40px' }}>
        
        {/* Breadcrumb / Back Navigation */}
        <Link 
          href="/movies" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
        >
          <ArrowLeft size={16} />
          Back to Movies
        </Link>

        {/* Player Container */}
        <div style={{ marginBottom: '40px' }}>
          <VODPlayer tmdbId={params.id} title={movie.title} />
        </div>

        {/* Movie Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
          {/* Left Column: Poster */}
          <div style={{ display: 'none' }} className="md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getImageUrl(movie.poster_path)} 
              alt={movie.title}
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
            />
          </div>

          {/* Right Column: Info */}
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.1 }}>
              {movie.title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '1.1rem', fontWeight: 700 }}>
                <Star size={18} fill="#fbbf24" />
                {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'} / 10
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                <Calendar size={16} />
                {movie.release_date?.substring(0, 4)}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Synopsis</h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {movie.overview}
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
