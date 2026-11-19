import React from 'react';
import { notFound } from 'next/navigation';
import { fetchSeriesDetails, getTrendingSeries } from '@/lib/seriesService';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  // Fetch series details and related trending in PARALLEL to avoid sequential waterfall delay
  const [series, trending] = await Promise.all([
    fetchSeriesDetails(params.id),
    getTrendingSeries(16),
  ]);

  if (!series) notFound();

  const related = trending.filter((s) => s.id !== series.id).slice(0, 12);

  return <SeriesDetailView series={series} relatedSeries={related} />;
}
