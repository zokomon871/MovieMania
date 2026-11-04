'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IChannel } from '@/lib/types';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { usePlayerShortcuts } from '@/hooks/usePlayerShortcuts';
import { PlayerHeader } from './PlayerHeader';
import { PlayerControls, ObjectFit } from './PlayerControls';
import { PlayerCenterOverlay } from './PlayerCenterOverlay';
import { PlaylistDrawer } from './PlaylistDrawer';

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

const FIT_ORDER: ObjectFit[] = ['contain', 'cover', 'fill'];
const FIT_LABEL: Record<ObjectFit, string> = { contain: 'Fit', cover: 'Zoom', fill: 'Stretch' };

export function VideoPlayer({
  channel,
  onClose,
  isFavorite = false,
  onToggleFavorite = () => {},
  playlistChannels = [],
  onSelectChannel = () => {},
  onChannelOffline,
  onChannelOnline,
}: VideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const osdTimer = useRef<NodeJS.Timeout | null>(null);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [objectFit, setObjectFit] = useState<ObjectFit>('contain');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [osd, setOsd] = useState<string | null>(null);

  const stream = channel?.streams?.[0];
  const {
    videoRef, isPlaying, isBuffering, streamError, qualityLevels, currentQuality,
    activeLevel, usingProxy, isBehindLive, togglePlay, setQuality, goLive, retry,
  } = useHlsPlayer(stream, () => channel?.id && onChannelOffline?.(channel.id), () => channel?.id && onChannelOnline?.(channel.id));

  const flash = useCallback((msg: string) => {
    setOsd(msg);
    if (osdTimer.current) clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsd(null), 1200);
  }, []);

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const currentIndex = channel ? playlistChannels.findIndex((c) => c.id === channel.id) : -1;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < playlistChannels.length - 1;
  const goPrev = useCallback(() => { if (canPrev) onSelectChannel(playlistChannels[currentIndex - 1]); }, [canPrev, currentIndex, playlistChannels, onSelectChannel]);
  const goNext = useCallback(() => { if (canNext) onSelectChannel(playlistChannels[currentIndex + 1]); }, [canNext, currentIndex, playlistChannels, onSelectChannel]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) shellRef.current?.requestFullscreen().catch(console.error);
    else document.exitFullscreen().catch(console.error);
  }, []);

  const changeVolume = useCallback((v: number) => {
    const next = Math.min(1, Math.max(0, Math.round(v * 100) / 100));
    setVolume(next);
    setIsMuted(next === 0);
    flash(`Volume ${Math.round(next * 100)}%`);
  }, [flash]);

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

  const cycleFit = useCallback(() => {
    const next = FIT_ORDER[(FIT_ORDER.indexOf(objectFit) + 1) % FIT_ORDER.length];
    setObjectFit(next);
    flash(FIT_LABEL[next]);
  }, [flash, objectFit]);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (e) { console.error(e); }
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) { video.volume = volume; video.muted = isMuted; }
  }, [volume, isMuted, videoRef]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  usePlayerShortcuts({
    channel, showQualityMenu, isMuted, volume, togglePlay, toggleMute, toggleFullscreen,
    cycleFit, goLive, changeVolume, goNext, goPrev, onClose, pokeControls, setShowQualityMenu, setGuideOpen, flash,
  });

  if (!channel) return null;
  const activeLabel = qualityLevels.find((l) => l.index === activeLevel)?.label;
  const hideChrome = !controlsVisible && isPlaying && !showQualityMenu && !streamError;

  return (
    <div className="player-modal-backdrop" onClick={onClose}>
      <div ref={shellRef} className={`player-shell ${isFullscreen ? 'fullscreen' : ''} ${guideOpen && playlistChannels.length > 0 ? 'guide-open' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog">
        <div className={`player-stage ${hideChrome ? 'chrome-hidden' : ''}`} onMouseMove={pokeControls} onMouseLeave={() => isPlaying && setControlsVisible(false)} onTouchStart={pokeControls}>
          <video ref={videoRef} className="player-video" style={{ objectFit }} playsInline autoPlay onClick={() => { setShowQualityMenu(false); togglePlay(); }} onDoubleClick={toggleFullscreen} />
          <PlayerHeader channel={channel} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} onClose={onClose} qualityLabel={activeLabel} usingProxy={usingProxy} />
          <PlayerCenterOverlay streamError={streamError} isBuffering={isBuffering} isPlaying={isPlaying} usingProxy={usingProxy} canNext={canNext} onRetry={retry} onNext={goNext} onPlay={togglePlay} />
          {osd && <div className="player-osd">{osd}</div>}
          <PlayerControls
            isPlaying={isPlaying} isMuted={isMuted} volume={volume} isFullscreen={isFullscreen} objectFit={objectFit} fitLabel={FIT_LABEL[objectFit]}
            qualityLevels={qualityLevels} currentQuality={currentQuality} activeLabel={activeLabel} showQualityMenu={showQualityMenu} isBehindLive={isBehindLive}
            canPrev={canPrev} canNext={canNext} guideOpen={guideOpen} hasGuide={playlistChannels.length > 0} onPlayPause={togglePlay} onPrev={goPrev} onNext={goNext}
            onToggleMute={toggleMute} onVolumeChange={changeVolume} onToggleFullscreen={toggleFullscreen} onCycleFit={cycleFit}
            onToggleQualityMenu={() => setShowQualityMenu((s) => !s)} onSelectQuality={(idx) => { setQuality(idx); setShowQualityMenu(false); flash(idx === -1 ? 'Auto quality' : qualityLevels.find((l) => l.index === idx)?.label ?? ''); }}
            onGoLive={goLive} onTogglePip={togglePip} onToggleGuide={() => setGuideOpen((o) => !o)}
          />
        </div>
        {playlistChannels.length > 0 && guideOpen && (
          <PlaylistDrawer channels={playlistChannels} activeChannelId={channel.id} onSelect={onSelectChannel} onClose={() => setGuideOpen(false)} />
        )}
      </div>
    </div>
  );
}
export default VideoPlayer;
