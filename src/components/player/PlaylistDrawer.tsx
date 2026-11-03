import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tv, Search, X } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface PlaylistDrawerProps {
  channels: IChannel[];
  activeChannelId: string;
  onSelect: (channel: IChannel) => void;
  onClose?: () => void;
}

export function PlaylistDrawer({ channels, activeChannelId, onSelect, onClose }: PlaylistDrawerProps) {
  const [query, setQuery] = useState('');
  const activeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.categories?.some((cat) => cat.toLowerCase().includes(q))
    );
  }, [channels, query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeChannelId]);

  if (channels.length === 0) return null;

  return (
    <aside className="player-guide" aria-label="Channel guide">
      <div className="player-guide-head">
        <div className="player-guide-title">
          Channel guide <span className="count">{channels.length}</span>
        </div>
        {onClose && (
          <button className="player-ctrl-btn" onClick={onClose} aria-label="Hide guide">
            <X size={16} />
          </button>
        )}
      </div>

      <label className="player-guide-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (e.currentTarget.blur(), setQuery(''))}
          placeholder="Search channels"
        />
      </label>

      <div className="player-guide-list">
        {filtered.length === 0 && <div className="player-guide-empty">No channels match “{query}”</div>}
        {filtered.map((ch) => {
          const isActive = ch.id === activeChannelId;
          return (
            <button
              key={ch.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(ch)}
              className={`player-guide-item ${isActive ? 'active' : ''}`}
            >
              <span className="num">{String(channels.indexOf(ch) + 1).padStart(2, '0')}</span>
              <span className="logo">{ch.logo ? <img src={ch.logo} alt="" loading="lazy" /> : <Tv size={14} />}</span>
              <span className="text">
                <span className="name">{ch.name}</span>
                <span className="sub">
                  {[ch.categories?.[0], ch.country].filter(Boolean).join(' • ')}
                </span>
              </span>
              {isActive && (
                <span className="eq" aria-label="Now playing">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
