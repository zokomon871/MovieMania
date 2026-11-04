import { useEffect, RefObject } from 'react';
import Hls from 'hls.js';

interface MediaEventsProps {
  videoRef: RefObject<HTMLVideoElement>;
  hlsRef: RefObject<Hls | null>;
  setIsPlaying: (v: boolean) => void;
  setIsBuffering: (v: boolean) => void;
  setIsBehindLive: (v: boolean) => void;
  tolerance?: number;
}

export function useVideoMediaEvents({
  videoRef,
  hlsRef,
  setIsPlaying,
  setIsBuffering,
  setIsBehindLive,
  tolerance = 12,
}: MediaEventsProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onTimeUpdate = () => {
      const live = hlsRef.current?.liveSyncPosition;
      setIsBehindLive(live != null && video.currentTime < live - tolerance);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [videoRef, hlsRef, setIsPlaying, setIsBuffering, setIsBehindLive, tolerance]);
}

