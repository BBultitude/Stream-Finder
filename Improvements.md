# Improvements.md
### Stream Finder — Continuous Improvement Plan

---

## 1. Document Metadata

| Field | Value |
|---|---|
| Date Created | 2026-02-27 |
| Author | Claude (AI Strategist) |
| Reviewed By | Pending |
| Active Architecture | Aligned with Design-v1.md |
| Status | Draft — Pending User Approval |

---

## 2. Summary of Current State

Stream Finder is a functional, client-side-only React SPA serving Australian streaming discovery via TMDB. It works well for its current use case but carries significant risks and structural limitations that constrain growth:

- **Critical security risk:** Shared public TMDB API key exposed in source code and public GitHub repo
- **No persistence:** All cache lost on page refresh; heavy API usage per session
- **No backend:** All TMDB calls made directly from the browser; no ability to pre-fetch, store, or enrich data
- **Monolithic codebase:** All logic in a single `app.js` — hard to test, extend, or maintain
- **No CI/CD:** Manual deployment; no environment separation between local dev and production

Improvements are organised into four tiers: Security → Core Architecture → Enhancement → Polish.

---

## 3. Improvements List

---

### IMP-01 — Secure the TMDB API Key

**Category:** Security

**Description:**
Remove the hardcoded shared public TMDB API key from `app.js` and the public GitHub repo. Replace with the owner's private TMDB API key injected via environment variable at container runtime. The key must never appear in source code or version control.

**Motivation:**
The current shared demo key is visible to anyone inspecting browser source or the public GitHub repo. It can be rate-limited or revoked at any time by any user, causing a full outage. It also exposes the app to quota abuse by third parties.

**Impact:**
- Eliminates the most critical operational and security risk
- Prevents quota exhaustion by third parties
- Enables the app to function reliably under a private, controlled API key

**Dependencies:** None — implement immediately, independent of everything else

**Risks:** Low. Docker environment variable injection is standard. Once IMP-03 (backend) is complete, the key moves fully server-side and this improvement is superseded.

**Priority:** High — do this before anything else

**Acceptance Criteria:**
- No API key present in `app.js`, `index.html`, or any committed file
- API key injected via `--env-file .env` at Docker runtime
- `.env` is gitignored
- GitHub repo history scrubbed of any committed key
- App functions correctly with private key in both local and Pi environments

---

### IMP-02 — Persistent Client-Side Caching (IndexedDB)

**Category:** Technical Debt / Feature

**Description:**
Replace the current in-memory JavaScript cache (lost on every page refresh) with IndexedDB-backed persistent caching. Cache API responses with configurable TTLs so returning users see content immediately without triggering new API calls.

**Motivation:**
Every page refresh currently triggers a full TMDB API fetch cycle, wasting quota, increasing load time, and risking rate limiting. IndexedDB persists across page refreshes and browser sessions.

**Impact:**
- Near-instant content load for returning users on cache hit
- Significant reduction in TMDB API calls
- Reduced rate-limiting risk
- Better experience on mobile and low-bandwidth connections

**Dependencies:**
- IMP-01 (API key secured first)
- Once IMP-03 (backend) is live, this becomes a cache of backend responses rather than TMDB directly

**Risks:**
- IndexedDB storage limits vary by browser/OS — implement LRU eviction on write
- Stale data risk if TTLs are too long — tune per content type

**Recommended TTLs:**

| Content Type | TTL |
|---|---|
| Trending (What's Hot) | 6 hours |
| What's New | 12 hours |
| Browse All (per page) | 6 hours |
| Search results | 30 minutes |
| Detail view | 24 hours |
| Streaming availability | 24 hours |

**Priority:** High

**Acceptance Criteria:**
- IndexedDB cache service implemented with TTL per content type
- Cache hit skips all API calls
- Cache miss fetches, renders, and stores result
- Cache entries expire correctly and trigger re-fetch
- Cache survives page refresh and browser restart
- LRU eviction prevents unbounded storage growth

---

### IMP-03 — Backend API + SQLite Database (Single Container)

**Category:** Architecture

**Description:**
Introduce a Node.js + Express backend inside the existing Docker container alongside Nginx. The backend proxies and enriches TMDB data, stores content metadata and streaming availability in a SQLite database (volume-mounted for persistence), and refreshes data on a schedule via node-cron. Nginx is reconfigured to serve static files directly and proxy `/api/*` requests to Node.js internally. Single container — no Docker Compose required.

**Motivation:**
- Moves the TMDB API key fully server-side — permanently removed from the browser
- Shared server-side cache benefits all users, not just the current browser session
- Scheduled refresh means users never trigger live TMDB calls
- SQLite runs in-process with Node — no separate container or service
- Foundation for all future stateful features

**Impact:**
- API key permanently removed from browser and source
- All users get a warm shared cache
- Deployment stays a single `docker run` command

**Dependencies:**
- IMP-01 (key management; backend supersedes it entirely once live)

**Container Architecture:**

```
┌─────────────────────────────────────────────────────┐
│  Docker Container                                   │
│                                                     │
│  Nginx (port 80 — inbound)                          │
│    ├── /        → serves React SPA (static files)   │
│    └── /api/*   → proxy_pass to localhost:3000      │
│                                                     │
│  Node.js + Express (port 3000 — internal only)      │
│    ├── REST API endpoints                           │
│    ├── TMDB scheduled refresh (node-cron)           │
│    └── SQLite via better-sqlite3                    │
│                                                     │
│  SQLite: /data/streamfinder.db                      │
└─────────────────────────────────────────────────────┘
         │ Docker volume mount
         ▼
/home/pi/streamfinder-data/streamfinder.db
```

**Data Schema:**

| Table | Key Columns |
|---|---|
| `content` | id (TMDB), media_type, title, overview, poster_path, release_date, vote_average, popularity, last_updated |
| `genres` | id, name |
| `content_genres` | content_id, genre_id |
| `providers` | provider_id, provider_name, logo_path |
| `streaming_availability` | content_id, provider_id, region, type (flatrate/rent/buy), first_seen, last_confirmed |
| `refresh_log` | job_name, last_run, status, records_updated |

Note: `first_seen` on `streaming_availability` must be captured from day one to enable IMP-07 ("New on Platform" badges) without a schema rebuild later.

**Refresh Schedule:**

| Data | Frequency | Trigger |
|---|---|---|
| Trending / popularity | Every 6 hours | node-cron |
| What's New | Every 12 hours | node-cron |
| Streaming availability | Every 24 hours | node-cron |
| Content detail / metadata | First request, then every 7 days | Lazy + scheduled sweep |

**Updated docker run:**
```
docker run -d \
  --name stream-finder \
  --restart always \
  -p 8080:80 \
  -v /home/pi/streamfinder-data:/data \
  --env-file .env \
  stream-finder:latest
```

**Risks:**
- Running two processes in one container requires a process supervisor (supervisord) — adds Dockerfile complexity but is an accepted trade-off for a single-host home project
- SQLite write locking during concurrent refresh jobs and API requests — mitigated by enabling WAL mode
- Largest effort item — implement on a feature branch; test locally before deploying to Pi

**Priority:** High — foundational for all future improvements

**Acceptance Criteria:**
- Node.js backend running inside container alongside Nginx via supervisord
- Nginx proxies `/api/*` to Node.js port 3000
- Frontend calls `/api/*` only — zero direct TMDB calls from browser
- TMDB API key in `.env` only — never in source or built assets
- SQLite persists on Docker volume across container rebuilds
- WAL mode enabled on SQLite
- Scheduled cron jobs refresh all data types per schedule above
- Endpoints: `GET /api/trending`, `/api/new`, `/api/browse`, `/api/search`, `/api/detail/:type/:id`, `/api/providers`
- API returns DB-cached data within 200ms
- `refresh_log` updated after every cron run

---

### IMP-04 — App.js Componentisation (Refactor)

**Category:** Refactor

**Description:**
Break the monolithic `app.js` into a proper React component structure with separate files for the API service layer, cache service, and individual UI components (ContentCard, DetailModal, FilterBar, TabNav, WatchlistTab). Introduce a Vite build step to support module imports.

**Motivation:**
The current single-file structure makes the codebase increasingly difficult to extend, debug, and maintain. All future feature work will be significantly cleaner with a modular structure.

**Impact:**
- Dramatically improved maintainability
- Enables proper unit testing
- Clean separation of API, cache, and UI concerns
- Faster development iteration

**Dependencies:**
- Best sequenced after IMP-03 is scoped, so the API service layer is designed for the backend from the start
- Dockerfile must be updated to include a Vite build stage

**Risks:** Medium effort — regression risk during refactor; do on a feature branch with thorough manual testing

**Priority:** Medium

**Acceptance Criteria:**
- `app.js` replaced by a `src/` directory with logical component and service structure
- API calls isolated in `src/services/apiService.js`
- Cache logic isolated in `src/services/cacheService.js`
- Vite build configured; Dockerfile updated to build and serve `dist/`
- Application behaviour identical to pre-refactor
- No regressions in filtering, search, detail modal, or caching

---

### IMP-05 — Watchlist / Favourites

**Category:** Feature

**Description:**
Allow users to save movies and TV shows to a personal watchlist stored in IndexedDB. No login required. A dedicated Watchlist tab displays saved items with the ability to remove them individually or in bulk.

**Motivation:**
There is currently no way to save content of interest. Users must re-search or re-browse every visit. A no-login watchlist is the highest-value UX improvement for a phone-first app — zero friction, works immediately.

**Impact:**
- Significant UX improvement for returning users
- Increases return visit value
- No authentication complexity

**Dependencies:**
- IMP-02 (IndexedDB infrastructure in place)
- IMP-04 (componentisation makes this much cleaner to implement)

**Risks:**
- Watchlist is device/browser-specific — must clearly communicate to users that clearing browser storage removes it
- If user accounts are added in future, a migration path from local to server-side watchlist must be designed at that time

**Priority:** Medium

**Acceptance Criteria:**
- "Add to Watchlist" / "Remove" toggle on every content card and detail modal
- Visual indicator (filled icon) showing saved status on cards
- Watchlist tab shows all saved items with poster, title, type, and platform badges
- Bulk clear option available
- Item count badge on Watchlist tab label
- Persists across page refreshes and browser restarts
- Empty state with prompt to browse when watchlist is empty

---

### IMP-06 — "New on [Platform]" Badges

**Category:** Feature

**Description:**
Display a "New on Netflix", "New on Stan" (etc.) badge on content cards for titles where streaming availability was first observed within the last 7 days. Powered by the `first_seen` field in the backend's `streaming_availability` table.

**Motivation:**
"What's New" in the app is based on release date — not when a title became available to stream. A 2022 film arriving on Stan today is new and valuable to surface. This is a distinction TMDB does not make and differentiates Stream Finder from a plain TMDB wrapper.

**Impact:**
- Meaningfully differentiates Stream Finder from a basic TMDB wrapper
- High value for users subscribed to specific platforms

**Dependencies:**
- IMP-03 (backend capturing `first_seen` from day one)

**Risks:**
- TMDB has no "date added to platform" field — backend must infer it from availability snapshot comparisons
- `first_seen` must be populated correctly from IMP-03's first deployment; there is no retroactive data

**Priority:** Low — depends on IMP-03 being live and populated

**Acceptance Criteria:**
- "New on [Platform]" badge visible on content cards where `first_seen` ≤ 7 days ago
- Badge shown on detail modal
- Badge automatically disappears after 7 days
- Badge shown only for the specific platform(s) where availability is new, not all platforms

---

### IMP-07 — Search Improvements

**Category:** Feature / Polish

**Description:**
Three targeted improvements: (1) increase search results from 20 to 50, (2) add 300ms debounce to the real-time search input, (3) store the last 10 searches in IndexedDB and display as suggestions on input focus.

**Motivation:**
20 results is frequently insufficient. Firing a search request on every keystroke is wasteful. Search history reduces friction for returning users, particularly on mobile.

**Impact:**
- Better search coverage
- Reduced backend call volume
- Improved mobile UX

**Dependencies:**
- IMP-02 (IndexedDB for search history)
- IMP-03 (backend search endpoint, result count configurable server-side)

**Risks:** Low — all are incremental, isolated changes

**Priority:** Low

**Acceptance Criteria:**
- Search returns up to 50 results
- 300ms debounce on input before API call fires
- Last 10 searches persisted in IndexedDB, shown as dropdown on input focus
- Search history individually dismissible and bulk clearable
- History survives page refresh

---

### IMP-08 — CI/CD Pipeline (GitHub Actions)

**Category:** Technical Debt

**Description:**
Implement a basic GitHub Actions pipeline: lint on pull requests, build the Docker image on push to `master`, optionally push the built image to GitHub Container Registry (GHCR) for Pi deployment via `docker pull`.

**Motivation:**
All deployments are currently manual shell commands on the Pi with no validation before they reach production. A CI pipeline catches errors early.

**Impact:**
- Prevents broken code reaching production
- Reproducible, auditable deployments
- Reduces deployment friction

**Dependencies:**
- IMP-04 (componentisation gives the linter meaningful structure to validate)

**Risks:**
- Pull-based deployment to the Pi (Pi polls GHCR or triggered via webhook) requires additional setup beyond the Actions workflow

**Priority:** Low

**Acceptance Criteria:**
- GitHub Actions workflow triggers on every PR and push to `master`
- Steps: lint → build Docker image → pass/fail reported on PR
- Failed builds block merge
- Optional: successful `master` build pushes image to GHCR

---

### IMP-09 — Content Status Classification: Coming Soon, In Cinemas, and Watchable Filtering

**Category:** Feature / Data

**Description:**
Introduce a `display_status` classification field on all content, computed by the backend from TMDB `status`, `release_date`, and `streaming_availability`. This classification drives badge display, section membership, and critically — filters unreleased content out of What's Hot, What's New, and Browse All entirely.

**Motivation:**
TMDB trending and discover endpoints include unreleased and in-production titles. These appear in What's Hot and Browse All today but are not watchable, which is misleading in a discovery app built around the TV Guide concept. A "Coming Soon" section gives unreleased content a proper home, and the classification logic ensures every other section contains only content users can actually watch or see in cinemas right now.

**Classification Logic:**

```
TMDB status field values and their mappings:

"Rumored", "Planned", "In Production",
"Post Production"
  → display_status = "coming_soon"
  → Excluded from What's Hot, What's New, Browse All
  → Included in Coming Soon section only

"Released" AND release_date is in the future
  → display_status = "coming_soon"
  → Excluded from all watchable sections
  → Included in Coming Soon section only

"Released" AND release_date is past
AND no AU streaming_availability
AND release_date within last 90 days
  → display_status = "in_cinemas"
  → Shown in What's Hot / Browse All with "In Cinemas" badge
  → Excluded from What's New (which is streaming-arrival focused)
  → Included in Coming Soon section as "Now Showing"

"Released" AND release_date is past
AND no AU streaming_availability
AND release_date older than 90 days
  → display_status = "unavailable"
  → Hidden from all sections (data gap — not streaming, not in cinemas)

"Released" AND has AU streaming_availability
  → display_status = "streaming"
  → Normal content — appears in all applicable sections
```

**Schema addition:**
Add `display_status` column to `content` table. Computed and stored at each refresh. Overridden to `"streaming"` immediately when `streaming_availability` is confirmed, regardless of other fields.

**Impact:**
- What's Hot, What's New, Browse All contain only content users can actually watch
- "In Cinemas" titles visible in What's Hot with clear badge so users know they can't stream yet
- Coming Soon has a proper home as its own section (see IMP-18)
- Eliminates the confusing blank platform state for all content types
- No third-party cinema API required — derived entirely from existing TMDB data

**Dependencies:**
- IMP-03 (backend computes and stores `display_status`; schema update required)

**Risks:**
- TMDB `status` is not always updated promptly — titles may linger as "In Post Production" past their actual release; the `release_date` check acts as the fallback signal
- 90-day theatrical window is a heuristic — streaming availability appearing is always the override, regardless of window
- Some direct-to-streaming titles skip cinemas entirely; they will correctly move from `coming_soon` to `streaming` when availability is confirmed with no `in_cinemas` phase

**Priority:** Medium — implement immediately after IMP-03 is live

**Acceptance Criteria:**
- `display_status` field computed and stored for all content at every refresh
- What's Hot, What's New, and Browse All exclude all `coming_soon` and `unavailable` content
- `in_cinemas` content appears in What's Hot and Browse All with a visually distinct "In Cinemas" badge (film reel icon, distinct colour)
- `in_cinemas` content excluded from What's New
- `coming_soon` content appears only in the Coming Soon section (IMP-18)
- `display_status` overridden to `streaming` immediately when AU streaming availability is confirmed
- Detail modal for `in_cinemas` titles states "Currently showing in Australian cinemas — not yet available to stream"
- Detail modal for `coming_soon` titles states "Not yet released" with the expected release date where available
- Badge does not appear if release date is older than 90 days and still no streaming (treat as data gap, show nothing)

---

### IMP-10 — "Leaving Soon" Badges

**Category:** Feature / Data

**Description:**
Flag titles that have disappeared from a platform's streaming availability in the most recent refresh cycle with a "Leaving [Platform]" badge. The backend detects this by comparing `last_confirmed` against the current refresh timestamp — if a title was confirmed last cycle but not this cycle, it is flagged as leaving.

**Motivation:**
"Leaving Soon" is one of the highest-engagement features on Netflix, Stan, and Disney+ because it creates urgency. Users actively seek out content they might lose access to. Stream Finder's backend snapshot model makes this detectable without any additional TMDB API calls.

**Impact:**
- High engagement feature — urgency drives return visits
- No additional data source needed — derived from existing refresh logic
- Differentiates Stream Finder significantly from a plain TMDB wrapper

**Dependencies:**
- IMP-03 (backend `streaming_availability` with `last_confirmed` tracking)

**Risks:**
- False positives possible if TMDB temporarily fails to return a provider in a refresh cycle — add a 2-cycle grace period before flagging as leaving (i.e., must be missing from 2 consecutive refreshes)
- "Leaving" date is not known — can only say "may be leaving" not "leaving on [date]"

**Priority:** Medium (requires IMP-03 to be mature with several weeks of data)

**Acceptance Criteria:**
- "Leaving [Platform]" badge displayed on cards and detail modal
- Badge triggered only after 2 consecutive refresh cycles show no availability (grace period)
- Badge shown per platform — a title leaving Netflix but staying on Stan shows only the Netflix leaving badge
- Badge removed if availability is re-confirmed in a subsequent refresh
- Detail modal notes "This title may be leaving [Platform] soon"

---

### IMP-11 — "Top 10 in Australia" Section

**Category:** Feature

**Description:**
Add a "Top 10 in Australia" section or tab displaying the top 10 trending titles filtered to content with Australian streaming availability. Sourced from TMDB trending data already fetched by the backend, filtered against the `streaming_availability` table for the AU region.

**Motivation:**
Netflix's "Top 10 in Australia Today" is one of their most-used discovery features. Stream Finder already has all the data needed to replicate this — trending content ranked by TMDB popularity, filtered to titles actually available to stream in Australia. No additional API calls required.

**Impact:**
- High-engagement, easily scannable feature
- Gives users an immediate answer to "what should I watch tonight"
- Zero additional data cost — derived from existing backend data

**Dependencies:**
- IMP-03 (backend joins trending popularity with AU streaming availability)

**Risks:** Low — entirely derived from existing data

**Priority:** Medium

**Acceptance Criteria:**
- "Top 10" section displays exactly 10 titles ranked by TMDB popularity
- All titles shown must have confirmed AU streaming availability
- Refreshed every 6 hours alongside trending data
- Displayed as a ranked list (numbered 1–10) with platform badges visible
- Filterable by content type (Movies / TV / All)

---

### IMP-12 — Skeleton Loading Screens

**Category:** UI / Performance

**Description:**
Replace blank/spinner loading states with skeleton screens — grey placeholder shapes matching the card layout that animate while content loads. Applied to the content grid, detail modal, and the Top 10 section.

**Motivation:**
Skeleton screens make the app feel significantly faster because the layout is visible immediately and content populates progressively. This is standard on Netflix, JustWatch, and every major streaming platform. Especially important on mobile where network latency is variable.

**Impact:**
- Perceived performance improvement — app feels faster without any actual speed change
- Eliminates jarring blank-to-content transitions
- Professional, polished feel

**Dependencies:**
- IMP-04 (componentisation makes skeleton states clean to implement per component)

**Risks:** Low — purely additive UI change

**Priority:** Medium

**Acceptance Criteria:**
- Skeleton cards shown in the content grid during initial load and filter changes
- Skeleton state shown in detail modal while data loads
- Skeleton matches the actual card/modal dimensions to prevent layout shift on load
- Skeleton animation is a subtle shimmer (CSS animation)
- Skeletons replaced by real content smoothly without flash

---

### IMP-13 — Mobile Bottom Navigation Bar

**Category:** UI / Usability

**Description:**
Replace the current top tab bar with a fixed bottom navigation bar on mobile viewports (screens under 768px). Tabs: Home (What's Hot), New, Browse, Watchlist, Search. Filter panel converted to a bottom sheet that slides up from the bottom of the screen on tap, rather than rendering inline and pushing content down.

**Motivation:**
Bottom navigation is the standard mobile pattern (used by Netflix, Stan, Disney+, JustWatch apps) because it is reachable with one thumb. Top tabs and inline filter panels are desktop conventions that create friction on phone-sized screens, which is the primary consumption device for Stream Finder.

**Impact:**
- Dramatically improved one-handed usability on mobile
- Filter panel no longer disrupts scroll position
- Navigation tabs always visible and reachable

**Dependencies:**
- IMP-04 (componentisation makes layout restructuring clean)

**Risks:**
- Bottom nav overlaps content — page content must account for bottom bar height in its bottom padding
- Must gracefully fall back to top navigation on desktop/tablet viewports

**Priority:** Medium

**Acceptance Criteria:**
- Bottom navigation bar visible on viewports under 768px with 5 tabs: Home, New, Browse, Watchlist, Search
- Active tab clearly indicated with filled icon and label
- Top tab bar hidden on mobile viewports; retained on desktop
- Filter panel rendered as a bottom sheet on mobile (slides up, dismissible by tap outside or swipe down)
- Content grid bottom padding accounts for nav bar height to prevent content obscuring

---

### IMP-14 — Trailer Button in Detail Modal

**Category:** Feature / Data

**Description:**
Add a "Watch Trailer" button to the detail modal that opens the official trailer on YouTube in a new tab. Trailer keys fetched from TMDB `/movie/{id}/videos` and `/tv/{id}/videos`, stored in the backend's content detail cache. The button only appears when a trailer is available.

**Motivation:**
The trailer is the single highest-value action in a streaming discovery app after finding where to watch. It answers "is this worth my time?" before committing to a platform. JustWatch reports trailer plays as their most-used detail view interaction. Fits the TV Guide model — you'd check a trailer before deciding what to watch tonight.

**Impact:**
- Significant detail view engagement improvement
- Helps users make faster watch decisions
- No platform deep-linking required — opens YouTube, which everyone has

**Dependencies:**
- IMP-03 (backend fetches and stores video data alongside content detail)

**Risks:**
- Not all content has trailers on TMDB — button must be conditionally shown
- YouTube links can go dead if videos are removed — backend should verify on periodic refresh

**Priority:** Medium

**Acceptance Criteria:**
- "Watch Trailer" button appears in detail modal when a TMDB trailer key is available
- Button opens `https://www.youtube.com/watch?v={key}` in a new tab
- Button does not appear when no trailer is available
- Trailer key stored in backend content detail; refreshed every 7 days with content metadata
- Falls back to the first available "Teaser" if no trailer type is found

---

### IMP-15 — Runtime, Episode Count, and AU Age Rating on Cards and Detail

**Category:** Feature / Data

**Description:**
Surface three additional data points from TMDB on content cards and the detail modal: (1) runtime for movies (e.g., "1h 58m"), (2) season/episode count for TV shows (e.g., "3 Seasons · 24 Episodes"), (3) Australian age classification from TMDB certification data (G, PG, M, MA15+, R18+).

**Motivation:**
These three data points are present on every streaming platform's card and detail view because they are the primary decision-making signals — "Is this too long for tonight?", "How many seasons am I committing to?", "Is this appropriate for who's watching?" They require no additional API calls beyond what the backend already fetches for detail data.

**Impact:**
- Faster watch decisions without opening the detail modal
- Immediate appropriateness signal (age rating) visible on the card
- Aligns Stream Finder with the information density of the platforms it tracks

**Dependencies:**
- IMP-03 (backend fetches and stores `runtime`, `number_of_seasons`, `number_of_episodes`, and AU certification)

**Risks:**
- AU certification data is inconsistently populated in TMDB — show only when available, omit when not
- Runtime missing for some TV episodes — fall back to "X Seasons" only when episode count unavailable

**Priority:** Medium

**Acceptance Criteria:**
- Movie cards show runtime (e.g., "1h 58m") when available
- TV cards show season count (e.g., "3 Seasons") when available
- Detail modal shows full runtime or season/episode breakdown
- AU age classification badge (G / PG / M / MA15+ / R18+) shown on cards and detail modal when available
- All three fields omitted gracefully when TMDB data is missing — no blank labels

---

### IMP-16 — Cast Section in Detail Modal

**Category:** Feature / Data

**Description:**
Add a horizontally scrollable cast row to the detail modal showing the top 6 cast members with their TMDB profile photo, name, and character name. Fetched from TMDB `/movie/{id}/credits` and `/tv/{id}/credits`, stored in the backend content detail cache.

**Motivation:**
Cast is a primary discovery vector — users often decide what to watch based on who's in it. It is present on every streaming platform, JustWatch, Google, and IMDB. It also enables a future feature: tapping a cast member to see other titles they appear in that are available to stream in Australia.

**Impact:**
- Richer detail view with minimal additional data cost
- Enables future cast-based discovery filtering
- Brings detail view to parity with what users expect from streaming platforms

**Dependencies:**
- IMP-03 (backend fetches and stores credits alongside content detail)
- IMP-04 (componentisation makes a reusable CastRow component clean)

**Risks:**
- Profile photos not available for all cast members — fall back to a person placeholder icon
- Some content (especially older titles) has incomplete cast data in TMDB

**Priority:** Medium

**Acceptance Criteria:**
- Horizontally scrollable cast row in detail modal showing top 6 cast members
- Each cast card shows: profile photo (or placeholder), actor name, character name
- Row only shown when cast data is available (minimum 1 member)
- Photos use TMDB image API with appropriate size parameter for mobile
- Tapping a cast member is a no-op for now (future: filter by cast)

---

### IMP-17 — Decade Filter and Enhanced Filter Set

**Category:** Feature / UX

**Description:**
Add a decade filter to the existing filter bar (1980s, 1990s, 2000s, 2010s, 2020s) derived from `release_date` in the content table. Also add a minimum rating filter (e.g., "7+ on TMDB") and a "Subscription only" toggle that hides rent/buy results and shows only flatrate streaming titles.

**Motivation:**
Decade browsing is a high-engagement discovery pattern — users frequently want to revisit a particular era. JustWatch's decade filter is one of their most-used secondary filters. The subscription toggle directly addresses the TV Guide use case: "show me only what I can watch tonight with what I already pay for."

**Impact:**
- More targeted discovery for specific user intents
- "Subscription only" filter is highly practical for cost-conscious users
- Decade browsing drives engagement from users with nostalgic or era-specific tastes

**Dependencies:**
- IMP-03 (backend filters by `release_date` decade and `streaming_availability.type = 'flatrate'`)

**Risks:**
- Filter combinations (decade + genre + service + rating + subscription) can return very small result sets — empty state handling must be clear and helpful

**Priority:** Low

**Acceptance Criteria:**
- Decade filter added to filter bar: 1970s, 1980s, 1990s, 2000s, 2010s, 2020s (only decades with results shown)
- Minimum rating filter: Any / 6+ / 7+ / 8+
- "Subscription only" toggle hides all content where the only availability is rent or buy
- All filters combinable with existing service and genre filters
- Empty state shows "No results for these filters" with a "Clear filters" prompt
- Active filter count badge shown on the filter button so users know filters are applied

---

### IMP-18 — "Coming Soon" Section

**Category:** Feature

**Description:**
Add a dedicated "Coming Soon" tab/section displaying all content classified as `coming_soon` by the backend — titles in production, post-production, or with a future release date. Each card shows the expected release date (or "Date TBC" where unknown), a "Coming Soon" badge, and the ability to add the title to the Watchlist so users can be reminded when it becomes available.

**Motivation:**
Unreleased content already appears in TMDB trending data and will continue to surface in backend refreshes. Without a Coming Soon section, this content has nowhere to go except being excluded entirely. Giving it a dedicated section surfaces anticipated titles, drives watchlist engagement ("save it now, watch it when it drops"), and completes the full content lifecycle: Coming Soon → In Cinemas → Streaming.

**Content Lifecycle:**

```
Coming Soon section          → title announced or in production
Coming Soon (Now Showing)    → released, in cinemas, not yet streaming
What's Hot / Browse All      → streaming or in cinemas
Leaves all sections          → unavailable (older than 90 days, no streaming)
```

**Sorting in Coming Soon:**
- Titles with a known future release date: sorted ascending by release date (soonest first)
- Titles without a confirmed release date: sorted by TMDB popularity descending (most anticipated first)
- "Now Showing in Cinemas" titles pinned to the top of the Coming Soon section as a sub-group

**Impact:**
- Completes the full content lifecycle — no content falls into a confusing void
- Drives watchlist engagement for anticipated titles
- Surfaces high-anticipation content (TMDB tracks popularity for unreleased titles)
- "Now Showing" sub-group gives cinema-goers a useful discovery view

**Dependencies:**
- IMP-09 (backend `display_status` classification required)
- IMP-05 (Watchlist — "Save for when it streams" CTA on Coming Soon cards)

**Risks:**
- Release dates frequently change — must display as approximate and refresh regularly
- Some titles remain "In Production" in TMDB for years without a release date; a stale Coming Soon section erodes trust — consider hiding titles with no release date update in over 6 months

**Priority:** Medium

**Acceptance Criteria:**
- "Coming Soon" tab visible in navigation (bottom nav on mobile, tab bar on desktop)
- Cards display: poster, title, expected release date or "Date TBC", "Coming Soon" badge
- "Now Showing in Cinemas" titles displayed as a pinned sub-group at the top with "In Cinemas" badge
- Sorting: known release date ascending, then unknown date by popularity descending
- Titles with no release date update in over 6 months hidden from Coming Soon (configurable threshold)
- "Add to Watchlist" available on all Coming Soon cards
- When a Coming Soon title gains AU streaming availability, it is removed from Coming Soon and appears in standard sections at next refresh
- Detail modal for Coming Soon titles shows expected release date, production status, and trailer if available
- Filterable by content type (Movies / TV)

---

### IMP-19 — Coming Soon Segmented Control

**Category:** UI

**Description:** Replaces the dual stacked "Now Showing in Cinemas" / "Coming Soon" sections in the Coming Soon tab with a pill segmented control. Users toggle between Streaming (upcoming on streaming) and Cinemas (currently in cinemas) views.

**Motivation:** The stacked layout was visually noisy — users interested only in upcoming streaming titles had to scroll past irrelevant cinema content.

**Impact:** Cleaner Coming Soon tab; each view is focused and scannable.

**Dependencies:** IMP-18

**Risks:** None — local `useState` only, no backend changes.

**Priority:** Low

**Acceptance Criteria:**
- Default view shows only `display_status === 'coming_soon'` items
- Cinemas view shows only `display_status === 'in_cinemas'` items
- Empty state shown per-view if no items exist for that status

---

### IMP-20 — Age Rating Filter (AU Classification)

**Category:** Feature

**Description:** Adds an AU classification ceiling filter to Browse. Selecting a rating (e.g. PG) returns all content rated G or PG. Implemented via `maxCertification` query param on `/api/browse`, resolved via `certsUpTo()` in `backend/utils/certOrder.js`.

**Motivation:** No certification-based filtering existed. Parents and users with content preferences need to filter by audience suitability, not just TMDB vote average.

**Impact:** Browse results filterable by AU age rating; `certOrder.js` utility reusable for future cert-aware queries.

**Dependencies:** IMP-03, IMP-13

**Risks:** Certification string values in DB must match `AU_CERT_ORDER` exactly — verify with `SELECT DISTINCT certification FROM content` after first deployment.

**Priority:** Medium

**Acceptance Criteria:**
- `GET /api/browse?maxCertification=PG` returns only G and PG content
- FilterSheet shows Age Rating chip row (G / PG / M / MA15+ / R18+), single-select, toggleable off
- Filter count badge on mobile includes age rating selection
- Clear All resets `selectedMaxCertification` to null

---

### IMP-21 — Filter Sheet Compact Redesign

**Category:** UI

**Description:** Reduces FilterSheet button padding and font size across all filter sections (`py-1.5 px-2.5 text-xs`). Section labels changed to `text-xs uppercase tracking-wide`. Fits more filter options without internal scrolling on small phones.

**Motivation:** Previous button sizing (`py-2 px-4`) made the sheet feel heavy and required excessive scrolling on 375px-wide screens.

**Impact:** More filter options visible without scrolling; overall sheet feels lighter.

**Dependencies:** IMP-13

**Risks:** None.

**Priority:** Low

**Acceptance Criteria:**
- All filter sections visible with minimal scroll on a 375px viewport
- Buttons remain tap-friendly (minimum 28px touch target)

---

### IMP-22 — Backend Reliability + Security Hardening

**Category:** Technical / Security

**Description:** Four reliability fixes and two security improvements:
- `detail.js`: `external_ids` TMDB call gets individual `.catch` so a single API failure doesn't 500 the whole detail response
- `server.js`: `startCronJobs()` runs unconditionally (was chained in `.then()`)
- `refresh.js`: Per-job `running` lock prevents overlapping cron executions; initial refresh runs jobs independently
- `search.js`: Per-IP sliding-window rate limiter (10 req/min); conditional braces fix (S2681)
- `server.js`: `app.disable('x-powered-by')` suppresses Express version disclosure

**Motivation:** Silent cron failures and cascading TMDB errors were operational blind spots on the Raspberry Pi deployment. Rate limiting protects TMDB API quota.

**Impact:** More resilient backend; cron jobs always start; detail responses degrade gracefully; search endpoint protected.

**Dependencies:** IMP-03

**Risks:** None — all changes are additive guards or fallback handlers.

**Priority:** High

**Acceptance Criteria:**
- Container restart with empty DB: all cron jobs start even if initial populate fails
- Failing TMDB `external_ids` call: detail endpoint still returns 200 with `imdb_id: null`
- Search after 10 requests in 60s from same IP: returns 429
- No `X-Powered-By` header on any API response

---

### IMP-23 — Dynamic Language / Region Filter

**Category:** Feature / UX

**Description:**
Replaces the static hardcoded language filter (which included a broken "Mainstream" exclude operation masquerading as an include) with a data-driven include filter. A new `/api/languages` endpoint returns which `original_language` values are actually present in the DB for streaming content, ordered by frequency. FilterBar and FilterSheet render language buttons dynamically, mapped to human-readable labels (Japanese, Hindi, Korean, etc.) with ISO code fallback for unknowns. All filter buttons are true positive include filters — selecting "Korean" returns only Korean content.

Also fixes two bugs in the What's New section:
- Added `sa.type = 'flatrate'` to the `new.js` JOIN so rent/buy-only content no longer appears without a "New on Platform" badge
- Replaced `SELECT DISTINCT ... ORDER BY sa.first_seen DESC` with `GROUP BY c.id, c.media_type ORDER BY MAX(sa.first_seen) DESC` to fix ambiguous ordering

**Status:** COMPLETE (implemented 2026-06-21)

**Dependencies:** IMP-03 (backend DB with `original_language` column populated by refresh jobs)

**Acceptance Criteria (met):**
- `GET /api/languages` returns distinct `original_language` values with counts, ordered by frequency
- Language filter buttons rendered dynamically — no hardcoded list maintenance required
- All filter values are positive include filters; selecting `ko` returns only Korean content
- Unknown ISO codes fall back to uppercase display (e.g. `nb` → `NB`)
- What's New section: every card shows "New on [Platform]" badge (flatrate-only content)
- What's New section: ordered by most recently added flatrate availability

---

### IMP-24 — SonarQube Code Quality Fixes

**Category:** Technical / Maintenance

**Description:** Resolved all open SonarQube findings to clear the quality gate (was failing on `new_violations: 2` and `new_duplicated_lines_density: 3.43%` against a 3% threshold):
- `backend/db.js`: migration catch block now re-throws any non-"duplicate column name" error instead of silently swallowing all exceptions (S2486)
- `src/App.jsx`: filter count ternary changed from `!== null ? 1 : 0` to `=== null ? 0 : 1` to match surrounding positive-condition pattern (S7735)
- `src/services/idbUtils.js` (new): shared `createOpenDb(dbName, dbVersion, storeName, keyPath)` factory eliminates 19-line duplicate `openDb()` implementation between `cacheService.js` and `searchHistoryService.js`
- `src/components/FilterBar.jsx`: shared filter propTypes extracted into exported `filterPropTypes` object; `FilterSheet.jsx` spreads it, eliminating 17-line duplicate propTypes block

**Status:** COMPLETE (implemented 2026-06-21)

**Dependencies:** None

**Acceptance Criteria (met):**
- SonarQube quality gate: PASSED
- `new_violations`: 0
- `new_duplicated_lines_density`: below 3%
- Vite build succeeds with no errors

---

## 4. Sequencing

| Order | Item | Rationale |
|---|---|---|
| 1 | IMP-01 — API Key Security | Critical risk; one-day task; no dependencies; do today |
| 2 | IMP-02 — IndexedDB Cache | High value; no backend needed; immediately improves reliability |
| 3 | IMP-03 — Backend + SQLite | Core architecture; enables all future stateful features |
| 4 | IMP-09 — Content Status Classification | Implement immediately after IMP-03; corrects misleading content in all sections |
| 5 | IMP-11 — Top 10 in Australia | Derived from existing data; no new API calls |
| 6 | IMP-15 — Runtime, Episodes, Age Rating | Data already fetched; display improvement only |
| 7 | IMP-14 — Trailer Button | High value; one new TMDB endpoint per content item |
| 8 | IMP-04 — Componentisation | Enables clean development of remaining features |
| 9 | IMP-12 — Skeleton Loading | Additive UI; clean to implement post-componentisation |
| 10 | IMP-13 — Mobile Bottom Nav | Layout restructure; cleaner post-componentisation |
| 11 | IMP-05 — Watchlist | Depends on IndexedDB and componentisation |
| 12 | IMP-18 — Coming Soon Section | Depends on IMP-09 classification and IMP-05 Watchlist |
| 13 | IMP-16 — Cast in Detail Modal | Enrichment; depends on backend and componentisation |
| 14 | IMP-10 — Leaving Soon Badges | Needs several weeks of backend snapshot data to be meaningful |
| 15 | IMP-06 — New on Platform Badges | Same — needs mature backend snapshot history |
| 16 | IMP-17 — Decade + Enhanced Filters | Polish; implement once core feature set is stable |
| 17 | IMP-07 — Search Improvements | Low-effort polish once core architecture is stable |
| 18 | IMP-08 — CI/CD | Quality of life; implement after componentisation |
| 19 | IMP-22 — Backend Reliability + Security | Hardening; implement after core feature set is stable |
| 20 | IMP-19 — Coming Soon Segmented Control | UI polish; depends on IMP-18 |
| 21 | IMP-21 — FilterSheet Compact Redesign | UI polish; depends on IMP-13 |
| 22 | IMP-20 — Age Rating Filter | New filter capability; depends on IMP-03 and IMP-13 |
| 23 | IMP-23 — Dynamic Language / Region Filter | COMPLETE — data-driven include filter; replaced exclude-based static list |
| 24 | IMP-24 — SonarQube Code Quality | COMPLETE — cleared quality gate; fixed empty catch, negated condition, and two duplication blocks |



| Order | Item | Rationale |
|---|---|---|
| 1 | IMP-01 — API Key Security | Critical risk; one-day task; no dependencies; do today |
| 2 | IMP-02 — IndexedDB Cache | High value; no backend needed; immediately improves reliability |
| 3 | IMP-03 — Backend + SQLite | Core architecture; enables all future stateful features |
| 4 | IMP-04 — Componentisation | Enables clean feature development; do after backend is scoped |
| 5 | IMP-05 — Watchlist | High-value UX; depends on IndexedDB and componentisation |
| 6 | IMP-06 — New on Platform | Depends on backend availability data maturing |
| 7 | IMP-07 — Search Improvements | Low-effort polish once core architecture is stable |
| 8 | IMP-08 — CI/CD | Quality of life; implement after componentisation |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| TMDB API key revoked before IMP-01 is complete | High | Medium | Implement IMP-01 today — it is a one-day task |
| Pi resource constraints with Node + SQLite in one container | High | Low | Pi 4/5 with 2GB+ RAM handles this comfortably; benchmark before IMP-03 deployment |
| SQLite write contention between cron jobs and API requests | Medium | Medium | Enable WAL mode on SQLite from first deployment |
| IndexedDB quota exceeded on mobile | Medium | Low | LRU eviction on cache writes; communicate storage use to user |
| Backend refactor introduces regressions | Medium | Medium | Feature branch; test on local before Pi deployment |
| Schema insufficient for IMP-06 | Medium | Low | Capture `first_seen` in `streaming_availability` from IMP-03 day one |
| Cloudflare serving stale frontend after deployment | Low | High | Always purge Cloudflare cache post-deployment; add to deployment checklist |

---

## 6. Long-Term Roadmap (Deferred / Aspirational)

These items are noted for future consideration but are not in the current improvement plan.

| Item | Notes |
|---|---|
| User authentication + profiles | Optional future addition. The current no-login, instant-access experience is intentional and preferred. If added later, it must not disrupt the frictionless first-use model — authentication should be opt-in, not a gate. |
| React Native mobile app | Viable once IMP-03 (backend API) is stable. The backend becomes the shared API for both web and mobile — not a rewrite, an extension. React Native enables home screen install, push notifications, and better offline behaviour than a browser PWA. Given Stream Finder is primarily consumed on a phone, this is a meaningful long-term upgrade. |
| Offline mode (PWA / Service Worker) | Service Worker caching of last-known content for browsing without internet. Lighter-weight alternative to React Native for offline support. |
| GraphQL API layer | Upgrade path from REST backend; defer until REST is proven stable and feature-complete |
| Rotten Tomatoes / Metacritic score enrichment | Aggregate third-party scores stored and refreshed server-side; supplements TMDB ratings |
