const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

export async function fetchTrendingMovies(): Promise<TMDBMovie[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/movies/trending`, {
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
}

export async function fetchPopularMovies(page = 1): Promise<TMDBMovie[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/movies/popular?page=${page}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/movies/search?query=${encodeURIComponent(query)}&page=1`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

export async function getMovieDetails(id: string): Promise<TMDBMovie | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/movies/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500') {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
