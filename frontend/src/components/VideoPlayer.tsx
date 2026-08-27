'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  RefreshCw,
  AlertCircle,
  Settings,
  Star,
  X,
  ListVideo,
  Radio,
  ExternalLink,
  Crop,
} from 'lucide-react';
import { IChannel, IStream } from '@/lib/types';

interface VideoPlayerProps {
  channel: IChannel | null;
  onClose?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  playlistChannels?: IChannel[];
  onSelectChannel?: (channel: IChannel) => void;
  offlineChannels?: string[];
  onChannelOffline?: (id: string) => void;
  onChannelOnline?: (id: string) => void;
}

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export default function VideoPlayer({
  channel,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  playlistChannels = [],
  onSelectChannel,
  offlineChannels = [],
  onChannelOffline,
  onChannelOnline,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentStreamIndex, setCurrentStreamIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [usingProxy, setUsingProxy] = useState<boolean>(false);
  const [objectFit, setObjectFit] = useState<'contain' | 'cover' | 'fill'>('contain');

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playbackWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  const streams = channel?.streams || [];
  const currentStream: IStream | undefined = streams[currentStreamIndex] || streams[0];

  // Reset states on channel change
  useEffect(() => {
    setCurrentStreamIndex(0);
    setStreamError(null);
    setIsBuffering(true);
    setUsingProxy(false);
  }, [channel?.id]);

  // Load Stream Function with strict Playback Detection Watchdog
  const loadStream = useCallback((streamUrl: string, forceProxy: boolean = false) => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setStreamError(null);
    setIsBuffering(true);
    setQualityLevels([]);
    setCurrentQuality(-1);

    if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const effectiveUrl = forceProxy
      ? `/api/proxy?url=${encodeURIComponent(streamUrl)}`
      : streamUrl;

    // Strict Playback Watchdog: Must render real audio/video within 6.5s
    playbackWatchdogRef.current = setTimeout(() => {
      if (video && (video.paused || video.currentTime === 0 || video.readyState < 2)) {
        if (!forceProxy) {
          console.warn('[Watchdog] Direct feed produced no video frames. Retrying via proxy...');
          setUsingProxy(true);
          loadStream(streamUrl, true);
        } else if (streams.length > 1 && currentStreamIndex < streams.length - 1) {
          console.warn('[Watchdog] Feed stream empty or dead. Auto-switching to next feed...');
          setCurrentStreamIndex((prev) => prev + 1);
        } else {
          setStreamError('Broadcaster server is sending empty or silent stream packets. This channel feed is temporarily offline at source.');
          setIsBuffering(false);
          if (channel?.id) onChannelOffline?.(channel.id);
        }
      }
    }, 6500);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 5000,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 5000,
        fragLoadingTimeOut: 6000,
      });

      hlsRef.current = hls;
      hls.loadSource(effectiveUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels: QualityLevel[] = data.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          bitrate: lvl.bitrate,
          label: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
        }));
        setQualityLevels(levels);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        // Real video fragments arrived
        if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
        setIsBuffering(false);
        if (channel?.id) onChannelOnline?.(channel.id);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (!forceProxy) {
                console.warn('[HLS] Network error on direct feed. Retrying via CORS Proxy...');
                setUsingProxy(true);
                hls.destroy();
                loadStream(streamUrl, true);
              } else if (streams.length > 1 && currentStreamIndex < streams.length - 1) {
                console.warn('[HLS] Feed unreachable. Auto-switching to next available feed...');
                hls.destroy();
                setCurrentStreamIndex((prev) => prev + 1);
              } else {
                setStreamError('Broadcaster server is offline or returned HTTP 502/504 error.');
                setIsBuffering(false);
                if (channel?.id) onChannelOffline?.(channel.id);
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamError('Media codec format error on this feed. Attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              if (streams.length > 1 && currentStreamIndex < streams.length - 1) {
                hls.destroy();
                setCurrentStreamIndex((prev) => prev + 1);
              } else {
                setStreamError('Broadcast feed is currently unreachable at source.');
                setIsBuffering(false);
                if (channel?.id) onChannelOffline?.(channel.id);
                hls.destroy();
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = effectiveUrl;
      video.addEventListener('playing', () => {
        if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
        setIsBuffering(false);
        if (channel?.id) onChannelOnline?.(channel.id);
      });
      video.addEventListener('error', () => {
        if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
        if (!forceProxy) {
          setUsingProxy(true);
          loadStream(streamUrl, true);
        } else if (streams.length > 1 && currentStreamIndex < streams.length - 1) {
          setCurrentStreamIndex((prev) => prev + 1);
        } else {
          setStreamError('Broadcast stream failed to load.');
          setIsBuffering(false);
          if (channel?.id) onChannelOffline?.(channel.id);
        }
      });
    } else {
      setStreamError('Your browser does not support HLS live streaming.');
      setIsBuffering(false);
      if (channel?.id) onChannelOffline?.(channel.id);
    }
  }, [currentStreamIndex, streams.length, channel?.id, onChannelOffline, onChannelOnline]);

  useEffect(() => {
    if (currentStream?.url) {
      loadStream(currentStream.url, false);
    }
    return () => {
      if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream?.url, loadStream]);

  // Video Controls Handlers
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleToggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const handleSelectQuality = (lvlIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlIndex;
      setCurrentQuality(lvlIndex);
    }
    setShowSettings(false);
  };

  const handleToggleFit = () => {
    setObjectFit((prev) => {
      if (prev === 'contain') return 'cover';
      if (prev === 'cover') return 'fill';
      return 'contain';
    });
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, 3500);
  };

  if (!channel) return null;

  return (
    <div className={`cinema-player-wrapper ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef} onMouseMove={handleUserActivity}>
      <div className="player-halo-glow" />

      {/* Main Player Grid Layout */}
      <div className="player-layout">
        {/* Left: Video Stage */}
        <div className="player-video-stage" style={{ cursor: showControls ? 'default' : 'none' }}>
          <video
            ref={videoRef}
            className="player-video-element"
            style={{ objectFit }}
            playsInline
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              if (playbackWatchdogRef.current) clearTimeout(playbackWatchdogRef.current);
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onClick={handlePlayPause}
          />

          {/* Buffering Spinner */}
          {isBuffering && !streamError && (
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 5 }}>
              <div className="pulse-dot" style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {usingProxy ? 'Routing via Secure Stream Proxy...' : 'Connecting to Live Broadcast...'}
              </span>
            </div>
          )}

          {/* Stream Error / Offline Overlay */}
          {streamError && (
            <div className="glass-panel" style={{ position: 'absolute', inset: 0, background: 'rgba(7, 7, 9, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', zIndex: 6, borderRadius: '0' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
                <AlertCircle size={40} color="var(--accent-red)" />
              </div>
              <h4 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Stream Currently Offline</h4>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                The broadcast feed for <strong>{channel.name}</strong> is currently unavailable or experiencing technical difficulties.
                <br /><br />
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Error detail: {streamError}</span>
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => currentStream?.url && loadStream(currentStream.url, true)}
                  className="btn btn-primary"
                >
                  <RefreshCw size={15} /> Retry Connection
                </button>
                {streams.length > 1 && (
                  <button
                    onClick={() => setCurrentStreamIndex((prev) => (prev + 1) % streams.length)}
                    className="btn btn-secondary"
                  >
                    Try Alternative Feed
                  </button>
                )}
                {playlistChannels.length > 1 && (
                  <button
                    onClick={() => {
                      const nextCh = playlistChannels.find((c) => c.id !== channel.id && !offlineChannels.includes(c.id));
                      if (nextCh && onSelectChannel) onSelectChannel(nextCh);
                    }}
                    className="btn btn-ghost"
                  >
                    Watch Something Else
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Controls HUD Overlay */}
          <div className={`player-hud-overlay ${showControls ? 'visible' : ''}`}>
            {/* Top HUD Bar */}
            <div className="player-hud-top">
              <div className="player-channel-info">
                {channel.logo && (
                  <img src={channel.logo} alt={channel.name} className="player-channel-logo" />
                )}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                    {channel.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                    {channel.country && <span>🏳️ {channel.country}</span>}
                    {channel.categories && channel.categories[0] && <span>• {channel.categories[0]}</span>}
                    {streamError || offlineChannels.includes(channel.id) ? (
                      <span className="badge badge-offline" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        <span className="pulse-dot-red" /> NOT WORKING
                      </span>
                    ) : usingProxy ? (
                      <span className="badge" style={{ background: 'rgba(0,229,255,0.15)', color: '#38bdf8', fontSize: '0.68rem', padding: '1px 6px' }}>
                        PROXY ON
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => onToggleFavorite(channel.id, e)}
                    className="player-icon-btn"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={19} fill={isFavorite ? 'var(--accent-gold)' : 'transparent'} color={isFavorite ? 'var(--accent-gold)' : '#fff'} />
                  </button>
                )}

                <button
                  onClick={() => setShowDrawer(!showDrawer)}
                  className="player-icon-btn"
                  title="Toggle Channel Playlist Drawer"
                >
                  <ListVideo size={20} color={showDrawer ? 'var(--accent-red)' : '#fff'} />
                </button>

                {onClose && (
                  <button onClick={onClose} className="player-icon-btn" title="Close player">
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="player-hud-bottom">
              {/* Controls Left */}
              <div className="player-hud-controls-left">
                <button onClick={handlePlayPause} className="player-icon-btn" title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
                </button>

                {/* Live Badge */}
                <span className="badge badge-live">
                  <span className="pulse-dot" /> LIVE
                </span>

                {/* Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={handleToggleMute} className="player-icon-btn">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    style={{ width: '75px', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Controls Right */}
              <div className="player-hud-controls-right">
                {/* Multi-feed switcher */}
                {streams.length > 1 && (
                  <button
                    onClick={() => setCurrentStreamIndex((prev) => (prev + 1) % streams.length)}
                    className="btn btn-ghost"
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    title="Switch Stream Server"
                  >
                    Feed {currentStreamIndex + 1}/{streams.length}
                  </button>
                )}

                {/* Quality Settings */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="player-icon-btn"
                    title="Quality / Stream Settings"
                  >
                    <Settings size={19} />
                  </button>

                  {showSettings && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        bottom: '48px',
                        right: 0,
                        padding: '12px',
                        minWidth: '160px',
                        zIndex: 20,
                        border: '1px solid var(--border-medium)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Stream Quality
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          onClick={() => handleSelectQuality(-1)}
                          className={`nav-link-btn ${currentQuality === -1 ? 'active' : ''}`}
                          style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'space-between' }}
                        >
                          <span>Auto (Adaptive)</span>
                          {currentQuality === -1 && <span>✓</span>}
                        </button>
                        {qualityLevels.map((lvl) => (
                          <button
                            key={lvl.index}
                            onClick={() => handleSelectQuality(lvl.index)}
                            className={`nav-link-btn ${currentQuality === lvl.index ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'space-between' }}
                          >
                            <span>{lvl.label}</span>
                            {currentQuality === lvl.index && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fit Toggle Button */}
                <button onClick={handleToggleFit} className="player-icon-btn" title={`Video Fit: ${objectFit} (click to change)`}>
                  <Crop size={18} />
                </button>

                {/* Fullscreen Button */}
                <button onClick={handleToggleFullscreen} className="player-icon-btn" title="Toggle Fullscreen (F)">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Side Channel Playlist Drawer */}
        {showDrawer && playlistChannels.length > 0 && (
          <div className="player-side-drawer">
            <div className="player-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tv size={17} color="var(--accent-red)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Live Channels</h4>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {playlistChannels.length} Feeds
              </span>
            </div>

            <div className="player-drawer-list">
              {playlistChannels.slice(0, 40).map((ch) => {
                const isActive = ch.id === channel.id;
                const isChOffline = offlineChannels.includes(ch.id) || !ch.streams || ch.streams.length === 0 || ch.streams.every((s) => s.status === 'offline' || s.status === 'error');
                return (
                  <div
                    key={ch.id}
                    onClick={() => onSelectChannel && onSelectChannel(ch)}
                    className={`player-drawer-item ${isActive ? 'active' : ''} ${isChOffline ? 'offline' : ''}`}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {ch.logo ? (
                        <img src={ch.logo} alt={ch.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Tv size={16} color="var(--text-muted)" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isActive ? 'var(--accent-red)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ch.name}
                        </span>
                        {isChOffline && (
                          <span
                            className="badge badge-offline"
                            style={{ fontSize: '0.6rem', padding: '1px 5px', flexShrink: 0, letterSpacing: '0.01em' }}
                          >
                            NOT WORKING
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ch.country ? `🏳️ ${ch.country}` : 'Global'} {ch.categories?.[0] ? `• ${ch.categories[0]}` : ''}
                      </div>
                    </div>

                    {isActive && (
                      <span className="pulse-dot" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
