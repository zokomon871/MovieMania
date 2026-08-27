const express = require('express');
const router = express.Router();
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper to fetch from TMDb
const fetchFromTMDb = async (endpoint, params = {}) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured on the backend');
  }

  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  }).toString();

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`;
  
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`TMDb API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await fetchFromTMDb('/trending/movie/day');
    res.json({ results: data.results || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// GET /api/movies/popular
router.get('/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await fetchFromTMDb('/movie/popular', { page });
    res.json({ results: data.results || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

// GET /api/movies/search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.json({ results: [] });
    
    const page = req.query.page || 1;
    const data = await fetchFromTMDb('/search/movie', { query, page });
    res.json({ results: data.results || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await fetchFromTMDb(`/movie/${req.params.id}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// GET /api/movies/:id/stream
router.get('/:id/stream', (req, res) => {
  // We keep the streaming source provider logic on the backend!
  // If vidsrc goes down, we only change it here.
  res.json({ url: `https://vidsrc.me/embed/movie?tmdb=${req.params.id}` });
});

module.exports = router;
