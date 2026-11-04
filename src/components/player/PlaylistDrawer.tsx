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

  const numbered = useMemo(() => channels.map((ch, i) => ({ ch, num: i + 1 })), [channels]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return numbered;
    return numbered.filter(
      ({ ch }) => ch.name.toLowerCase().includes(q) || ch.categories?.some((cat) => cat.toLowerCase().includes(q))
    );
  }, [numbered, query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeChannelId]);

  if (channels.length === 0) return null;

  return (
    <aside className="lp-guide" aria-label="Channel list">
      <div className="lp-guide-head">
        <div className="lp-guide-title">
          Channels <span className="count">{channels.length}</span>
        </div>
        {onClose && (
          <button className="lp-btn sm lp-hide-mobile" onClick={onClose} aria-label="Hide channel list">
            <X size={16} />
          </button>
        )}
      </div>

      <label className="lp-guide-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setQuery('');
              e.currentTarget.blur();
            }
          }}
          placeholder="Find a channel"
          aria-label="Find a channel"
        />
        {query && (
          <button className="lp-guide-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </label>

      <div className="lp-guide-list">
        {filtered.length === 0 && <div className="lp-guide-empty">No channels match “{query}”</div>}
        {filtered.map(({ ch, num }) => {
          const isActive = ch.id === activeChannelId;
          return (
            <button
              key={ch.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(ch)}
              className={`lp-guide-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="num">{String(num).padStart(2, '0')}</span>
              <span className="logo">{ch.logo ? <img src={ch.logo} alt="" loading="lazy" /> : <Tv size={15} />}</span>
              <span className="text">
                <span className="name">{ch.name}</span>
                <span className="sub">
                  {isActive ? 'Now playing' : [ch.categories?.[0], ch.country].filter(Boolean).join(' · ')}
                </span>
              </span>
              {isActive && (
                <span className="eq" aria-hidden>
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
