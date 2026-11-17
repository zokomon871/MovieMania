'use client';

import React, { useState } from 'react';
import { ISeries } from '@/lib/types';
import { SeriesVODPlayer } from '@/components/player/SeriesVODPlayer';
import { EpisodeSelector } from './EpisodeSelector';

interface Props {
  series: ISeries;
}

export function SeriesPlayerView({ series }: Props) {
  const episodes = series.episodes || [];
  const defaultSeason = episodes.length > 0 ? episodes[0].season : 1;
  const defaultEpisode = episodes.length > 0 ? episodes[0].episode : 1;

  const [currentSeason, setCurrentSeason] = useState(defaultSeason);
  const [currentEpisode, setCurrentEpisode] = useState(defaultEpisode);

  // Determine if a previous / next episode is available
  const hasPrevInSeason = episodes.some((e) => e.season === currentSeason && e.episode === currentEpisode - 1);
  const prevSeasonEpisodes = episodes.filter((e) => e.season === currentSeason - 1);
  const prevSeasonLastEp = prevSeasonEpisodes.length > 0 ? prevSeasonEpisodes[prevSeasonEpisodes.length - 1] : null;
  const hasPrev = hasPrevInSeason || !!prevSeasonLastEp;

  const hasNextInSeason = episodes.some((e) => e.season === currentSeason && e.episode === currentEpisode + 1);
  const nextSeasonFirstEp = episodes.find((e) => e.season === currentSeason + 1 && e.episode === 1);
  const hasNext = hasNextInSeason || !!nextSeasonFirstEp;

  const handlePrevEpisode = () => {
    if (hasPrevInSeason) {
      setCurrentEpisode((e) => e - 1);
    } else if (prevSeasonLastEp) {
      setCurrentSeason((s) => s - 1);
      setCurrentEpisode(prevSeasonLastEp.episode);
    }
  };

  const handleNextEpisode = () => {
    if (hasNextInSeason) {
      setCurrentEpisode((e) => e + 1);
    } else if (nextSeasonFirstEp) {
      setCurrentSeason((s) => s + 1);
      setCurrentEpisode(1);
    }
  };

  const handleSelectSeason = (season: number) => {
    setCurrentSeason(season);
    const firstEp = episodes.find((e) => e.season === season);
    if (firstEp) setCurrentEpisode(firstEp.episode);
  };

  const currentEpData = episodes.find((e) => e.season === currentSeason && e.episode === currentEpisode);

  return (
    <div>
      <SeriesVODPlayer
        seriesId={series.id}
        tmdbId={series.tmdbId}
        title={currentEpData?.title || series.title}
        season={currentSeason}
        episode={currentEpisode}
        hasPrevEpisode={hasPrev}
        onPrevEpisode={handlePrevEpisode}
        hasNextEpisode={hasNext}
        onNextEpisode={handleNextEpisode}
      />

      {episodes.length > 0 ? (
        <EpisodeSelector
          episodes={episodes}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelectEpisode={(s, ep) => {
            setCurrentSeason(s);
            setCurrentEpisode(ep);
          }}
          onSelectSeason={handleSelectSeason}
        />
      ) : (
        <div style={{ marginTop: '30px', padding: '24px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Stream ready. Use the player controls to watch episodes directly.
        </div>
      )}
    </div>
  );
}

