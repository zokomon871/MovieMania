import React from 'react';
import { ArrowLeft, Star, Tv } from 'lucide-react';
import { IChannel } from '@/lib/types';

interface PlayerHeaderProps {
  channel: IChannel;
  position: { index: number; total: number } | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClose?: () => void;
  qualityLabel?: string;
  usingRelay?: boolean;
  sourceLabel?: string;
}

export function PlayerHeader({ channel, position, isFavorite, onToggleFavorite, onClose, qualityLabel, usingRelay, sourceLabel }: PlayerHeaderProps) {
  const meta = [channel.categories?.[0], channel.country, channel.languages?.[0]?.toUpperCase()].filter(Boolean) as string[];

  return (
    <div className="lp-header" onPointerUp={(e) => e.stopPropagation()}>
      {onClose && (
        <button onClick={onClose} className="lp-back" aria-label="Back to channels">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      )}

      <div className="lp-now">
        <div className="lp-now-logo">{channel.logo ? <img src={channel.logo} alt="" /> : <Tv size={20} />}</div>
        <div className="lp-now-text">
          <div className="lp-now-title-row">
            {position && <span className="lp-now-num">{String(position.index).padStart(2, '0')}</span>}
            <h2 className="lp-now-title">{channel.name}</h2>
          </div>
          <div className="lp-now-meta">
            {meta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">·</span>}
                <span className="cap">{m}</span>
              </React.Fragment>
            ))}
            {qualityLabel && <span className="lp-chip">{qualityLabel}</span>}
            {sourceLabel && <span className="lp-chip ghost">{sourceLabel}</span>}
            {usingRelay && (
              <span className="lp-chip ghost" title="Streaming through MovieMania's relay because the feed blocks direct browser playback">
                Relay
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => onToggleFavorite(channel.id, e)}
        className={`lp-fav ${isFavorite ? 'active' : ''}`}
        aria-pressed={isFavorite}
      >
        <Star size={17} fill={isFavorite ? 'currentColor' : 'transparent'} />
        <span>{isFavorite ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  );
}
