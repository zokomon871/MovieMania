'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { IChannel } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

export interface BillboardItem {
  id: string;
  type: 'movie' | 'series' | 'channel';
  title: string;
  overview: string;
  backdrop: string;
  poster?: string;
  rating?: number;
  year?: string;
  badge?: string;
  category?: string;
  streamUrl?: string;
  trailerKey?: string;
  maturity?: string;
}

const DEFAULT_SLIDES: BillboardItem[] = [
  {
    id: 'tt15239678', // Dune: Part Two
    type: 'movie',
    title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe.',
    backdrop: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    rating: 8.6,
    year: '2024',
    badge: '#1 IN MOVIES TODAY',
    category: 'Sci-Fi • Adventure',
    trailerKey: 'Way9Dexny3w',
    maturity: '16+',
  },
  {
    id: 'tt0903747', // Breaking Bad
    type: 'series',
    title: 'Breaking Bad',
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
    backdrop: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    rating: 9.5,
    year: '2008 - 2013',
    badge: 'ALL TIME TOP RATED',
    category: 'Crime • Drama • Thriller',
    trailerKey: 'HhesaQXLuRY',
    maturity: 'TV-MA',
  },
  {
    id: 'redbulltv.us',
    type: 'channel',
    title: 'Red Bull TV HD',
    overview: 'High adrenaline extreme sports, live events from around the world, bike downhill, cliff diving, and legendary motorsport championships.',
    backdrop: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1920&auto=format&fit=crop',
    rating: 9.1,
    year: 'LIVE',
    badge: 'FEATURED LIVE BROADCAST',
    category: 'Extreme Sports • 1080p',
    trailerKey: 'q6E21I04Zsc',
    maturity: '13+',
  },
];

interface Props {
  slides?: BillboardItem[];
  onOpenModal?: (item: BillboardItem) => void;
  onPlayChannel?: (channel: IChannel) => void;
}

export function NetflixBillboard({ slides = DEFAULT_SLIDES, onOpenModal, onPlayChannel }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  const current = slides[currentIndex] || DEFAULT_SLIDES[0];
  const inFavorites = isFavorite(current.id);
  const matchScore = Math.min(99, Math.round((current.rating || 8.5) * 10));

  // Delay background video preview playback by 1.2s on slide change
  useEffect(() => {
    setIsPlayingVideo(false);
    const videoTimer = setTimeout(() => {
      if (current.trailerKey) {
        setIsPlayingVideo(true);
      }
    }, 1200);

    return () => clearTimeout(videoTimer);
  }, [currentIndex, current.trailerKey]);

  // Auto rotate slide every 20 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 20000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  const handlePlay = (e: React.MouseEvent) => {
    if (current.type === 'channel' && onPlayChannel) {
      e.preventDefault();
      onPlayChannel({
        id: current.id,
        name: current.title,
        country: 'US',
        categories: [current.category || 'Sports'],
        is_nsfw: false,
        streams: [{ channel: current.id, url: current.streamUrl || 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' }],
      });
    }
  };

  const playHref =
    current.type === 'movie'
      ? `/movies/${current.id}`
      : current.type === 'series'
      ? `/series/${current.id}`
      : `/#live-directory`;

  // Build high-res YouTube embed background URL
  const youtubeEmbedUrl = current.trailerKey
    ? `https://www.youtube-nocookie.com/embed/${current.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${current.trailerKey}&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&showinfo=0`
    : null;

  return (
    <div
      className="netflix-billboard"
      style={{ backgroundImage: `url(${current.backdrop})` }}
    >
      {/* ─── Background Video Trailer Preview ─── */}
      {youtubeEmbedUrl && (
        <div className="netflix-billboard-video-wrap">
          <iframe
            key={`${current.trailerKey}-${isMuted}`}
            src={youtubeEmbedUrl}
            title={current.title}
            className="netflix-billboard-video"
            allow="autoplay; encrypted-media; picture-in-picture"
            style={{ opacity: isPlayingVideo ? 1 : 0 }}
          />
        </div>
      )}

      {/* Netflix Vignette Gradient Overlays */}
      <div className="netflix-billboard-vignette" />

      {/* Billboard Hero Content */}
      <div className="container" style={{ position: 'relative', zIndex: 3 }}>
        <div className="netflix-billboard-content">
          {current.badge && (
            <div className="netflix-billboard-badge">
              <Sparkles size={14} color="var(--accent)" />
              {current.badge}
            </div>
          )}

          <h1 className="netflix-billboard-title">{current.title}</h1>

          <div className="netflix-billboard-meta">
            <span className="netflix-match-score">{matchScore}% Match</span>
            <span>{current.year}</span>
            <span className="netflix-quality-badge">ULTRA HD 4K</span>
            <span className="netflix-quality-badge">5.1 AUDIO</span>
            {current.category && <span>• {current.category}</span>}
          </div>

          <p className="netflix-billboard-desc">{current.overview}</p>

          <div className="netflix-billboard-actions">
            <Link href={playHref} onClick={handlePlay} className="btn-netflix-play">
              <Play size={22} fill="#000" color="#000" />
              <span>{current.type === 'channel' ? 'Watch Live' : 'Play'}</span>
            </Link>

            <button
              type="button"
              onClick={() => onOpenModal && onOpenModal(current)}
              className="btn-netflix-info"
            >
              <Info size={22} />
              <span>More Info</span>
            </button>

            <button
              type="button"
              onClick={(e) =>
                toggleFavorite({
                  id: current.id,
                  type: current.type,
                  title: current.title,
                  backdrop: current.backdrop,
                  poster: current.poster,
                  rating: current.rating,
                  year: current.year,
                  category: current.category,
                }, e)
              }
              className="btn-netflix-info"
              style={{ padding: '11px 16px' }}
              title={inFavorites ? 'Remove from My List' : 'Add to My List'}
            >
              {inFavorites ? <Check size={20} color="var(--accent)" /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bottom-Right Controls (Sound Mute/Unmute & Maturity Tag) ─── */}
      <div className="netflix-billboard-bottom-right">
        {current.trailerKey && (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="netflix-sound-toggle-btn"
            title={isMuted ? 'Unmute Trailer Preview' : 'Mute Trailer Preview'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        <div className="netflix-maturity-pill">
          {current.maturity || '16+'}
        </div>
      </div>
    </div>
  );
}

export default NetflixBillboard;
