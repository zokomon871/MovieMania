import React from 'react';
import { notFound } from 'next/navigation';
import { getMovieDetails, getTrendingMovies } from '@/lib/tmdb';
import { MovieDetailView } from '@/components/movies/MovieDetailView';

export default async function MoviePlayerPage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id);
  if (!movie) notFound();

  const trending = await getTrendingMovies();
  const related = trending.filter((m) => m.id !== movie.id).slice(0, 12);

  return <MovieDetailView movie={movie} relatedMovies={related} />;
}
