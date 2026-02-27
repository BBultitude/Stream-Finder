# Design-v1.md
### Stream Finder — Reverse-Engineered Architecture

---

## 30.1 Document Metadata

| Field | Value |
|---|---|
| Version | v1 |
| Status | Draft — Pending User Approval |
| Date Created | 2026-02-27 |
| Author | Claude (AI Architect) |
| Reviewed By | Pending |
| Source | Reverse-engineered from GitHub repository: BBultitude/Stream-Finder (v10.1) |

---

## 30.2 Executive Summary

Stream Finder is a single-page web application that enables users to discover movies and TV shows available on Australian streaming platforms. It is a fully client-side React 18 application with no backend, served via Nginx inside a Docker container running on a Raspberry Pi. All content data is sourced in real time from The Movie Database (TMDB) API v3. A Cloudflare Tunnel exposes the service publicly without port-forwarding. The application has no user accounts, no persistent storage, and no database. The TMDB API key is a shared public demo key hardcoded in the JavaScript source.

This document records the architecture as it exists at v10.1 and serves as the approved baseline for all future improvements.

---

## 30.3 System Overview

Stream Finder allows users to browse, filter, and search for movies and TV shows, view detail panels, and navigate to external platforms (IMDb, Rotten Tomatoes). It operates entirely in the browser: the Nginx container serves three static files (`index.html`, `app.js`, CDN-linked dependencies), and all TMDB API calls are made directly from the user's browser at runtime.

**System boundaries:**

- In scope: Static file serving, client-side React UI, TMDB API consumption, Cloudflare Tunnel routing.
- Out of scope: User authentication, persistence, server-side processing, any database.

---

## 30.4 Observed Requirements Summary

### Functional

| # | Behaviour | Description |
|---|---|---|
| F1 | Trending content | "What's Hot" tab — 100 trending items fetched weekly from TMDB |
| F2 | Recent releases | "What's New" tab — 100 items from last 6 months via TMDB discover |
| F3 | Browse all | Paginated browse of all content sorted by popularity |
| F4 | Real-time search | Instant search returning 20 results; clears tabs on activation |
| F5 | Streaming availability | Displays which Australian platforms carry each title |
| F6 | Service filter | Filter by Netflix, Stan, Prime Video, Disney+, Paramount+, Binge, Max |
| F7 | Genre filter | 14 genre categories, multi-select |
| F8 | Content type filter | Movies / TV Shows / All toggle |
| F9 | Detail view | Full-screen modal with synopsis, metadata, recommendations |
| F10 | Recommendations | TMDB recommendations API with fallback to similar API |
| F11 | External links | IMDb (fetched via external_ids API) and Rotten Tomatoes search |
| F12 | In-memory cache | 1-hour TTL cache; lost on page refresh |
| F13 | Deduplication | Cross-view deduplication of content items |

### Non-Functional

| # | Characteristic | Detail |
|---|---|---|
| N1 | Performance | ~60% API call reduction via in-memory caching |
| N2 | Availability | No SLA; single Pi, single container, no redundancy |
| N3 | Scalability | Not scalable; single-host, client-side only |
| N4 | Mobile responsiveness | Tailwind CSS responsive layout |
| N5 | TMDB rate limits | 40 requests per 10 seconds; mitigated by caching |

---

## 30.5 Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               React 18 SPA (app.js)                  │  │
│  │                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │  │
│  │  │  What's  │  │  What's  │  │    Browse All /   │  │  │
│  │  │   Hot    │  │   New    │  │      Search       │  │  │
│  │  └──────────┘  └──────────┘  └───────────────────┘  │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Filters: Service | Genre | Content Type        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌──────────────────────┐  ┌───────────────────────┐ │  │
│  │  │  Detail Modal        │  │  In-Memory Cache      │ │  │
│  │  │  (synopsis, recs,    │  │  (1-hour TTL,         │ │  │
│  │  │   IMDb, RT links)    │  │   lost on refresh)    │ │  │
│  │  └──────────────────────┘  └───────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Direct outbound calls to TMDB API (api.themoviedb.org)    │
│  Direct outbound calls to Tailwind CDN, React CDN          │
└─────────────────────────────────────────────────────────────┘
              │
              │ HTTPS (Cloudflare Tunnel)
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Raspberry Pi                           │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Docker Container                                  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Nginx (Alpine)                              │  │    │
│  │  │  Serves: index.html, app.js                  │  │    │
│  │  │  Port: 80 (mapped to host 8080)              │  │    │
│  │  │  Gzip compression enabled                    │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  cloudflared (Cloudflare Tunnel daemon)                     │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│         TMDB API (api.themoviedb.org/3)                     │
│  Endpoints used:                                            │
│  - /trending/all/week                                       │
│  - /discover/movie, /discover/tv                            │
│  - /search/multi                                            │
│  - /movie/{id}/recommendations                              │
│  - /movie/{id}/similar                                      │
│  - /movie/{id}/external_ids (IMDb ID lookup)                │
│  - /watch/providers (streaming availability)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 30.6 Components (Observed)

### 6.1 index.html
- **Purpose:** Application shell
- **Responsibilities:** Load React 18 and ReactDOM from CDN; load Tailwind CSS from CDN; mount React root; reference `app.js`
- **Dependencies:** React CDN, Tailwind CDN, `app.js`
- **Notes:** No build step — CDN-loaded at runtime

### 6.2 app.js
- **Purpose:** Entire application logic and UI
- **Responsibilities:** All React components, state management, TMDB API calls, filtering logic, caching, deduplication, routing between tabs and detail modal
- **Dependencies:** React 18 (globals from CDN), TMDB API
- **Notes:** Monolithic single file (~v10.1). TMDB API key is a hardcoded constant at the top of the file.

### 6.3 Nginx (Alpine)
- **Purpose:** Static file server
- **Responsibilities:** Serve `index.html` and `app.js`; gzip compression; handle 404s
- **Dependencies:** Docker, Alpine Linux
- **Port mapping:** Host 8080 → Container 80

### 6.4 Docker
- **Purpose:** Containerisation and deployment consistency
- **Responsibilities:** Package Nginx + static files; define restart policy (`always`)
- **Notes:** Single container, no orchestration (no Compose, no Kubernetes)

### 6.5 Cloudflare Tunnel (cloudflared)
- **Purpose:** Public HTTPS ingress without port-forwarding
- **Responsibilities:** Route inbound HTTPS traffic to localhost:8080 on the Pi
- **Notes:** Provides TLS termination and DDoS protection; not managed inside the repo

### 6.6 In-Memory Cache
- **Purpose:** Reduce TMDB API call volume
- **Responsibilities:** Cache API responses with 1-hour TTL using JavaScript Map or object in module scope
- **Limitations:** Wiped on page refresh; not shared across tabs; no persistence

---

## 30.7 Data Flow (Observed)

```
1. User opens browser → Cloudflare Tunnel → Nginx → serves index.html + app.js
2. Browser loads React + Tailwind from CDN
3. React app initialises → checks in-memory cache
4. On cache miss → browser calls TMDB API directly with hardcoded API key
5. TMDB returns JSON → React renders content cards
6. User clicks item → React renders detail modal → calls TMDB for external_ids
7. User clicks IMDb link → opens imdb.com in new tab
8. User clicks Rotten Tomatoes → opens RT search in new tab
9. All subsequent same-endpoint calls within 1 hour → served from in-memory cache
```

**Key characteristic:** There is no server-side proxy. The TMDB API key is visible to any user who inspects browser network traffic or the `app.js` source.

---

## 30.8 Data Model (Observed)

There is no database or persistent data model. All data is transient, sourced from TMDB at runtime.

**Runtime data structures (in-memory only):**

| Structure | Description |
|---|---|
| Cache Map | Key: TMDB API URL string. Value: `{ data, timestamp }`. TTL: 1 hour. |
| Content Items | Array of TMDB media objects: `{ id, title/name, media_type, poster_path, overview, release_date, genre_ids, vote_average }` |
| Provider Data | TMDB watch provider objects: `{ provider_id, provider_name, logo_path }` mapped to AU region |
| External IDs | `{ imdb_id }` fetched lazily when detail modal opens |

**No entities are persisted between sessions.**

---

## 30.9 Security Architecture (Observed)

| Area | Current State |
|---|---|
| Authentication | None — no user accounts |
| Authorisation | None — all content public |
| API Key Management | **Critical risk:** TMDB API key is a shared public demo key hardcoded in `app.js` and visible in the public GitHub repo and browser source |
| Transport Security | HTTPS provided by Cloudflare Tunnel (TLS termination at Cloudflare edge) |
| Content Security | No CSP headers observed (not configured in nginx.conf per README reference) |
| CORS | Not applicable — all calls are same-origin TMDB public API |
| Secrets Management | None — no `.env`, no secrets vault, no runtime injection |
| Dependency Security | React and Tailwind loaded from public CDN — no integrity hashes (SRI) observed |

**Threat considerations:**
- The shared TMDB API key can be revoked or rate-limited by any user discovering it
- CDN dependencies without SRI hashes create supply-chain risk
- No rate limiting or abuse protection on the Nginx layer

---

## 30.10 Non-Functional Architecture (Observed)

### Performance
- In-memory caching reduces TMDB calls by ~60%
- Multi-page batching for trending and discover endpoints
- Nginx gzip compression for static assets
- No server-side rendering — initial paint blocked until React + Tailwind CDN loads

### Scalability
- Not designed for scale
- Single Pi, single container, single process
- In-memory cache is per-user (browser) — no shared cache layer

### Reliability
- Docker `--restart always` provides container auto-restart
- No health checks defined
- No monitoring or alerting
- Single point of failure: the Raspberry Pi

### Observability
- `docker logs` for Nginx access logs
- Browser DevTools (F12) for API response times
- `docker stats` for container resource usage
- No structured logging, no metrics, no tracing

---

## 30.11 Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| UI Framework | React | 18 (CDN) | No build toolchain required; rapid iteration |
| Styling | Tailwind CSS | CDN | Utility-first; rapid UI development |
| Icons | Custom SVG | — | Lucide-inspired; no additional dependency |
| API | TMDB API | v3 | Free; comprehensive movie/TV data; AU streaming provider data |
| Web Server | Nginx | Alpine | Lightweight; minimal resource usage on Pi |
| Container | Docker | — | Consistent deployment; restart policy |
| Tunnel | Cloudflare Tunnel (cloudflared) | — | Public HTTPS without router config |
| Host | Raspberry Pi | Any Docker-capable model | Low-cost, always-on home server |
| Runtime | Browser (client-side only) | — | No backend runtime |

---

## 30.12 API Design (Observed)

Stream Finder consumes the TMDB API. It exposes no API of its own.

**TMDB endpoints consumed:**

| Endpoint | Usage | Tab/Feature |
|---|---|---|
| `GET /trending/all/week` | 100 trending items (5 pages) | What's Hot |
| `GET /discover/movie` | Recent releases, Browse All, provider filter | What's New, Browse All |
| `GET /discover/tv` | Recent releases, Browse All, provider filter | What's New, Browse All |
| `GET /search/multi` | Real-time search (20 results) | Search |
| `GET /movie/{id}/recommendations` | Similar content | Detail Modal |
| `GET /movie/{id}/similar` | Fallback if recommendations empty | Detail Modal |
| `GET /tv/{id}/recommendations` | Similar TV content | Detail Modal |
| `GET /movie/{id}/external_ids` | IMDb ID lookup | Detail Modal |
| `GET /tv/{id}/external_ids` | IMDb ID lookup | Detail Modal |
| `GET /movie/{id}/watch/providers` | AU streaming availability | Content Cards |
| `GET /tv/{id}/watch/providers` | AU streaming availability | Content Cards |

**Authentication:** API key passed as `?api_key=` query parameter on every request.

**No API is exposed by the application itself.**

---

## 30.13 Deployment Architecture

```
Local Development:
  Developer machine → Docker build → docker run -p 8080:80

Production (Raspberry Pi):
  1. git pull origin master (on Pi)
  2. docker build -t stream-finder:latest .
  3. docker stop/rm stream-finder
  4. docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
  5. cloudflared tunnel routes traffic to localhost:8080
  6. Cloudflare purge cache after update

No CI/CD pipeline exists — all deployments are manual.
No environment separation — same image and API key used locally and on Pi.
```

**Infrastructure components:**

| Component | Detail |
|---|---|
| Host OS | Raspberry Pi OS (Linux ARM) |
| Container runtime | Docker |
| Web server | Nginx Alpine (inside container) |
| Public ingress | Cloudflare Tunnel (cloudflared daemon on Pi) |
| DNS/TLS | Managed by Cloudflare |
| Port | Host 8080 → Container 80 |

---

## 30.14 Risks & Limitations

| # | Risk | Severity | Detail |
|---|---|---|---|
| R1 | API key exposed in source | **Critical** | Shared public demo key in `app.js` and public GitHub repo. Any user can inspect it. The key can be rate-limited or revoked at any time, taking the app offline. |
| R2 | No persistent cache | High | In-memory cache is wiped on every page refresh. Heavy TMDB API usage on each new session. Rate limiting risk. |
| R3 | Single point of failure | High | One Pi, one container, no redundancy. Pi failure = full outage. |
| R4 | No CDN integrity hashes | Medium | React and Tailwind loaded from CDN without SRI hashes. Compromised CDN = XSS attack surface. |
| R5 | No CI/CD | Medium | Manual deployment process is error-prone and inconsistent between local and production. |
| R6 | Monolithic app.js | Medium | All logic, state, components, and API calls in a single file. Difficult to test, maintain, or extend. |
| R7 | No error boundary handling | Medium | Unhandled TMDB API failures may cause silent UI failures or blank states. |
| R8 | TMDB streaming data accuracy | Low | Streaming availability data is sourced from TMDB, which may lag behind actual platform catalogues. |

---

## 30.15 Placeholders

No genuine build-time unknowns exist for this reverse-engineered baseline. All observable aspects of the system have been documented above.

---

## Approval Request

**Do you approve Design-v1.md as the baseline architecture for Stream Finder?**

Once approved:
- Design-v1.md will be locked and must not be modified
- All future architectural changes require a new Design-v2.md
- I will proceed to create Improvements.md aligned with your stated goals:
  - Persistent caching (IndexedDB)
  - Backend API + database
  - Server-side content caching with periodic updates for streaming availability and popularity data
