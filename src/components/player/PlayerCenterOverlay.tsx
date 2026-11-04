import React, { useEffect, useState } from 'react';
import { Play, RefreshCw, SkipForward, Tv, WifiOff, AudioLines, Radio } from 'lucide-react';
import { IChannel } from '@/lib/types';
import type { useLiveStream } from '@/hooks/useLiveStream';

type Engine = ReturnType<typeof useLiveStream>;

interface OverlayProps {
  channel: IChannel;
  engine: Engine;
  nextChannel: IChannel | null;
  onNext: () => void;
}

const AUTO_SKIP_SECONDS = 8;

function ChannelMark({ channel, size = 'md' }: { channel: IChannel; size?: 'md' | 'lg' }) {
  return (
    <div className={`lp-mark ${size}`}>
      {channel.logo ? <img src={channel.logo} alt="" /> : <Tv size={size === 'lg' ? 34 : 26} />}
    </div>
  );
}

export function PlayerCenterOverlay({ channel, engine, nextChannel, onNext }: OverlayProps) {
  const { error, isBuffering, isPlaying, isAudioOnly, usingRelay, currentSource, sourceCount, nextSource } = engine;

  if (error) {
    return <ErrorCard key={channel.id} channel={channel} message={error} nextChannel={nextChannel} onNext={onNext} onRetry={engine.retry} />;
  }

  if (isBuffering) {
    const caption = currentSource > 0 ? `Trying backup source ${currentSource + 1} of ${sourceCount}…` : usingRelay ? 'Connecting through relay…' : 'Tuning in…';
    return (
      <div className="lp-center">
        <div className="lp-tuning">
          <ChannelMark channel={channel} />
          <div className="lp-spinner" aria-hidden />
        </div>
        <div className="lp-caption" role="status">{caption}</div>
      </div>
    );
  }

  if (isAudioOnly) {
    return (
      <div className="lp-center lp-audio-only">
        <ChannelMark channel={channel} size="lg" />
        <div className="lp-audio-badge">
          <AudioLines size={15} /> Audio only
        </div>
        <p className="lp-audio-text">
          This feed is sending sound but no picture your browser can show.
          {nextSource >= 0 ? ' Another source may have video.' : ''}
        </p>
        <div className="lp-actions">
          {nextSource >= 0 && (
            <button className="lp-pill primary" onClick={() => engine.selectSource(nextSource)}>
              <Radio size={15} /> Try source {nextSource + 1}
            </button>
          )}
          {nextChannel && (
            <button className={`lp-pill ${nextSource >= 0 ? '' : 'primary'}`} onClick={onNext}>
              <SkipForward size={15} /> Next channel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <button className="lp-big-play" onClick={engine.togglePlay} onPointerUp={(e) => e.stopPropagation()} aria-label="Play">
        <Play size={32} fill="currentColor" />
      </button>
    );
  }

  return null;
}

function ErrorCard({
  channel,
  message,
  nextChannel,
  onNext,
  onRetry,
}: {
  channel: IChannel;
  message: string;
  nextChannel: IChannel | null;
  onNext: () => void;
  onRetry: () => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(nextChannel ? AUTO_SKIP_SECONDS : null);

  useEffect(() => {
    if (countdown == null) return;
    if (countdown <= 0) {
      onNext();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c == null ? c : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, onNext]);

  return (
    <div className="lp-center solid" onPointerUp={(e) => e.stopPropagation()}>
      <div className="lp-error">
        <div className="lp-error-icon">
          <WifiOff size={24} />
        </div>
        <div className="lp-error-title">{channel.name} is off air</div>
        <div className="lp-error-text">{message}</div>

        <div className="lp-actions">
          <button className="lp-pill" onClick={onRetry}>
            <RefreshCw size={15} /> Try again
          </button>
          {nextChannel && (
            <button className="lp-pill primary" onClick={onNext}>
              <SkipForward size={15} /> Watch {nextChannel.name}
            </button>
          )}
        </div>

        {countdown != null && nextChannel && (
          <div className="lp-autoskip">
            <div className="lp-autoskip-bar" style={{ animationDuration: `${AUTO_SKIP_SECONDS}s` }} />
            <span>
              Switching to the next channel in {countdown}s ·{' '}
              <button className="lp-link" onClick={() => setCountdown(null)}>
                Stay here
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
