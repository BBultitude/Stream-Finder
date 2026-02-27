# Handoff.md
### Stream Finder — Boundary Definition Between Claude Projects and Claude Code

---

## 1. Purpose

This document defines the boundary between Claude Projects and Claude Code for the Stream Finder project.

Claude Projects is responsible for design and planning only.
Claude Code is responsible for implementation only.

This boundary exists to:
- Protect architectural integrity
- Prevent implementation from outpacing approved design
- Ensure Claude Code always works from approved, complete documents
- Create a clear audit trail between decisions and code

---

## 2. What Belongs in Claude Projects

Claude Projects produces and owns:

| Document | Description |
|---|---|
| `Design-v1.md` | Reverse-engineered architecture baseline — source of truth for all implementation |
| `Improvements.md` | Approved task list, sequencing, and acceptance criteria (18 items) |
| `Handoff.md` | This file — boundary definition and operating rules |
| `CLAUDE.md` | Persistent instruction file for Claude Code |

Claude Projects does **not** produce code.
Claude Projects does **not** instruct Claude Code verbally — all instructions are encoded in documents.

---

## 3. What Belongs in Claude Code

Claude Code owns:
- Execution planning (derived from approved documents)
- Code implementation
- Testing and validation
- Refactoring (approved items only)

Claude Code does **not** make architectural decisions.
Claude Code does **not** modify `Design-v1.md` or `Improvements.md`.
Claude Code does **not** proceed past a gap without user approval.

---

## 4. Handoff Status

All handoff conditions are met:

- [x] `Design-v1.md` approved and locked
- [x] `Improvements.md` approved by user (18 improvements, fully sequenced)
- [x] `Handoff.md` current (this file)
- [x] `CLAUDE.md` present
- [x] No open questions remain in any document

---

## 5. Handoff Folder Contents

The following files must be present in the codebase root before Claude Code begins:

| File | Required | Notes |
|---|---|---|
| `Design-v1.md` | Yes | Active and only architecture version |
| `Improvements.md` | Yes | Approved — 18 items, sequenced |
| `Handoff.md` | Yes | This file |
| `CLAUDE.md` | Yes | Claude Code's persistent instruction file |

> **Codebase root** is the directory you launch Claude Code from — where you run `claude` in your terminal. For Stream Finder this is the root of the `Stream-Finder` repository, where `app.js`, `index.html`, `Dockerfile`, and `nginx.conf` live.

---

## 6. Active Design Detection

Claude Code automatically detects the active design at session start.

It scans the codebase root for all files matching `Design-v*.md`, extracts the version number, and selects the highest-numbered version as the active design.

**Current active design: `Design-v1.md`**

No manual version configuration is required. When a redesign produces `Design-v2.md`, Claude Code will auto-detect it at the next session start.

---

## 7. Project-Specific Context for Claude Code

### Technology Stack (Current)
- **Frontend:** React 18 via CDN, Tailwind CSS via CDN, single `app.js` file
- **Server:** Nginx (Alpine) inside Docker
- **Host:** Raspberry Pi with Cloudflare Tunnel
- **API:** TMDB API v3 (all calls currently client-side)
- **No backend, no database, no build step**

### Technology Stack (Target — per approved Improvements.md)
- **Frontend:** React 18 (Vite build, componentised — IMP-04)
- **Backend:** Node.js + Express inside same Docker container (IMP-03)
- **Database:** SQLite via `better-sqlite3`, volume-mounted at `/data/streamfinder.db` (IMP-03)
- **Process supervisor:** supervisord managing Nginx + Node.js (IMP-03)
- **Cache:** IndexedDB client-side (IMP-02)
- **Build:** Vite (IMP-04)

### Key Constraints Claude Code Must Respect
- **Single container** — no Docker Compose, no multi-container setup
- **Australia region only** — all TMDB streaming availability queries use `AU` region code
- **No user authentication** — all features must work without login
- **No email or push notifications** — out of scope
- **TMDB API key** — must never appear in frontend source, built assets, or version control; backend only via `.env`
- **SQLite WAL mode** — must be enabled from first deployment to handle concurrent reads/writes
- **`display_status` field** — must be computed and stored for all content to correctly gate section membership (see IMP-09)
- **`first_seen` field** — must be populated from first refresh in `streaming_availability` table; required for IMP-06 and IMP-10

### Improvement Implementation Order
Claude Code must implement improvements in the sequenced order defined in `Improvements.md` Section 4. Do not implement items out of sequence without explicit user approval. Key dependencies:
- IMP-09 depends on IMP-03
- IMP-18 depends on IMP-09 and IMP-05
- IMP-10 and IMP-06 require several weeks of backend snapshot data before badges are meaningful

### Deployment Context
- Local development: `docker run -d --name stream-finder --restart always -p 8080:80 --env-file .env stream-finder:latest`
- Production (Pi): same command with volume mount `-v /home/pi/streamfinder-data:/data`
- After deployment: always purge Cloudflare cache

---

## 8. Claude Code Operating Sequence

At the start of every session, Claude Code must:

1. Scan for all `Design-v*.md` files and identify the highest-numbered version as the active design
2. Read the active `Design-v1.md`
3. Read `Improvements.md`
4. Read `Handoff.md` (this file)
5. Confirm understanding of the architecture to the user, stating which design version is active
6. Ask the user which task to begin — do not select a task independently
7. State the intended approach and affected files for the user-specified task
8. Wait for user confirmation before writing any code

Note: `CLAUDE.md` is auto-loaded at session start before this sequence begins.

---

## 9. Conflict Resolution

When documents conflict, Claude Code must apply the following priority order:

1. Active `Design-v1.md` — takes precedence over all other documents
2. `Improvements.md` — governs task-level execution
3. `Handoff.md` — governs operating rules and scope boundaries

If a conflict cannot be resolved by this order, Claude Code must stop and present the conflict to the user before proceeding.

---

## 10. Gap Discovery Protocol

If Claude Code encounters an issue during implementation that requires an architectural decision, it must:

1. Stop the current task immediately
2. Document the gap clearly:
   - What was discovered
   - Why it requires an architectural decision
   - What the implementation options are
   - What the implications of each option are
3. Present the gap to the user
4. Wait for a decision — do not proceed

If the gap requires a design change, the user must return to Claude Projects to produce `Design-v2.md` before implementation resumes.

---

## 11. Scope Boundaries

Claude Code must not:

- Implement tasks absent from the approved `Improvements.md` without explicit user confirmation
- Make architectural decisions unilaterally
- Modify `Design-v1.md`, `Improvements.md`, or `Handoff.md`
- Expand scope beyond the approved task
- Perform unsolicited refactors or cleanups
- Add Docker Compose or additional containers — single container architecture is a hard constraint
- Add any user authentication or login system
- Add email or push notification functionality
- Use any streaming region other than AU
- Hardcode the TMDB API key anywhere in source code or built assets
- Proceed when documents are ambiguous — must ask first

---

## 12. Handoff Checklist

**Claude Projects (complete — ready for handoff):**
- [x] All requirements gathered and resolved
- [x] `Design-v1.md` approved and locked
- [x] `Improvements.md` approved by user
- [x] All 18 tasks in `Improvements.md` have acceptance criteria
- [x] No "TBD", blank fields, or open questions in any document

**Folder preparation (user action required before starting Claude Code):**
- [ ] `Design-v1.md` copied to Stream Finder codebase root
- [ ] `Improvements.md` copied to Stream Finder codebase root
- [ ] `Handoff.md` copied to Stream Finder codebase root
- [ ] `CLAUDE.md` copied to Stream Finder codebase root
- [ ] `.env` file created in codebase root with `TMDB_API_KEY=your_private_key_here`
- [ ] `.env` confirmed in `.gitignore`

**Claude Code session start:**
- [ ] Claude Code launched from the Stream Finder codebase root
- [ ] Active design version confirmed as `Design-v1.md`
- [ ] Architecture understanding confirmed before first task
- [ ] First task assigned: IMP-01 (API Key Security)

---

## 13. Returning to Claude Projects Mid-Implementation

If Claude Code surfaces a gap requiring an architectural decision:

1. Claude Code stops and documents the gap
2. User returns to Claude Projects with the gap description
3. ARCHITECT assesses whether a design change is required
4. If required: `Design-v2.md` produced and approved in Claude Projects
5. If not required: `Improvements.md` updated to address the gap
6. Updated documents copied to the codebase root
7. Claude Code resumes — auto-detects `Design-v2.md` at next session start

---

## 14. Version History

| Version | Date | Change |
|---|---|---|
| v1 | 2026-02-27 | Initial handoff document — Stream Finder brownfield project |
