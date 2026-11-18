'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Tv, Clock, Film } from 'lucide-react';
import { ITMDBMovie, ISeries, IChannel } from '@/lib/types';
import { getImageUrl, formatYear, FALLBACK_POSTER } from '@/lib/mediaUtils';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPlayChannel?: (channel: IChannel) => void;
}

const STORAGE_KEY = 'moviemania_recent_searches';

const SURPRISE_PICKS = [
  'Lost in Space',
  'Aquaman and the Lost Kingdom',
  'Dune: Part Two',
  'Interstellar',
  'Inception',
  'Stranger Things',
  'Arcane',
  'Breaking Bad',
  'The Dark Knight',
  'Naruto Shippuden',
  'Jurassic Park',
  'Attack on Titan',
  'Cyberpunk: Edgerunners',
  'Spider-Man: Across the Spider-Verse',
];

const DEFAULT_RECOMMENDATIONS = [
  { id: 'tt5232792', title: 'Lost in Space', type: 'series' as const, year: '2018', poster: 'https://images.metahub.space/poster/medium/tt5232792/img' },
  { id: 'tt15239678', title: 'Dune: Part Two', type: 'movie' as const, year: '2024', poster: 'https://image.tmdb.org/t/p/w200/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' },
  { id: 'tt4574334', title: 'Stranger Things', type: 'series' as const, year: '2016', poster: 'https://images.metahub.space/poster/medium/tt4574334/img' },
  { id: 'tt0903747', title: 'Breaking Bad', type: 'series' as const, year: '2008', poster: 'https://images.metahub.space/poster/medium/tt0903747/img' },
  { id: 'tt0816692', title: 'Interstellar', type: 'movie' as const, year: '2014', poster: 'https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: 'tt1375666', title: 'Inception', type: 'movie' as const, year: '2010', poster: 'https://image.tmdb.org/t/p/w200/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
];

export function GlobalSearchModal({ isOpen, onClose, onPlayChannel }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<ITMDBMovie[]>([]);
  const [series, setSeries] = useState<ISeries[]>([]);
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // In-memory cache for ultra-fast instant recall
  const searchCacheRef = useRef<Map<string, { movies: ITMDBMovie[]; series: ISeries[]; channels: IChannel[] }>>(
    new Map()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 160);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 6));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Lock body scroll and focus input on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 60);
      setSelectedIndex(-1);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Lightning fast search with client cache & abortable network calls
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setMovies([]);
      setSeries([]);
      setChannels([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    const cacheKey = q.toLowerCase();

    // Check client in-memory cache first (0ms latency!)
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setMovies(cached.movies);
      setSeries(cached.series);
      setChannels(cached.channels);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    // Cancel in-flight search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setSelectedIndex(-1);

    const fetchAll = async () => {
      try {
        const [movRes, serRes, chanRes] = await Promise.all([
          fetch(`/api/movies/search?query=${encodeURIComponent(q)}`, { signal: controller.signal })
            .then((r) => r.json())
            .catch(() => ({ results: [] })),
          fetch(`/api/series/search?query=${encodeURIComponent(q)}`, { signal: controller.signal })
            .then((r) => r.json())
            .catch(() => ({ results: [] })),
          fetch(`/api/channels?search=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal })
            .then((r) => r.json())
            .catch(() => ({ channels: [] })),
        ]);

        if (controller.signal.aborted) return;

        const movs = movRes.results || [];
        const sers = serRes.results || [];
        const chans = chanRes.channels || [];

        searchCacheRef.current.set(cacheKey, {
          movies: movs,
          series: sers,
          channels: chans,
        });

        setMovies(movs);
        setSeries(sers);
        setChannels(chans);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Combine unified results for keyboard navigation
  type FlatResult =
    | { type: 'movie'; id: string; title: string; year?: string; poster: string | null; href: string }
    | { type: 'series'; id: string; title: string; year?: string; poster: string | null; href: string }
    | { type: 'channel'; id: string; title: string; logo?: string; channel: IChannel };

  const flatResults: FlatResult[] = useMemo(() => {
    const list: FlatResult[] = [];
    movies.forEach((m) =>
      list.push({
        type: 'movie',
        id: String(m.id),
        title: m.title,
        year: formatYear(m.release_date),
        poster: m.poster_path || m.backdrop_path,
        href: `/movies/${m.id}`,
      })
    );
    series.forEach((s) =>
      list.push({
        type: 'series',
        id: String(s.id),
        title: s.title,
        year: s.year || 'TV',
        poster: s.poster || s.backdrop || null,
        href: `/series/${s.id}`,
      })
    );
    channels.forEach((c) =>
      list.push({
        type: 'channel',
        id: String(c.id),
        title: c.name,
        logo: c.logo,
        channel: c,
      })
    );
    return list;
  }, [movies, series, channels]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        if (flatResults.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
        }
      } else if (e.key === 'ArrowUp') {
        if (flatResults.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev <= 0 ? flatResults.length - 1 : prev - 1));
        }
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
          e.preventDefault();
          const target = flatResults[selectedIndex];
          saveRecentSearch(target.title);
          onClose();
          if (target.type === 'movie' || target.type === 'series') {
            router.push(target.href);
          } else if (target.type === 'channel') {
            if (onPlayChannel) onPlayChannel(target.channel);
          }
        } else if (query.trim()) {
          saveRecentSearch(query.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flatResults, selectedIndex, query, saveRecentSearch, router, onPlayChannel]);

  if (!isOpen) return null;

  const handlePickSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    inputRef.current?.focus();
  };

  const handleSurpriseMe = () => {
    const randomPick = SURPRISE_PICKS[Math.floor(Math.random() * SURPRISE_PICKS.length)];
    handlePickSearch(randomPick);
  };

  return (
    <div className="netflix-search-overlay" onClick={onClose}>
      <div className="search-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar (Matching Reference) */}
        <div className="search-bar-row">
          {isLoading ? (
            <Loader2
              size={20}
              color="var(--accent)"
              style={{ animation: 'searchSpin 0.8s linear infinite', flexShrink: 0 }}
            />
          ) : (
            <Search size={20} color="#94a3b8" style={{ flexShrink: 0 }} />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series..."
            className="search-input-field"
          />

          <button
            type="button"
            onClick={onClose}
            className="search-clear-circle"
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* "Not sure what to watch? Surprise me" Card (Matching Reference) */}
        <div className="search-surprise-card">
          <span className="search-surprise-text">Not sure what to watch?</span>
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="search-surprise-btn"
          >
            <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🎲</span>
            <span>Surprise me</span>
          </button>
        </div>

        {/* Results Vertical List */}
        <div className="search-results-list">
          {/* Loading Shimmer State */}
          {isLoading && (
            <div className="search-skeleton-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="search-skeleton-row">
                  <div className="search-skeleton-thumb" />
                  <div className="search-skeleton-text" />
                </div>
              ))}
            </div>
          )}

          {/* Results Matches */}
          {!isLoading && query.trim() && flatResults.length > 0 && (
            <>
              {flatResults.map((item, idx) => {
                const isFocused = selectedIndex === idx;

                if (item.type === 'channel') {
                  return (
                    <div
                      key={`c-${item.id}`}
                      onClick={() => {
                        saveRecentSearch(item.title);
                        onClose();
                        if (onPlayChannel) onPlayChannel(item.channel);
                      }}
                      className={`search-item-row ${isFocused ? 'keyboard-focused' : ''}`}
                    >
                      <div className="search-item-thumb">
                        {item.logo ? (
                          <img src={item.logo} alt={item.title} />
                        ) : (
                          <Tv size={20} color="#94a3b8" />
                        )}
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-title">{item.title}</div>
                        <div className="search-item-meta">
                          <span className="search-item-badge live">LIVE</span>
                          <span>{item.channel.country || 'Global'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                const posterUrl = getImageUrl(item.poster);

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    onClick={() => {
                      saveRecentSearch(item.title);
                      onClose();
                    }}
                    className={`search-item-row ${isFocused ? 'keyboard-focused' : ''}`}
                  >
                    <div className="search-item-thumb">
                      <img
                        src={posterUrl}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_POSTER) {
                            e.currentTarget.src = FALLBACK_POSTER;
                          }
                        }}
                      />
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-title">{item.title}</div>
                      <div className="search-item-meta">
                        <span className="search-item-badge">
                          {item.type === 'movie' ? 'Movie' : 'Series'}
                        </span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {/* No Results Fallback */}
          {!isLoading && query.trim() && flatResults.length === 0 && (
            <div className="search-empty-list-message">
              No titles or channels matched &quot;{query}&quot;
            </div>
          )}

          {/* Idle State: Recent Searches & Popular Recommendations */}
          {!isLoading && !query.trim() && (
            <>
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 12px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Clock size={13} />
                    <span>Recent Searches</span>
                  </div>
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handlePickSearch(term)}
                      className="search-item-row"
                      style={{ justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={16} color="#64748b" />
                        <span className="search-item-title">{term}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(term, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '8px 12px 6px',
                  }}
                >
                  Popular Titles
                </div>
                {DEFAULT_RECOMMENDATIONS.map((item) => (
                  <Link
                    key={item.id}
                    href={item.type === 'movie' ? `/movies/${item.id}` : `/series/${item.id}`}
                    onClick={() => {
                      saveRecentSearch(item.title);
                      onClose();
                    }}
                    className="search-item-row"
                  >
                    <div className="search-item-thumb">
                      <img src={item.poster} alt={item.title} loading="lazy" />
                    </div>
                    <div className="search-item-info">
                      <div className="search-item-title">{item.title}</div>
                      <div className="search-item-meta">
                        <span className="search-item-badge">
                          {item.type === 'movie' ? 'Movie' : 'Series'}
                        </span>
                        <span>{item.year}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
