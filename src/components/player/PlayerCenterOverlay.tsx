import React from 'react';
import { AlertCircle, Play, RefreshCw, SkipForward } from 'lucide-react';

interface OverlayProps {
  streamError: string | null;
  isBuffering: boolean;
  isPlaying: boolean;
  usingProxy: boolean;
  canNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onPlay: () => void;
}

export function PlayerCenterOverlay({
  streamError,
  isBuffering,
  isPlaying,
  usingProxy,
  canNext,
  onRetry,
  onNext,
  onPlay,
}: OverlayProps) {
  if (streamError) {
    return (
      <div className="player-center-overlay solid">
        <div className="player-error-card">
          <div className="player-error-icon">
            <AlertCircle size={28} />
          </div>
          <div className="player-error-title">Channel unavailable</div>
          <div className="player-error-text">{streamError}</div>
          <div className="player-error-actions">
            <button className="player-pill-btn primary" onClick={onRetry}>
              <RefreshCw size={15} /> Retry
            </button>
            {canNext && (
              <button className="player-pill-btn" onClick={onNext}>
                <SkipForward size={15} /> Next channel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isBuffering) {
    return (
      <div className="player-center-overlay">
        <div className="player-spinner" />
        <div className="player-center-caption">
          {usingProxy ? 'Connecting through relay…' : 'Tuning in…'}
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <button className="player-big-play" onClick={onPlay} aria-label="Play">
        <Play size={34} fill="currentColor" />
      </button>
    );
  }

  return null;
}

