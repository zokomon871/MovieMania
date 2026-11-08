'use client';

import React, { useState, useEffect } from 'react';
import { Play, Star, Sparkles } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface HeroBillboardProps {
  featuredChannels: IChannel[];
  onSelectChannel: (channel: IChannel) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const HERO_SLIDES = [
  {
    id: 'redbulltv.us',
    name: 'Red Bull TV HD',
    tagline: 'Extreme Action Sports, Live Global Events & Adventure Culture',
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
    id: 'filmrisefree.us',
    name: 'FilmRise Cinema',
    tagline: 'Non-Stop Free Feature Films, Blockbusters & Cult Classics',
    category: 'Movies & Cinema',
    country: 'US',
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/FilmRise_logo.svg/512px-FilmRise_logo.svg.png',
    quality: '720p HD',
    streamUrl: 'https://filmrise-free-movies-1-us.tubi.samsung.wurl.tv/playlist.m3u8',
  },
];

export function HeroBillboard({
  featuredChannels,
  onSelectChannel,
  isFavorite,
  onToggleFavorite,
}: HeroBillboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentIndex];

  const handleWatch = () => {
    const match = featuredChannels.find((c) => c.id === slide.id);
    if (match) {
      onSelectChannel(match);
    } else {
      onSelectChannel({
        id: slide.id,
        name: slide.name,
        country: slide.country,
        logo: slide.logo,
        categories: [slide.category],
        is_nsfw: false,
        streams: [{ channel: slide.id, url: slide.streamUrl, quality: slide.quality }],
      });
    }
  };

  return (
    <div className="hero-billboard" style={{ backgroundImage: `url(${slide.backdrop})` }}>
      <div className="hero-overlay" />
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} /> FEATURED BROADCAST • {slide.category}
          </div>

          <h1 className="hero-title">{slide.name}</h1>
          <p className="hero-tagline">{slide.tagline}</p>

          <div className="hero-actions">
            <button onClick={handleWatch} className="hero-btn-primary">
              <Play size={20} fill="currentColor" />
              <span>Watch Live Free</span>
            </button>

            <button
              onClick={(e) => onToggleFavorite(slide.id, e)}
              className={`hero-btn-secondary ${isFavorite ? 'active' : ''}`}
            >
              <Star size={18} fill={isFavorite ? 'var(--accent)' : 'transparent'} color={isFavorite ? 'var(--accent)' : 'currentColor'} />
              <span>{isFavorite ? 'Bookmarked' : 'Add Bookmark'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default HeroBillboard;

