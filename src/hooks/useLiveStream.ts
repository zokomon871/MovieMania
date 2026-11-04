import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type Hls from 'hls.js';
import { IStream } from '@/lib/types';

/**
 * MovieMania live playback engine.
 *
 * The player UI, state machine and failover logic are ours. hls.js is used only
 * as the transport that turns HLS segments into something the browser's
 * MediaSource API can decode (Chrome/Firefox/Edge cannot play .m3u8 natively).
 * It is lazy-loaded, and skipped entirely on browsers with native HLS (Safari, iOS).
 *
 * For every channel it walks an ordered list of attempts:
 *   source 1 direct → source 1 via relay → source 2 direct → …
 * and only reports the channel offline once all of them have failed.
 */

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

interface Attempt {
  sourceIndex: number;
  url: string;
  proxy: boolean;
}

const DIRECT_TIMEOUT = 8000;
const PROXY_TIMEOUT = 12000;
const AUDIO_ONLY_AFTER = 3; // seconds of playback without a picture

function proxyUrl(stream: IStream) {
  const params = new URLSearchParams({ url: stream.url });
  if (stream.referrer) params.set('ref', stream.referrer);
  if (stream.user_agent) params.set('ua', stream.user_agent);
  return `/api/proxy?${params.toString()}`;
}

function buildAttempts(streams: IStream[]): Attempt[] {
  return streams.flatMap((s, sourceIndex) => {
    const needsHeaders = !!(s.referrer || s.user_agent);
    const direct = { sourceIndex, url: s.url, proxy: false };
    const relay = { sourceIndex, url: proxyUrl(s), proxy: true };
    // Feeds that need a Referer/User-Agent can only work through the relay.
    return needsHeaders ? [relay] : [direct, relay];
  });
}

export function useLiveStream(
  streams: IStream[] | undefined,
  onOffline?: () => void,
  onOnline?: () => void
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const sources = useMemo(() => (streams ?? []).filter((s) => !!s?.url), [streams]);
  const sourcesKey = sources.map((s) => s.url).join('|');
  const attempts = useMemo(() => buildAttempts(sources), [sourcesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attempt index is scoped to the channel so switching channels always starts at attempt 0.
  const [attemptState, setAttemptState] = useState({ key: sourcesKey, index: 0 });
  const attemptIndex = attemptState.key === sourcesKey ? attemptState.index : 0;
  const setAttemptIndex = useCallback(
    (next: number | ((i: number) => number)) =>
      setAttemptState((prev) => {
        const base = prev.key === sourcesKey ? prev.index : 0;
        return { key: sourcesKey, index: typeof next === 'function' ? next(base) : next };
      }),
    [sourcesKey]
  );
  const [retryToken, setRetryToken] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [activeLevel, setActiveLevel] = useState(-1);
  const [isBehindLive, setIsBehindLive] = useState(false);

  const onOfflineRef = useRef(onOffline);
  const onOnlineRef = useRef(onOnline);
  useEffect(() => {
    onOfflineRef.current = onOffline;
    onOnlineRef.current = onOnline;
  });

  const attempt = attempts[attemptIndex];

  // ── Load the current attempt ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setQualityLevels([]);
    setActiveLevel(-1);
    setCurrentQuality(-1);
    setIsAudioOnly(false);
    setIsBehindLive(false);

    if (!attempt) {
      setIsBuffering(false);
      setError(
        sources.length === 0
          ? 'No stream is listed for this channel.'
          : 'We tried every source for this channel and none are broadcasting right now.'
      );
      onOfflineRef.current?.();
      return;
    }

    setError(null);
    setIsBuffering(true);

    let cancelled = false;
    let gotMedia = false;
    let mediaRecoveries = 0;
    const advance = () => {
      if (cancelled) return;
      cancelled = true;
      setAttemptIndex((i) => i + 1);
    };
    const markOnline = () => {
      if (gotMedia) return;
      gotMedia = true;
      clearTimeout(watchdog);
      setIsBuffering(false);
      onOnlineRef.current?.();
    };
    const tryPlay = () => video.play().catch(() => setIsPlaying(false));

    const watchdog = setTimeout(() => {
      if (!gotMedia && video.readyState < 2) advance();
    }, attempt.proxy ? PROXY_TIMEOUT : DIRECT_TIMEOUT);

    // ── Media element events (attached here so the element is guaranteed to exist) ──
    let playStartedAt: number | null = null;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      markOnline();
    };
    const onTimeUpdate = () => {
      if (playStartedAt == null) playStartedAt = video.currentTime;
      if (video.videoWidth > 0) setIsAudioOnly(false);
      else if (video.currentTime - playStartedAt > AUDIO_ONLY_AFTER) setIsAudioOnly(true);
      const live = hlsRef.current?.liveSyncPosition;
      setIsBehindLive(live != null && video.currentTime < live - 12);
    };
    const onResize = () => video.videoWidth > 0 && setIsAudioOnly(false);
    const onNativeError = () => !hlsRef.current && advance();

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('loadeddata', markOnline);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('resize', onResize);
    video.addEventListener('error', onNativeError);

    const prefersNative = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    (async () => {
      const { default: HlsLib } = await import('hls.js');
      if (cancelled) return;

      if (HlsLib.isSupported()) {
        const hls = new HlsLib({
          enableWorker: true,
          backBufferLength: 30,
          manifestLoadingMaxRetry: attempt.proxy ? 2 : 0,
          levelLoadingMaxRetry: attempt.proxy ? 2 : 0,
          fragLoadingMaxRetry: attempt.proxy ? 4 : 2,
        });
        hlsRef.current = hls;
        hls.loadSource(attempt.url);
        hls.attachMedia(video);

        hls.on(HlsLib.Events.MANIFEST_PARSED, (_, data) => {
          setQualityLevels(
            data.levels
              .map((lvl, index) => ({
                index,
                height: lvl.height,
                bitrate: lvl.bitrate,
                label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)} kbps`,
              }))
              .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
          );
          tryPlay();
        });
        // The demuxer tells us up-front whether the feed carries a video track at all.
        hls.on(HlsLib.Events.BUFFER_CODECS, (_, data) => {
          setIsAudioOnly(!data.video && !!data.audio);
        });
        hls.on(HlsLib.Events.FRAG_BUFFERED, markOnline);
        hls.on(HlsLib.Events.LEVEL_SWITCHED, (_, data) => setActiveLevel(data.level));
        hls.on(HlsLib.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 2) {
            if (mediaRecoveries === 1) hls.swapAudioCodec();
            mediaRecoveries++;
            hls.recoverMediaError();
            return;
          }
          advance();
        });
      } else if (prefersNative) {
        video.src = attempt.url;
        tryPlay();
      } else {
        clearTimeout(watchdog);
        cancelled = true;
        setIsBuffering(false);
        setError('Your browser cannot play live streams. Try a recent Chrome, Edge, Firefox or Safari.');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('loadeddata', markOnline);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('resize', onResize);
      video.removeEventListener('error', onNativeError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [attempt, sources.length, retryToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public controls ──
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
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
      video.play().catch(() => {});
    }
  }, []);

  const retry = useCallback(() => {
    setAttemptIndex(0);
    setRetryToken((t) => t + 1);
  }, [setAttemptIndex]);

  const selectSource = useCallback(
    (sourceIndex: number) => {
      const idx = attempts.findIndex((a) => a.sourceIndex === sourceIndex);
      if (idx >= 0) {
        setAttemptIndex(idx);
        setRetryToken((t) => t + 1);
      }
    },
    [attempts, setAttemptIndex]
  );

  const currentSource = attempt?.sourceIndex ?? -1;
  const nextSource = currentSource >= 0 && currentSource < sources.length - 1 ? currentSource + 1 : -1;

  return {
    videoRef,
    isPlaying,
    isBuffering,
    error,
    isAudioOnly,
    qualityLevels,
    currentQuality,
    activeLevel,
    isBehindLive,
    usingRelay: !!attempt?.proxy,
    sourceCount: sources.length,
    currentSource,
    nextSource,
    togglePlay,
    setQuality,
    goLive,
    retry,
    selectSource,
  };
}
