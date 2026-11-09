'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IChannel } from '@/lib/types';
import { useLiveStream } from '@/hooks/useLiveStream';
import { usePlayerShortcuts } from '@/hooks/usePlayerShortcuts';
import { PlayerHeader } from './PlayerHeader';
import { PlayerControls } from './PlayerControls';
import { PlayerCenterOverlay } from './PlayerCenterOverlay';
import { PlaylistDrawer } from './PlaylistDrawer';
import { ObjectFit, FIT_LABEL, FIT_ORDER } from './SettingsMenu';
import { enterFullscreenLandscape, exitFullscreenPortrait, isCurrentlyFullscreen } from '@/lib/fullscreenHelper';

interface VideoPlayerProps {
  channel: IChannel | null;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  playlistChannels?: IChannel[];
  onSelectChannel?: (channel: IChannel) => void;
  onChannelOffline?: (id: string) => void;
  onChannelOnline?: (id: string) => void;
}

const PREFS_KEY = 'moviemania_live_player';

function readPrefs(): { volume?: number; muted?: boolean; guide?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}
function writePrefs(patch: Record<string, unknown>) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {}
}

/** Mounts the live player only while a channel is selected, so every ref exists on mount. */
export function VideoPlayer(props: VideoPlayerProps) {
  if (!props.channel) return null;
  return <LivePlayer {...props} channel={props.channel} />;
}

function LivePlayer({
  channel,
  onClose,
  isFavorite = false,
  onToggleFavorite = () => {},
  playlistChannels = [],
  onSelectChannel = () => {},
  onChannelOffline,
  onChannelOnline,
}: VideoPlayerProps & { channel: IChannel }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const osdTimer = useRef<NodeJS.Timeout | null>(null);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [objectFit, setObjectFit] = useState<ObjectFit>('contain');
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [osd, setOsd] = useState<string | null>(null);

  // Restore the viewer's volume and guide preference.
  useEffect(() => {
    const p = readPrefs();
    if (typeof p.volume === 'number') setVolume(p.volume);
    if (typeof p.muted === 'boolean') setIsMuted(p.muted);
    if (typeof p.guide === 'boolean') setGuideOpen(p.guide);
    else setGuideOpen(window.innerWidth > 900);
  }, []);
  useEffect(() => writePrefs({ volume, muted: isMuted }), [volume, isMuted]);
  useEffect(() => writePrefs({ guide: guideOpen }), [guideOpen]);

  // Lock page scroll while the player owns the screen.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const engine = useLiveStream(
    channel.streams,
    () => onChannelOffline?.(channel.id),
    () => onChannelOnline?.(channel.id)
  );
  const { videoRef, isPlaying, error, qualityLevels, currentQuality, activeLevel, togglePlay, setQuality, goLive } = engine;

  const flash = useCallback((msg: string) => {
    setOsd(msg);
    if (osdTimer.current) clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsd(null), 1200);
  }, []);

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setControlsVisible(false), 3200);
  }, []);

  // Show the channel banner whenever the viewer zaps to a new channel.
  useEffect(() => {
    pokeControls();
    setMenuOpen(false);
  }, [channel.id, pokeControls]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (osdTimer.current) clearTimeout(osdTimer.current);
    },
    []
  );

  const currentIndex = playlistChannels.findIndex((c) => c.id === channel.id);
  const prevChannel = currentIndex > 0 ? playlistChannels[currentIndex - 1] : null;
  const nextChannel = currentIndex >= 0 && currentIndex < playlistChannels.length - 1 ? playlistChannels[currentIndex + 1] : null;
  const goPrev = useCallback(() => prevChannel && onSelectChannel(prevChannel), [prevChannel, onSelectChannel]);
  const goNext = useCallback(() => nextChannel && onSelectChannel(nextChannel), [nextChannel, onSelectChannel]);

  const toggleFullscreen = useCallback(async () => {
    if (!isCurrentlyFullscreen()) {
      await enterFullscreenLandscape(rootRef.current);
    } else {
      await exitFullscreenPortrait();
    }
  }, []);

  const changeVolume = useCallback(
    (v: number) => {
      const next = Math.min(1, Math.max(0, Math.round(v * 100) / 100));
      setVolume(next);
      setIsMuted(next === 0);
      flash(`Volume ${Math.round(next * 100)}%`);
    },
    [flash]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restored = volume === 0 ? 0.5 : volume;
      setVolume(restored);
      setIsMuted(false);
      flash(`Volume ${Math.round(restored * 100)}%`);
    } else {
      setIsMuted(true);
      flash('Muted');
    }
  }, [flash, isMuted, volume]);

  const setFit = useCallback(
    (fit: ObjectFit) => {
      setObjectFit(fit);
      flash(FIT_LABEL[fit]);
    },
    [flash]
  );
  const cycleFit = useCallback(() => setFit(FIT_ORDER[(FIT_ORDER.indexOf(objectFit) + 1) % FIT_ORDER.length]), [objectFit, setFit]);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted, videoRef]);

  useEffect(() => {
    const onChange = () => {
      const fs = isCurrentlyFullscreen();
      setIsFullscreen(fs);
      if (!fs) {
        try { window.screen?.orientation?.unlock?.(); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  usePlayerShortcuts({
    menuOpen, isMuted, volume, togglePlay, toggleMute, toggleFullscreen, cycleFit,
    goLive, changeVolume, goNext, goPrev, onClose, pokeControls, setMenuOpen, setGuideOpen, flash,
  });

  // Mouse: click = play/pause (like every desktop player). Touch: tap = show/hide controls.
  const onStagePointerUp = (e: React.PointerEvent) => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (e.pointerType === 'mouse') {
      togglePlay();
      pokeControls();
    } else if (controlsVisible) {
      setControlsVisible(false);
    } else {
      pokeControls();
    }
  };

  const activeLabel = qualityLevels.find((l) => l.index === activeLevel)?.label;
  const hasGuide = playlistChannels.length > 0;
  const hideChrome = !controlsVisible && isPlaying && !menuOpen && !error;

  return (
    <div
      ref={rootRef}
      className={`lp-root ${hasGuide && guideOpen ? 'guide-open' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Watching ${channel.name}`}
    >
      <div
        className={`lp-stage ${hideChrome ? 'chrome-hidden' : ''}`}
        onMouseMove={pokeControls}
        onMouseLeave={() => isPlaying && !menuOpen && setControlsVisible(false)}
      >
        <video
          ref={videoRef}
          className="lp-video"
          style={{ objectFit }}
          playsInline
          autoPlay
          onPointerUp={onStagePointerUp}
          onDoubleClick={toggleFullscreen}
        />

        <PlayerCenterOverlay
          channel={channel}
          engine={engine}
          nextChannel={nextChannel}
          onNext={goNext}
        />

        {osd && <div className="lp-osd" role="status">{osd}</div>}

        <PlayerHeader
          channel={channel}
          position={currentIndex >= 0 ? { index: currentIndex + 1, total: playlistChannels.length } : null}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onClose={onClose}
          qualityLabel={activeLabel}
          usingRelay={engine.usingRelay}
          sourceLabel={engine.sourceCount > 1 && engine.currentSource > 0 ? `Backup ${engine.currentSource + 1}` : undefined}
        />

        <PlayerControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          isFullscreen={isFullscreen}
          isBehindLive={engine.isBehindLive}
          prevChannel={prevChannel}
          nextChannel={nextChannel}
          hasGuide={hasGuide}
          guideOpen={guideOpen}
          menuOpen={menuOpen}
          settings={{
            qualityLevels,
            currentQuality,
            activeLabel,
            objectFit,
            sourceCount: engine.sourceCount,
            currentSource: engine.currentSource,
            onSelectQuality: (idx) => {
              setQuality(idx);
              flash(idx === -1 ? 'Auto quality' : qualityLevels.find((l) => l.index === idx)?.label ?? '');
            },
            onSelectFit: setFit,
            onSelectSource: (i) => {
              engine.selectSource(i);
              flash(`Source ${i + 1}`);
            },
            onTogglePip: togglePip,
            onClose: () => setMenuOpen(false),
          }}
          onPlayPause={togglePlay}
          onPrev={goPrev}
          onNext={goNext}
          onToggleMute={toggleMute}
          onVolumeChange={changeVolume}
          onToggleFullscreen={toggleFullscreen}
          onToggleMenu={() => setMenuOpen((o) => !o)}
          onGoLive={goLive}
          onToggleGuide={() => setGuideOpen((o) => !o)}
        />
      </div>

      {hasGuide && guideOpen && (
        <PlaylistDrawer
          channels={playlistChannels}
          activeChannelId={channel.id}
          onSelect={onSelectChannel}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </div>
  );
}

export default VideoPlayer;
