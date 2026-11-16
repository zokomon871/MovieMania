'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Play, Check, Trash2, Film, Tv, Layers, AlertCircle } from 'lucide-react';
import { useFavorites, IFavoriteItem } from '@/hooks/useFavorites';
import { useOfflineChannels } from '@/hooks/useOfflineChannels';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { MediaModal } from '@/components/common/MediaModal';
import { IChannel } from '@/lib/types';
import { getImageUrl, formatRating } from '@/lib/mediaUtils';

export default function FavoritesPage() {
  const { favoriteItems, toggleFavorite, isLoaded } = useFavorites();
  const { offlineChannels, markOffline, markOnline } = useOfflineChannels();
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'series' | 'channel'>('all');
  const [selectedChannel, setSelectedChannel] = useState<IChannel | null>(null);
  const [modalItem, setModalItem] = useState<any | null>(null);

  const movies = favoriteItems.filter((i) => i.type === 'movie');
  const series = favoriteItems.filter((i) => i.type === 'series');
  const channels = favoriteItems.filter((i) => i.type === 'channel');

  const displayedItems =
    activeTab === 'all'
      ? favoriteItems
      : activeTab === 'movie'
      ? movies
      : activeTab === 'series'
      ? series
      : channels;

  const handlePlayChannel = (item: IFavoriteItem) => {
    setSelectedChannel({
      id: item.id,
      name: item.title,
      country: 'Global',
      categories: [item.category || 'General'],
      is_nsfw: false,
      logo: item.poster || undefined,
      streams: [{ channel: item.id, url: `https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8` }],
    });
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '100px', paddingTop: '32px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={26} color="var(--accent)" fill="var(--accent)" />
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', margin: 0 }}>
                My List
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.92rem' }}>
              Your saved movies, binge-worthy series, and favorite live television broadcasts.
            </p>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <strong>{favoriteItems.length}</strong> title{favoriteItems.length !== 1 ? 's' : ''} saved
          </div>
        </div>

        {/* Tab Filters */}
        <div className="netflix-tabs-bar">
          <button
            onClick={() => setActiveTab('all')}
            className={`netflix-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Titles ({favoriteItems.length})
          </button>
          <button
            onClick={() => setActiveTab('movie')}
            className={`netflix-tab-btn ${activeTab === 'movie' ? 'active' : ''}`}
          >
            <Film size={16} /> Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`netflix-tab-btn ${activeTab === 'series' ? 'active' : ''}`}
          >
            <Layers size={16} /> TV Shows ({series.length})
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`netflix-tab-btn ${activeTab === 'channel' ? 'active' : ''}`}
          >
            <Tv size={16} /> Live TV ({channels.length})
          </button>
        </div>

        {/* Empty State */}
        {isLoaded && displayedItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <Star size={44} color="var(--accent)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Your list is empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
              Explore our trending movies, popular series, or global live broadcasts and click the &quot;+ My List&quot; button to keep track of what you want to watch.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/movies" className="btn-netflix-play">
                Browse Movies
              </Link>
              <Link href="/series" className="btn-netflix-info">
                Browse TV Shows
              </Link>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '20px',
            }}
          >
            {displayedItems.map((item) => {
              const poster = getImageUrl(item.poster || item.backdrop || null);
              const isChannel = item.type === 'channel';
              const targetHref = isChannel
                ? '#'
                : item.type === 'movie'
                ? `/movies/${item.id}`
                : `/series/${item.id}`;

              return (
                <div key={item.id} className="netflix-card" style={{ width: '100%', flex: 'none' }}>
                  <Link
                    href={targetHref}
                    onClick={(e) => {
                      if (isChannel) {
                        e.preventDefault();
                        handlePlayChannel(item);
                      }
                    }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="netflix-card-poster">
                      <img src={poster} alt={item.title} loading="lazy" />

                      <div className={`netflix-card-badge ${isChannel ? 'live' : ''}`}>
                        {isChannel ? 'LIVE' : item.type === 'series' ? 'SERIES' : 'MOVIE'}
                      </div>

                      <div className="movie-card-overlay">
                        <div className="movie-play-btn">
                          <Play size={20} fill="#fff" />
                        </div>
                      </div>
                    </div>

                    <div className="netflix-card-info">
                      <h4 className="netflix-card-title">{item.title}</h4>
                      <div className="netflix-card-meta">
                        <span>{item.year || (isChannel ? 'Broadcast' : '')}</span>
                        {item.rating ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#46d369', fontWeight: 700 }}>
                            <Star size={11} fill="#46d369" /> {formatRating(item.rating)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(item, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      zIndex: 6,
                    }}
                    title="Remove from My List"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MediaModal
        item={modalItem}
        type={modalItem?.type || 'movie'}
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
      />

      <VideoPlayer
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        isFavorite={selectedChannel ? true : false}
        onToggleFavorite={toggleFavorite}
        playlistChannels={[]}
        onSelectChannel={setSelectedChannel}
        onChannelOffline={markOffline}
        onChannelOnline={markOnline}
      />
    </main>
  );
}
