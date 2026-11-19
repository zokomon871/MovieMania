import React from 'react';
import { notFound } from 'next/navigation';
import { getMovieDetails, getTrendingMovies } from '@/lib/tmdb';
import { MovieDetailView } from '@/components/movies/MovieDetailView';

export default async function MoviePlayerPage({ params }: { params: { id: string } }) {
  // Fetch movie details and related trending in PARALLEL to avoid sequential waterfall delay
  const [movie, trending] = await Promise.all([
    getMovieDetails(params.id),
    getTrendingMovies(),
  ]);

  if (!movie) notFound();

  const related = trending.filter((m) => m.id !== movie.id).slice(0, 12);

  return <MovieDetailView movie={movie} relatedMovies={related} />;
}
