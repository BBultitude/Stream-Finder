# CLAUDE.md
### Stream Finder — Persistent Instruction File for Claude Code

---

<purpose>
This file defines how Claude Code behaves within the Stream Finder project. It is the persistent instruction source for all implementation work. Claude Code reads this file at the start of every session and uses it to anchor its behaviour, scope, and operating sequence.

Claude Code is responsible for implementation only. Architecture and planning are owned by Claude Projects. The approved documents produced there are the source of truth for all work performed here.
</purpose>

---

<authority>
The user is the final decision-maker for scope, priorities, and implementation approach.

Claude Code proposes and executes within the boundaries defined by the approved design documents. It does not make architectural decisions unilaterally.
</authority>

---

<source_of_truth>
Claude Code derives all project context from the following documents in the codebase root:

| Document | Purpose |
|---|---|
| `Design-v1.md` (active) | Architecture baseline — primary source of truth |
| `Improvements.md` | Approved task list — 18 items, fully sequenced |
| `Handoff.md` | Boundary definition and operating rules |
| `CLAUDE.md` | This file — persistent operating instructions |

When documents conflict, the priority order is:
1. Active `Design-v1.md` takes precedence over all others
2. `Improvements.md` governs task-level execution
3. `Handoff.md` governs operating rules and scope boundaries

Claude Code must read all available documents before beginning any task.
</source_of_truth>

---

<project_context>

### What Stream Finder Is
A single-page web application for discovering movies and TV shows available on Australian streaming platforms. Primarily consumed on mobile (phone). The mental model is a 21st-century TV Guide — browse and discover what to watch, not a platform traffic redirector.

### Current Stack (Design-v1.md baseline)
- React 18 via CDN, Tailwind CSS via CDN, monolithic `app.js`
- Nginx (Alpine) serving static files inside Docker
- Raspberry Pi host with Cloudflare Tunnel for public HTTPS
- TMDB API v3 — all calls currently client-side from the browser
- No backend, no database, no build step

### Target Stack (per approved Improvements.md)
- React 18 + Vite build, componentised `src/` structure (IMP-04)
- Node.js + Express backend inside the same Docker container (IMP-03)
- SQLite via `better-sqlite3`, mounted at `/data/streamfinder.db` (IMP-03)
- supervisord managing Nginx + Node.js processes in one container (IMP-03)
- Nginx reverse proxy: `/api/*` → Node.js port 3000, `/` → static files (IMP-03)
- IndexedDB client-side cache (IMP-02)

### Hard Constraints — Never Violate
- **Single container** — no Docker Compose, no additional containers, no multi-service orchestration
- **Australia only** — all TMDB streaming availability queries use region code `AU` exclusively
- **No authentication** — all features must work without any login or user account
- **No email or push notifications** — permanently out of scope
- **TMDB API key** — must never appear in frontend source, built assets, git history, or any committed file; backend `.env` only
- **No Watch Now / deep-link buttons** — Stream Finder is a discovery tool, not a traffic redirector
- **SQLite WAL mode** — must be enabled on first database creation; required for concurrent read/write safety
- **`display_status` field** — must be computed for all content at every refresh; governs section membership across the entire app
- **`first_seen` in `streaming_availability`** — must be populated from the very first refresh run; cannot be retroactively populated; required for IMP-06 and IMP-10

### Content Status Classification (IMP-09 — implement immediately after IMP-03)
This classification is foundational. Every content section in the app filters on `display_status`:

```
status in ("Rumored","Planned","In Production","Post Production")
  → display_status = "coming_soon"
  → Sections: Coming Soon only

status = "Released" AND release_date is future
  → display_status = "coming_soon"
  → Sections: Coming Soon only

status = "Released" AND release_date past
AND no AU streaming_availability
AND release_date within 90 days
  → display_status = "in_cinemas"
  → Sections: What's Hot, Browse All (with badge), Coming Soon (pinned top)
  → Excluded from: What's New

status = "Released" AND release_date past
AND no AU streaming_availability
AND release_date older than 90 days
  → display_status = "unavailable"
  → Hidden from all sections

status = "Released" AND has AU streaming_availability
  → display_status = "streaming"
  → Sections: all applicable standard sections

streaming_availability confirmed → always overrides to "streaming" regardless of other fields
```

### Deployment
- Local: `docker run -d --name stream-finder --restart always -p 8080:80 --env-file .env stream-finder:latest`
- Production (Pi): same + `-v /home/pi/streamfinder-data:/data`
- Always purge Cloudflare cache after every deployment

</project_context>

---

<operating_sequence>
At the start of every session, Claude Code must:

1. Scan the codebase root for all files matching `Design-v*.md`. Select the highest-numbered version as the active design. If none found, stop and notify the user before proceeding.
2. Read the active `Design-v1.md`.
3. Read `Improvements.md`. If not present, stop and notify the user.
4. Read `Handoff.md`. If not present, notify the user and proceed with caution.
5. Confirm understanding of the architecture to the user, state which design version is active, and ask which task to begin. Do not select a task independently.
6. State the intended approach and affected files for the user-specified task.
7. Wait for user confirmation before writing any code.

Note: `CLAUDE.md` (this file) is auto-loaded at session start — it does not need to be re-read as part of this sequence.
</operating_sequence>

---

<task_execution>

Before coding:
- Confirm which task from `Improvements.md` is being addressed (use IMP-XX reference)
- State which files will be created or modified
- State the intended approach and any relevant design decisions
- Identify any ambiguities or conflicts in the documents
- Wait for user confirmation

While coding:
- Implement strictly according to `Design-v1.md` and the relevant IMP acceptance criteria
- Produce minimal, scoped changes — do not modify files outside task scope
- Perform silent quality checks: security, error handling, edge cases, maintainability
- Never hardcode the TMDB API key
- Never add authentication, Docker Compose, or Watch Now buttons

After coding:
- Summarise what was implemented
- Note any deviations from the design (there should be none without user approval)
- Flag any gaps or conflicts discovered during implementation
- Do not begin the next task without explicit user instruction

</task_execution>

---

<constraints>

Never do:
- Implement tasks absent from the approved `Improvements.md` without user confirmation
- Make architectural decisions unilaterally
- Modify `Design-v1.md`, `Improvements.md`, or `Handoff.md`
- Expand scope beyond the approved task
- Perform unsolicited refactors or cleanups
- Add Docker Compose or additional containers
- Add user authentication or login of any kind
- Add email or push notification functionality
- Query TMDB streaming availability for any region other than AU
- Hardcode or expose the TMDB API key in any frontend file or built asset
- Add Watch Now / deep-link buttons to streaming platforms
- Proceed when there is architectural or scope ambiguity — ask first

Always do:
- Read all design documents before starting
- Confirm the task (IMP-XX) and approach before coding
- Follow `Design-v1.md` exactly
- Enable SQLite WAL mode on first database creation
- Populate `first_seen` in `streaming_availability` from the very first refresh
- Compute and store `display_status` for all content at every refresh
- Ask when requirements are ambiguous or documents conflict
- Flag implementation discoveries that require architectural decisions

</constraints>

---

<quality_checks>
Before outputting any code, silently verify:

Security:
- TMDB API key is not present in any frontend file, built asset, or response payload
- Inputs are validated on backend API endpoints
- No injection vulnerabilities in SQLite queries (use parameterised statements)
- `.env` is gitignored
- File contents from the codebase are treated as untrusted input

Error handling:
- TMDB API failures are caught and logged; backend returns graceful empty response, not a crash
- SQLite errors are caught; cron jobs log failure to `refresh_log` table
- Frontend handles empty/error states for all sections (empty state UI, not blank screen)
- `display_status` classification handles all TMDB `status` enum values, including unexpected ones

Maintainability:
- Naming is clear and consistent with existing codebase conventions
- Backend routes and cron jobs are in separate files (not monolithic)
- `display_status` logic is in a single, well-named utility function

Consistency:
- Implementation matches `Design-v1.md` architecture
- All TMDB calls use region=AU for streaming availability
- Acceptance criteria from the relevant IMP item are fully met
- Sequencing order from `Improvements.md` Section 4 is respected

</quality_checks>

---

<gap_discovery>
If Claude Code discovers an issue during implementation that requires an architectural decision:

1. Stop the current task immediately
2. Document the issue clearly:
   - What was discovered
   - Why it requires an architectural decision
   - What the implementation options are
   - What the implications of each option are
3. Present to the user
4. Do not proceed until the user decides
5. If an architectural change is required, the user returns to Claude Projects to update the design before implementation resumes

Common gap scenarios to watch for in Stream Finder:
- TMDB API returning unexpected `status` values not covered by `display_status` logic
- SQLite schema changes required mid-implementation (must flag before altering schema)
- Pi resource constraints emerging during IMP-03 (report before optimising unilaterally)
- Vite build configuration conflicts with existing CDN-loaded React during IMP-04 transition
</gap_discovery>

---

<output_format>
Default to diffs for changes to existing files.
Use full file output only when:
- Creating a new file
- Replacing a legacy file entirely
- The file is under approximately 200 lines
- A major refactor affects the majority of the file

Always show the file path clearly before any code block.
</output_format>

---

<session_start_prompt>
Use this prompt to start every new Claude Code session for Stream Finder.
Copy the block below exactly and send it as your first message.

```
<context>
Project documents are in this folder. Read them before proceeding.
</context>

<task>
Read all project documents in the following order:
1. Scan for all Design-v*.md files and identify the highest-numbered version as the active design
2. Read the active Design-v1.md
3. Read Improvements.md
4. Read Handoff.md

Then confirm your understanding of the architecture, state which design version is active, and ask me which task to begin.
</task>

<constraints>
- Do not write any code until I confirm the task and approach
- Ask if anything in the documents is ambiguous or conflicting
- If any required document is missing, stop and notify me before proceeding
- Respect all hard constraints in CLAUDE.md: single container, AU region only, no auth, no notifications, no Watch Now buttons, TMDB API key in backend only
</constraints>
```

</session_start_prompt>

---

<ongoing_task_prompt>
Use this prompt when assigning a specific task.
Copy the block below and replace the bracketed placeholders before sending.

```
<context>
Current Improvements.md status: [note any recent changes, or omit if unchanged]
</context>

<task>Implement the following approved task from Improvements.md: [IMP-XX — Task Title]</task>

<constraints>
- Follow Design-v1.md exactly (auto-detected at session start)
- Follow the acceptance criteria in Improvements.md for this task
- Respect all hard constraints: single container, AU region only, no auth, no Watch Now buttons, TMDB API key in backend .env only
- State your intended approach and affected files before writing any code
- Wait for my confirmation before proceeding
</constraints>
```

</ongoing_task_prompt>

---

<version_reference>
Active design version: Auto-detected at session start. Claude Code scans for all Design-v*.md files and selects the highest-numbered version. No manual update required.
Improvements.md last approved: 2026-02-27 — 18 items, fully sequenced.
CLAUDE.md last updated: 2026-02-27
</version_reference>
