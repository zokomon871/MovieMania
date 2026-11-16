'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Film, Tv, Play, Star, Sparkles, AlertCircle } from 'lucide-react';
import { ITMDBMovie, ISeries, IChannel } from '@/lib/types';
import { getImageUrl, formatRating, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPlayChannel?: (channel: IChannel) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onPlayChannel }: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series' | 'channels'>('all');
  const [movies, setMovies] = useState<ITMDBMovie[]>([]);
  const [series, setSeries] = useState<ISeries[]>([]);
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setMovies([]);
      setSeries([]);
      setChannels([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchAll = async () => {
      try {
        const [movRes, serRes, chanRes] = await Promise.all([
          fetch(`/api/movies/search?query=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => ({ results: [] })),
          fetch(`/api/series/search?query=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => ({ results: [] })),
          fetch(`/api/channels?search=${encodeURIComponent(q)}&limit=16`).then((r) => r.json()).catch(() => ({ channels: [] })),
        ]);

        setMovies(movRes.results || []);
        setSeries(serRes.results || []);
        setChannels(chanRes.channels || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const totalResults = movies.length + series.length + channels.length;

  return (
    <div className="netflix-search-overlay" onClick={onClose}>
      <div className="netflix-search-box" onClick={(e) => e.stopPropagation()}>
        <Search
          size={22}
          color="var(--accent)"
          style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, TV shows, actors, or live channels..."
          className="netflix-search-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: '54px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
          }}
          title="Close search (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      {query && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            maxWidth: '720px',
            width: '100%',
          }}
        >
          {(['all', 'movies', 'series', 'channels'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`netflix-tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
            >
              {tab === 'all'
                ? `All (${totalResults})`
                : tab === 'movies'
                ? `Movies (${movies.length})`
                : tab === 'series'
                ? `TV Shows (${series.length})`
                : `Live TV (${channels.length})`}
            </button>
          ))}
        </div>
      )}

      <div
        className="netflix-search-results-grid"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Searching database & Cinemeta...
          </div>
        ) : query && totalResults === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
            No titles or channels matched &quot;{query}&quot;. Try another query or genre.
          </div>
        ) : (
          <>
            {/* MOVIES */}
            {(activeTab === 'all' || activeTab === 'movies') &&
              movies.map((m) => {
                const poster = getImageUrl(m.poster_path || m.backdrop_path);
                return (
                  <Link
                    key={`m-${m.id}`}
                    href={`/movies/${m.id}`}
                    onClick={onClose}
                    className="netflix-card"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="netflix-card-poster">
                      <img
                        src={poster}
                        alt={m.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_POSTER) {
                            e.currentTarget.src = FALLBACK_POSTER;
                          }
                        }}
                      />
                      <div className="netflix-card-badge">MOVIE</div>
                      <div className="movie-card-overlay">
                        <div className="movie-play-btn">
                          <Play size={18} fill="#fff" />
                        </div>
                      </div>
                    </div>
                    <div className="netflix-card-info">
                      <h4 className="netflix-card-title">{m.title}</h4>
                      <div className="netflix-card-meta">
                        <span>{formatYear(m.release_date)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#46d369' }}>
                          <Star size={11} fill="#46d369" /> {formatRating(m.vote_average)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

            {/* SERIES */}
            {(activeTab === 'all' || activeTab === 'series') &&
              series.map((s) => {
                const poster = getImageUrl(s.poster || s.backdrop || null);
                return (
                  <Link
                    key={`s-${s.id}`}
                    href={`/series/${s.id}`}
                    onClick={onClose}
                    className="netflix-card"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="netflix-card-poster">
                      <img
                        src={poster}
                        alt={s.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_POSTER) {
                            e.currentTarget.src = FALLBACK_POSTER;
                          }
                        }}
                      />
                      <div className="netflix-card-badge">SERIES</div>
                      <div className="movie-card-overlay">
                        <div className="movie-play-btn">
                          <Play size={18} fill="#fff" />
                        </div>
                      </div>
                    </div>
                    <div className="netflix-card-info">
                      <h4 className="netflix-card-title">{s.title}</h4>
                      <div className="netflix-card-meta">
                        <span>{s.year || 'TV'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#46d369' }}>
                          <Star size={11} fill="#46d369" /> {formatRating(s.rating)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

            {/* CHANNELS */}
            {(activeTab === 'all' || activeTab === 'channels') &&
              channels.map((c) => {
                const logo = c.logo;
                return (
                  <div
                    key={`c-${c.id}`}
                    onClick={() => {
                      onClose();
                      if (onPlayChannel) onPlayChannel(c);
                    }}
                    className="netflix-card"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="netflix-card-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b', padding: '16px' }}>
                      {logo ? (
                        <img src={logo} alt={c.name} style={{ maxHeight: '70%', maxWidth: '80%', objectFit: 'contain' }} />
                      ) : (
                        <Tv size={36} color="var(--text-muted)" />
                      )}
                      <div className="netflix-card-badge live">LIVE</div>
                      <div className="movie-card-overlay">
                        <div className="movie-play-btn">
                          <Play size={18} fill="#fff" />
                        </div>
                      </div>
                    </div>
                    <div className="netflix-card-info">
                      <h4 className="netflix-card-title">{c.name}</h4>
                      <div className="netflix-card-meta">
                        <span>{c.country || 'Global'}</span>
                        <span style={{ color: 'var(--accent)' }}>● Live</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}

export default GlobalSearchModal;
