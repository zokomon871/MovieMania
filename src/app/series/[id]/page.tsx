import React from 'react';
import { notFound } from 'next/navigation';
import { fetchSeriesDetails, getTrendingSeries } from '@/lib/seriesService';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const series = await fetchSeriesDetails(params.id);
  if (!series) notFound();

  const trending = await getTrendingSeries(16);
  const related = trending.filter((s) => s.id !== series.id).slice(0, 12);

  return <SeriesDetailView series={series} relatedSeries={related} />;
}
