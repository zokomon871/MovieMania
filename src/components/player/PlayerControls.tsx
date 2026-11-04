import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
  Settings,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { IChannel } from '@/lib/types';
import { SettingsMenu, SettingsProps } from './SettingsMenu';

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  isBehindLive: boolean;
  prevChannel: IChannel | null;
  nextChannel: IChannel | null;
  hasGuide: boolean;
  guideOpen: boolean;
  menuOpen: boolean;
  settings: SettingsProps;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFullscreen: () => void;
  onToggleMenu: () => void;
  onGoLive: () => void;
  onToggleGuide: () => void;
}

export function PlayerControls(props: PlayerControlsProps) {
  const { isPlaying, isMuted, volume, isFullscreen, isBehindLive, prevChannel, nextChannel, hasGuide, guideOpen, menuOpen } = props;
  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="lp-controls" onPointerUp={(e) => e.stopPropagation()}>
      <div className="lp-controls-group">
        <button onClick={props.onPlayPause} className="lp-btn lp-btn-play" aria-label={isPlaying ? 'Pause' : 'Play'} data-tip={isPlaying ? 'Pause (K)' : 'Play (K)'}>
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>

        <div className="lp-volume">
          <button onClick={props.onToggleMute} className="lp-btn" aria-label={isMuted ? 'Unmute' : 'Mute'} data-tip={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
            <VolumeIcon size={20} />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            aria-label="Volume"
            className="lp-range"
            value={effectiveVolume}
            style={{ '--val': `${effectiveVolume * 100}%` } as React.CSSProperties}
            onChange={(e) => props.onVolumeChange(parseFloat(e.target.value))}
          />
        </div>

        <button
          onClick={props.onGoLive}
          className={`lp-live ${isBehindLive ? 'behind' : ''}`}
          data-tip={isBehindLive ? 'Jump to live (L)' : "You're watching live"}
        >
          <span className="dot" />
          {isBehindLive ? 'GO LIVE' : 'LIVE'}
        </button>
      </div>

      <div className="lp-controls-group">
        <div className="lp-zapper" role="group" aria-label="Change channel">
          <button
            onClick={props.onPrev}
            className="lp-btn"
            disabled={!prevChannel}
            aria-label={prevChannel ? `Previous channel: ${prevChannel.name}` : 'No previous channel'}
            data-tip={prevChannel ? `↑ ${prevChannel.name} (P)` : undefined}
          >
            <ChevronUp size={20} />
          </button>
          <span className="lp-zapper-label">CH</span>
          <button
            onClick={props.onNext}
            className="lp-btn"
            disabled={!nextChannel}
            aria-label={nextChannel ? `Next channel: ${nextChannel.name}` : 'No next channel'}
            data-tip={nextChannel ? `↓ ${nextChannel.name} (N)` : undefined}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        <div className="lp-menu-anchor">
          <button
            onClick={props.onToggleMenu}
            className={`lp-btn ${menuOpen ? 'on' : ''}`}
            aria-label="Settings"
            aria-expanded={menuOpen}
            data-tip={menuOpen ? undefined : 'Settings'}
          >
            <Settings size={19} className={menuOpen ? 'lp-rotate' : ''} />
          </button>
          {menuOpen && <SettingsMenu {...props.settings} />}
        </div>

        {hasGuide && (
          <button
            onClick={props.onToggleGuide}
            className={`lp-btn lp-hide-mobile ${guideOpen ? 'on' : ''}`}
            aria-label={guideOpen ? 'Hide channel list' : 'Show channel list'}
            data-tip={guideOpen ? 'Hide channels (G)' : 'Channels (G)'}
          >
            {guideOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}
          </button>
        )}

        <button
          onClick={props.onToggleFullscreen}
          className="lp-btn"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          data-tip={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
        </button>
      </div>
    </div>
  );
}
