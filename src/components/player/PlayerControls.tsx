import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  PictureInPicture2,
  ListVideo,
} from 'lucide-react';
import { AspectRatioToggle } from './AspectRatioToggle';
import { QualitySelector } from './QualitySelector';
import { QualityLevel } from '@/hooks/useHlsPlayer';

export type ObjectFit = 'contain' | 'cover' | 'fill';

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  objectFit: ObjectFit;
  fitLabel: string;
  qualityLevels: QualityLevel[];
  currentQuality: number;
  activeLabel?: string;
  showQualityMenu: boolean;
  isBehindLive: boolean;
  canPrev: boolean;
  canNext: boolean;
  guideOpen: boolean;
  hasGuide: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFullscreen: () => void;
  onCycleFit: () => void;
  onToggleQualityMenu: () => void;
  onSelectQuality: (idx: number) => void;
  onGoLive: () => void;
  onTogglePip: () => void;
  onToggleGuide: () => void;
}

export function PlayerControls(props: PlayerControlsProps) {
  // Checked after mount to avoid SSR hydration mismatch.
  const [pipSupported, setPipSupported] = useState(false);
  useEffect(() => setPipSupported(!!document.pictureInPictureEnabled), []);

  const {
    isPlaying,
    isMuted,
    volume,
    isFullscreen,
    objectFit,
    fitLabel,
    qualityLevels,
    currentQuality,
    activeLabel,
    showQualityMenu,
    isBehindLive,
    canPrev,
    canNext,
    guideOpen,
    hasGuide,
  } = props;

  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="player-controls" onClick={(e) => e.stopPropagation()}>
      <div className="player-controls-group">
        <button onClick={props.onPrev} className="player-ctrl-btn" disabled={!canPrev} data-tip="Previous (P)">
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button onClick={props.onPlayPause} className="player-ctrl-btn play" data-tip={isPlaying ? 'Pause (K)' : 'Play (K)'}>
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
        <button onClick={props.onNext} className="player-ctrl-btn" disabled={!canNext} data-tip="Next (N)">
          <SkipForward size={18} fill="currentColor" />
        </button>

        <div className="player-volume">
          <button onClick={props.onToggleMute} className="player-ctrl-btn" data-tip={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
            <VolumeIcon size={20} />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            aria-label="Volume"
            className="player-range"
            value={effectiveVolume}
            style={{ '--val': `${effectiveVolume * 100}%` } as React.CSSProperties}
            onChange={(e) => props.onVolumeChange(parseFloat(e.target.value))}
          />
        </div>

        <button
          onClick={props.onGoLive}
          className={`player-live-pill ${isBehindLive ? 'behind' : ''}`}
          data-tip={isBehindLive ? 'Jump to live (L)' : 'You are watching live'}
        >
          <span className="dot" />
          LIVE
        </button>
      </div>

      <div className="player-controls-group">
        <AspectRatioToggle fit={objectFit} label={fitLabel} onCycle={props.onCycleFit} />
        <QualitySelector
          levels={qualityLevels}
          currentLevel={currentQuality}
          activeLabel={activeLabel}
          isOpen={showQualityMenu}
          onToggle={props.onToggleQualityMenu}
          onSelect={props.onSelectQuality}
        />
        {pipSupported && (
          <button onClick={props.onTogglePip} className="player-ctrl-btn" data-tip="Picture in picture">
            <PictureInPicture2 size={18} />
          </button>
        )}
        {hasGuide && (
          <button
            onClick={props.onToggleGuide}
            className={`player-ctrl-btn ${guideOpen ? 'on' : ''}`}
            data-tip="Channel guide (G)"
          >
            <ListVideo size={19} />
          </button>
        )}
        <button onClick={props.onToggleFullscreen} className="player-ctrl-btn" data-tip={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
}
