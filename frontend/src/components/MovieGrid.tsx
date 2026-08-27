'use client';

import React from 'react';
import Link from 'next/link';
import { TMDBMovie, getImageUrl } from '@/lib/tmdb';
import { Play, Star } from 'lucide-react';

export default function MovieGrid({ movies, title }: { movies: TMDBMovie[], title: string }) {
  if (movies.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>{title}</h2>
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-surface)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No movies found. Please check your TMDb API Key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>{title}</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '24px' 
      }}>
        {movies.map((movie) => (
          <Link href={`/movies/${movie.id}`} key={movie.id} style={{ textDecoration: 'none' }}>
            <div 
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '2/3',
                background: 'var(--bg-surface)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getImageUrl(movie.poster_path)} 
                alt={movie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px'
              }}>
                <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {movie.title}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Star size={14} fill="#fbbf24" />
                    {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {movie.release_date?.substring(0, 4)}
                  </div>
                </div>
              </div>
              
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                background: 'rgba(0,0,0,0.3)',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                <div style={{ background: 'var(--accent-red)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={24} fill="#fff" color="#fff" style={{ marginLeft: '4px' }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
