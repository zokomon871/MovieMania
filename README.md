# MovieMania 🎬 📺

<p align="center">
  <b>A unified, high-performance streaming platform combining Global Live IPTV, VOD Blockbuster Movies, and TV Series in a modern Next.js 14 web application.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-Upstash%20%2F%20Local-red?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/HLS.js-Live%20Streaming-orange?style=for-the-badge" alt="Hls.js" />
  <img src="https://img.shields.io/badge/Docker-Compose%20Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

---

## 🌟 Highlights & Features

### 📺 1. Global Live IPTV
- **Massive Directory:** Browse thousands of free live TV channels across sports, news, entertainment, movies, and kids, powered by the open [iptv-org](https://github.com/iptv-org/iptv) catalog.
- **Custom HLS Player:** Low-latency live video playback powered by `hls.js` with adaptive bitrate streaming (Auto / 1080p / 720p / 480p / 360p), aspect ratio toggling (`Fit`, `Zoom`, `Stretch`), picture-in-picture, and server-side CORS proxy fallback (`/api/proxy`).
- **Stream Watchdog & Auto-Prune:** Background health checker pings `.m3u8` streams using byte-range headers (`Range: bytes=0-100`) to immediately detect 404s, 403 geo-blocks, or timeouts (> 3s), keeping your channel grid 100% active.

### 🎬 2. VOD Cinema (Movies & TV Series)
- **Extensive Catalog:** Popular, trending, and genre-categorized titles across 12 distinct genres (Action, Sci-Fi, Comedy, Horror, Drama, Animation, etc.).
- **Dual Stream Servers:** Instant 1-click switcher between **VidSrc** and **VidLink** (`vidlink.pro`) directly within the video player header, with client-side preference remembered in `localStorage`.
- **TV Series Navigation:** Clean multi-season and episode picker with automatic next-episode sequencing and canonical numbering.
- **Just-In-Time (JIT) Ingestion:** If a movie or series isn't yet stored in MongoDB when a user searches for it, the backend fetches metadata from Cinemeta on the fly, saves it to MongoDB, and returns it immediately for zero-lag subsequent queries.

### ⚡ 3. High-Performance Caching & Architecture
- **In-Memory Redis Layer:** Redis caching across popular titles, trending lists, channel categories, and stream health status with automated 5-hour TTL (`18,000s`).
- **Graceful Fallback:** Automatically bypasses Redis if offline without interrupting database queries or user playback.
- **Full Text Search:** MongoDB text indexing across titles, alternative names, descriptions, and genres.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend & Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing across models and API routes) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Native driver, text indexes, aggregation pipelines) |
| **Cache** | [Redis](https://redis.io/) (`ioredis` client with cloud TLS & localhost support) |
| **Video Engine** | [Hls.js](https://github.com/video-dev/hls.js/) (Live HLS) & VidSrc / VidLink Embeds (VOD) |
| **Icons & Styling** | [Lucide React](https://lucide.dev/), pure dark-mode responsive modern CSS |
| **Local Containerization** | [Docker Compose](https://docs.docker.com/compose/) (MongoDB 4.4 & Redis 7 Alpine) |

---

## 📁 Project Structure

```text
MovieMania/
├── docker-compose.yml          # Local MongoDB (27019) & Redis (6389) containers
├── package.json                # Project dependencies and production scripts
├── tsconfig.json               # TypeScript compiler configuration
├── next.config.mjs             # Next.js image domain & compiler settings
├── .env.example                # Localhost environment configuration template
└── src/
    ├── app/                    # Next.js 14 App Router
    │   ├── page.tsx            # Live TV Home page with Channel Billboard & Grid
    │   ├── movies/             # VOD Movie catalog & single movie player route
    │   ├── series/             # TV Series catalog & episode player route
    │   ├── favorites/          # Bookmarked & favorite channels
    │   └── api/                # Production API endpoints (channels, movies, series, proxy)
    ├── components/             # Reusable UI & Player components
    │   ├── channels/           # Channel grid, rows, cards, and billboard
    │   ├── movies/             # Movie hero banners, explorers, and cards
    │   ├── series/             # TV series explorer and episode selectors
    │   ├── player/             # HLS Live TV Player, Movie Player & Series Player
    │   └── layout/             # Top navbar, search header, and category filters
    ├── hooks/                  # Custom React hooks (useHlsPlayer, useFavorites, etc.)
    └── lib/                    # Database clients (Mongo, Redis), services, and types
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(if running databases locally)*

---

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

#### For Localhost Development (Default in `.env.example`):
```env
# MongoDB Connection (Local Docker container on port 27019)
MONGODB_URI=mongodb://localhost:27019/moviemania

# Redis Cache (Local Docker container on port 6389)
REDIS_URL=redis://localhost:6389

# Port (Optional, defaults to 3000)
PORT=3000
```

#### For Cloud Deployment (MongoDB Atlas & Upstash Redis):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/moviemania?retryWrites=true&w=majority
REDIS_URL=rediss://default:<token>@<endpoint>.upstash.io:6379
```

---

### 3. Start Local Databases (Optional if using Cloud)
If you are developing locally with Docker:
```bash
docker-compose up -d
```
* **MongoDB:** `localhost:27019`
* **Redis:** `localhost:6389`

---

### 4. Install Dependencies
```bash
npm install
```

---

### 5. Launch the Application

#### Development Mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build & Run:
```bash
npm run build
npm start
```

---

## ⌨️ Player Keyboard Shortcuts

Control playback seamlessly using standard hotkeys:

| Key | Action | Supported Players |
| :--- | :--- | :--- |
| `Space` / `K` | Toggle Play / Pause | Live TV, Movies, Series |
| `F` | Toggle Fullscreen | Live TV, Movies, Series |
| `M` | Toggle Audio Mute | Live TV |
| `↑` / `↓` | Volume Up / Down (5% steps) | Live TV |
| `←` / `→` | Seek backward / forward 10s | VOD Player |
| `L` | Seek to Live Edge | Live TV |
| `Esc` | Close player modal | Live TV, Movies, Series |

---

## 📜 Available NPM Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port 3000. |
| `npm run build` | Builds the optimized production application with TypeScript verification. |
| `npm start` | Runs the compiled Next.js production server. |
| `npm run lint` | Runs ESLint checks across the codebase. |

---

## ⚖️ Disclaimer

- **Live IPTV:** All live channels are sourced from publicly accessible streams indexed by the open [iptv-org](https://github.com/iptv-org/iptv) project. MovieMania does not broadcast, host, or control any proprietary video streams.
- **VOD Content:** Movie and TV metadata is retrieved via open APIs ([Cinemeta](https://v3-cinemeta.strem.io)). Streaming playback is rendered through external third-party embeds (VidSrc and VidLink).
- This project is developed strictly for educational and personal research purposes.
