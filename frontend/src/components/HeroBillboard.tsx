'use client';

import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Radio, Volume2, Sparkles, ShieldCheck } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface HeroBillboardProps {
  featuredChannels: IChannel[];
  onSelectChannel: (channel: IChannel) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const DEFAULT_HERO_SLIDES = [
  {
    id: 'redbulltv.us',
    name: 'Red Bull TV HD',
    tagline: 'Extreme Action Sports, Live Events & Adventure Culture',
    category: 'Sports & Action',
    country: 'US',
    backdrop: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1920&auto=format&fit=crop',
    logo: 'https://images.redbull.tv/image/upload/b_black/q_auto/f_auto/v1/redbullcom/2020/04/16/e0mms9w4h8vjkyh2n2v0',
    quality: '1080p FHD',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  },
  {
    id: 'skynews.uk',
    name: 'Sky News UK Live',
    tagline: 'First For Breaking Global News & High Impact Journalism',
    category: 'Breaking News',
    country: 'GB',
    backdrop: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1920&auto=format&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/00/Sky_News_logo_2018.svg/512px-Sky_News_logo_2018.svg.png',
    quality: '1080p FHD',
    streamUrl: 'https://skynews-live.akamaized.net/hls/live/2014761/skynews/master.m3u8',
  },
  {
    id: 'nasatv.us',
    name: 'NASA TV Space Broadcast',
    tagline: 'Live Rocket Launches, ISS Spacewalks & Deep Space Exploration',
    category: 'Science & Cosmos',
    country: 'US',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
    quality: '1080p FHD',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
  },
  {
    id: 'filmrisefree.us',
    name: 'FilmRise Cinema',
    tagline: 'Non-Stop Free Feature Films, Hollywood Blockbusters & Cult Classics',
    category: 'Movies & Cinema',
    country: 'US',
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/FilmRise_logo.svg/512px-FilmRise_logo.svg.png',
    quality: '720p HD',
    streamUrl: 'https://filmrise-free-movies-1-us.tubi.samsung.wurl.tv/playlist.m3u8',
  },
];

export default function HeroBillboard({
  featuredChannels,
  onSelectChannel,
  isFavorite,
  onToggleFavorite,
}: HeroBillboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate hero slide every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEFAULT_HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = DEFAULT_HERO_SLIDES[currentIndex];

  const handleWatchNow = () => {
    // Check if channel exists in DB channels or construct channel object
    const match = featuredChannels.find((c) => c.id === currentSlide.id);
    if (match) {
      onSelectChannel(match);
    } else {
      onSelectChannel({
        id: currentSlide.id,
        name: currentSlide.name,
        country: currentSlide.country,
        logo: currentSlide.logo,
        categories: [currentSlide.category],
        is_nsfw: false,
        streams: [
          {
            channel: currentSlide.id,
            url: currentSlide.streamUrl,
            quality: currentSlide.quality,
          },
        ],
      });
    }
  };

  return (
    <div className="hero-billboard">
      {/* Background Image Container */}
      <div className="hero-backdrop-container">
        <img
          key={currentSlide.backdrop}
          src={currentSlide.backdrop}
          alt={currentSlide.name}
          className="hero-backdrop-img"
        />
        <div className="hero-vignette-bottom" />
        <div className="hero-vignette-left" />
      </div>

      {/* Content Overlay */}
      <div className="hero-content">
        {/* Badges Row */}
        <div className="hero-badges-row">
          <span className="badge badge-live">
            <span className="pulse-dot" /> LIVE 24/7
          </span>
          <span className="badge badge-quality">
            {currentSlide.quality}
          </span>
          <span className="badge badge-category">
            {currentSlide.category}
          </span>
          <span className="badge badge-flag">
            🏳️ {currentSlide.country}
          </span>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <ShieldCheck size={12} /> AD-FREE
          </span>
        </div>

        {/* Title */}
        <h1 className="hero-title">{currentSlide.name}</h1>

        {/* Tagline */}
        <p className="hero-description">{currentSlide.tagline}</p>

        {/* Call to Actions */}
        <div className="hero-actions">
          <button onClick={handleWatchNow} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
            <Play size={20} fill="#fff" />
            <span>Watch Live Now</span>
          </button>

          <button
            onClick={(e) => onToggleFavorite(currentSlide.id, e)}
            className={`btn btn-secondary ${isFavorite ? 'active' : ''}`}
            style={{ padding: '12px 20px' }}
          >
            <Star size={18} fill={isFavorite ? 'var(--accent-gold)' : 'transparent'} color={isFavorite ? 'var(--accent-gold)' : '#fff'} />
            <span>{isFavorite ? 'Saved to Watchlist' : 'Add to Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-indicators">
        {DEFAULT_HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setCurrentIndex(idx)}
            className={`hero-dot ${currentIndex === idx ? 'active' : ''}`}
            title={slide.name}
          />
        ))}
      </div>
    </div>
  );
}
