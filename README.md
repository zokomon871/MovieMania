# MovieMania 🎬 📺

> **MovieMania** is a unified, high-performance web streaming platform combining **Global Live IPTV**, **VOD Blockbuster Movies**, and **TV Series & Shows** in a single, modern Next.js 14 application.

---

## 🌟 Features

### 📺 Live IPTV Channels
- **Global Channel Directory:** Browse thousands of free live TV channels across sports, news, entertainment, movies, and kids, powered by the open [iptv-org](https://github.com/iptv-org/iptv) database.
- **Custom HLS Player:** Low-latency playback powered by `hls.js` with adaptive bitrate streaming (Auto/1080p/720p/480p/360p), aspect ratio toggling (`Fit`, `Zoom`, `Stretch`), picture-in-picture, and server-side CORS proxy fallback (`/api/proxy`).
- **Interactive Keyboard Shortcuts:** Control playback with standard media keys (`Space`, `F` for fullscreen, `M` for mute, `↑`/`↓` for volume, `Esc` to close).

### 🎬 VOD Cinema (Movies)
- **Extensive Catalog:** Popular, trending, and genre-balanced movie browsing across 12 distinct genres (Action, Adventure, Comedy, Sci-Fi, Horror, Thriller, etc.).
- **HD Video Streaming:** On-demand movie playback powered by VidSrc embeds using IMDb identifiers.
- **Just-In-Time (JIT) Ingestion:** If a user searches for a movie not yet stored in MongoDB, the backend automatically fetches metadata from Cinemeta, serves it immediately, and saves it to MongoDB for instant future searches.

### 📺 TV Series & Shows
- **Multi-Season Navigation:** Complete season and episode picker with automatic active episode detection and next-episode playback.
- **Clean Canonical Numbering:** Special/short episode deduplication ensures that Season 1 cleanly starts with Episode 1 without duplicate episode cards.
- **Rich Media Details:** Poster artwork, high-resolution backdrops, IMDb ratings, release years, and detailed synopses.

### 🏥 Automated "Stream-Health" Filter
- **3-Second Watchdog:** Programmatically pings stream URLs (`.m3u8` / `.mpd`) using fast byte-range headers (`Range: bytes=0-100`).
- **Dead Link Detection:** Automatically detects 404 (Not Found), 403 Forbidden (geo-blocked), server errors (5xx), and timeouts (> 3 seconds).
- **Auto-Dropping Bad Streams:** Channels marked offline are automatically dropped from the active UI and search filters.
- **Real-Time Client Feedback:** If a stream fails during browser playback, the player hook reports the failure to `/api/channels/health` to mark the stream offline on the server.

### ⚡ Performance & Caching
- **Redis Cache Layer:** In-memory caching for trending lists, category counts, country aggregations, and stream health pings with automated TTLs.
- **MongoDB Text Search:** Indexed search across titles, alternative names, genres, and overviews.
- **Clean Architecture:** Strict separation between server and client boundaries with pure JSON serialization.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing across all services) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Native driver, text indexing, aggregation pipelines) |
| **Cache** | [Redis](https://redis.io/) (`ioredis` with graceful offline bypass) |
| **Video Engine** | [Hls.js](https://github.com/video-dev/hls.js/) (Live HLS) & VidSrc Embeds (VOD) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), pure responsive dark-theme CSS |
| **Containerization** | [Docker Compose](https://docs.docker.com/compose/) (MongoDB 4.4 & Redis 7 Alpine) |

---

## 📁 Project Structure

```text
MovieMania/
├── docker-compose.yml          # MongoDB (port 27019) & Redis (port 6389) containers
├── package.json                # Project dependencies and operational scripts
├── tsconfig.json               # TypeScript compiler configuration
├── next.config.mjs             # Next.js configuration and image domains
├── scripts/
│   ├── sync.mjs                # Multi-source ingestion script (Channels, Movies, Series)
│   ├── health-check.mjs        # Parallel stream health verification & prune script
│   └── warm.mjs                # Route pre-warming script for development
└── src/
    ├── app/                    # Next.js 14 App Router
    │   ├── page.tsx            # Live TV Home page with Channel Billboard & Grid
    │   ├── movies/             # VOD Cinema directory & Movie player routes
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── series/             # TV Series catalog & Episode player routes
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── favorites/          # Saved channels & bookmarks
    │   └── api/                # API endpoints
    │       ├── channels/       # Channel pagination, search & health ping
    │       ├── movies/         # Movie search, trending & streaming metadata
    │       ├── series/         # TV series search & metadata
    │       └── proxy/          # Server-side HLS CORS bypass proxy
    ├── components/             # Modular React components
    │   ├── channels/           # Channel grid, row, billboard, and filter bars
    │   ├── movies/             # Movie cards, hero banners, and explorers
    │   ├── series/             # Series cards, episode selectors, and series views
    │   ├── player/             # HLS Live player, VOD player, and Series player
    │   └── layout/             # Top navbar, search header, and category pills
    ├── hooks/                  # Custom React hooks (useHlsPlayer, useChannels, etc.)
    └── lib/                    # Core backend services, database connectors, and types
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.17 or higher recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local MongoDB & Redis services)

---

### 2. Start Local Databases (Docker)
Start the background MongoDB and Redis containers:
```bash
docker-compose up -d
```
* **MongoDB:** `localhost:27019` (database: `streamhub`)
* **Redis:** `localhost:6389`

---

### 3. Environment Variables
Create a `.env.local` file in the root directory (or copy from `.env.example`):
```env
# MongoDB Connection (mapped to port 27019 in docker-compose)
MONGODB_URI=mongodb://localhost:27019/streamhub

# Redis Connection (mapped to port 6389 in docker-compose)
REDIS_URL=redis://localhost:6389

# App Port (Optional)
PORT=3000
```

---

### 4. Install Dependencies
```bash
npm install
```

---

### 5. Ingest Media Database
Populate your database with channels, movies, and series:

```bash
# Sync all media (Channels, Movies across 12 genres, and TV Shows)
npm run sync:all

# Or sync specific categories individually:
npm run sync:channels    # Live TV channels
npm run sync:movies      # Movies across all 12 genres
npm run sync:series      # TV series across all genres
```

---

### 6. Run Automated Stream Health Check (Optional)
Filter out broken, 404, or geo-blocked stream links:
```bash
# Fast test: verifies 100 channels with 20 parallel workers
npm run health:fast

# Full health check: marks offline streams across the whole database
npm run health:check

# Prune: permanently deletes dead links from MongoDB
npm run health:prune
```

---

### 7. Run the Application

#### Development Mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Mode (Recommended for fastest zero-compile browsing):
```bash
npm run serve
```
*(Runs `next build` once to pre-compile all routes, then serves the application instantly).*

---

## ⌨️ Player Keyboard Shortcuts

When the video player is open, you can control playback using the keyboard:

| Shortcut | Action |
| :--- | :--- |
| `Space` / `K` | Toggle Play / Pause |
| `F` | Toggle Fullscreen |
| `M` | Toggle Mute |
| `↑` / `↓` | Volume Up / Down (5% increments) |
| `←` / `→` | Seek backward / forward 10 seconds (VOD) |
| `L` | Jump to Live Edge (Live Streams) |
| `Esc` | Close video player |

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port 3000. |
| `npm run serve` | Compiles the production build and starts the production server. |
| `npm run build` | Compiles all pages, runs TypeScript checks, and generates production bundles. |
| `npm run warm` | Pre-pings all routes on a running dev server to compile pages ahead of time. |
| `npm run sync:all` | Pulls channels, movies, and series into MongoDB with 100% deduplication. |
| `npm run sync:channels` | Ingests live IPTV channels from iptv-org. |
| `npm run sync:movies` | Fetches movies evenly distributed across 12 genres from Cinemeta. |
| `npm run sync:series` | Ingests TV series catalog evenly across all genres. |
| `npm run health:fast` | Runs rapid stream health checks against 100 channels. |
| `npm run health:check` | Verifies stream health for all channels in MongoDB and updates online status. |
| `npm run health:prune` | Tests all channels and removes broken or geo-blocked streams from MongoDB. |

---

## ⚖️ Disclaimer

* **IPTV Streams:** All live channels are sourced from publicly available streams indexed by the [iptv-org](https://github.com/iptv-org/iptv) project. MovieMania does not host, broadcast, or store any proprietary video content.
* **VOD Metadata:** Movie and TV metadata is retrieved via open APIs ([Cinemeta](https://v3-cinemeta.strem.io)). Video playback is rendered via external embeds.
* This project is created for educational and personal research purposes.

