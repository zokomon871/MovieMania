import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { IStream } from '@/lib/types';
import { useVideoMediaEvents } from './useVideoMediaEvents';

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export function useHlsPlayer(
  stream: IStream | undefined,
  onStreamOffline?: () => void,
  onStreamOnline?: () => void
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [activeLevel, setActiveLevel] = useState(-1);
  const [usingProxy, setUsingProxy] = useState(false);
  const [isBehindLive, setIsBehindLive] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const onOfflineRef = useRef(onStreamOffline);
  const onOnlineRef = useRef(onStreamOnline);
  useEffect(() => {
    onOfflineRef.current = onStreamOffline;
    onOnlineRef.current = onStreamOnline;
  });

  const cleanup = useCallback(() => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const loadStream = useCallback(
    (url: string, forceProxy = false) => {
      const video = videoRef.current;
      if (!video || !url) return;
      cleanup();

      setStreamError(null);
      setIsBuffering(true);
      setQualityLevels([]);
      setActiveLevel(-1);
      setCurrentQuality(-1);
      const effectiveUrl = forceProxy ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

      const fail = (msg: string) => {
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        setStreamError(msg);
        setIsBuffering(false);
        onOfflineRef.current?.();
      };

      watchdogRef.current = setTimeout(() => {
        if (video.readyState < 2) {
          if (!forceProxy) {
            setUsingProxy(true);
            loadStream(url, true);
          } else {
            fail('This channel is not broadcasting right now.');
          }
        }
      }, forceProxy ? 12000 : 7000);

      const tryPlay = () => video.play().catch(() => setIsPlaying(false));

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          ...(forceProxy ? {} : { manifestLoadingMaxRetry: 0, levelLoadingMaxRetry: 0 }),
        });
        hlsRef.current = hls;
        hls.loadSource(effectiveUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setQualityLevels(
            data.levels.map((lvl, index) => ({
              index,
              height: lvl.height,
              bitrate: lvl.bitrate,
              label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)} kbps`,
            })).sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
          );
          tryPlay();
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (watchdogRef.current) clearTimeout(watchdogRef.current);
          setIsBuffering(false);
          onOnlineRef.current?.();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setActiveLevel(data.level));
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (!forceProxy) {
            setUsingProxy(true);
            loadStream(url, true);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            fail('Could not reach this channel. The feed may be offline.');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = effectiveUrl;
        tryPlay();
      } else {
        fail('Your browser does not support HLS playback.');
      }
    },
    [cleanup]
  );

  useEffect(() => {
    if (stream?.url) {
      setUsingProxy(false);
      loadStream(stream.url, false);
    }
    return cleanup;
  }, [stream?.url, retryToken, loadStream, cleanup]);

  useVideoMediaEvents({ videoRef, hlsRef, setIsPlaying, setIsBuffering, setIsBehindLive });

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(console.error);
    else video.pause();
  }, []);

  const setQuality = useCallback((index: number) => {
    setCurrentQuality(index);
    if (hlsRef.current) hlsRef.current.currentLevel = index;
  }, []);

  const goLive = useCallback(() => {
    const video = videoRef.current;
    const target = hlsRef.current?.liveSyncPosition ?? video?.duration;
    if (video && target != null && Number.isFinite(target)) {
      video.currentTime = target;
      video.play().catch(console.error);
    }
  }, []);

  return {
    videoRef, isPlaying, isBuffering, streamError, qualityLevels, currentQuality,
    activeLevel, usingProxy, isBehindLive, togglePlay, setQuality, goLive, retry: () => setRetryToken((t) => t + 1),
  };
}
