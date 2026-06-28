# Angscode v2 — Epic Breakdown

> Generated: 2026-06-28
> BMAD workflow: writing-plans → bmad-story-lean/full → using-git-worktrees → subagent-driven-dev → test-driven-dev → verification → review → merge

## Epic 1: Core Dashboard & Pipeline

**Goal:** Web dashboard dengan workflow scrape → ideas → approve → content production.

### Story 1-1: Fix Hashtag Route (Bug)
- **Status:** 🔴 Blocked — `/api/hashtags` route doesn't register in Express 5
- **Notes:** Workaround: rename to `/api/tags`. Root cause investigation pending.

### Story 1-2: Database & ORM Setup
- **Status:** ✅ Complete — Prisma schema, 10 tables, MySQL connected

### Story 1-3: Backend API (Sources, Ideas, Contents)
- **Status:** ✅ Complete — CRUD endpoints, approve workflow

### Story 1-4: Job Queue (BullMQ + Redis)
- **Status:** ✅ Complete — 3 workers: scrape, generate-ideas, produce-content

### Story 1-5: Frontend Dashboard UI
- **Status:** ✅ Complete — EJS + HTMX + skeuomorphic design system

### Story 1-6: Hashtag Management
- **Status:** 🔴 In Progress — DB table created, API done, UI needs final fix
- **Dependency:** 1-1

---

## Epic 2: Monetization Features

### Story 2-1: Content Repurposing Chain
- **Status:** ✅ Complete — Auto-adaptasi ke 5 platform

### Story 2-2: AI Trend Prediction
- **Status:** ✅ Complete — Velocity analysis, trending_topics table

### Story 2-3: Competitor Intelligence
- **Status:** ✅ Complete — Add/analyze competitors, AI insights

### Story 2-4: Auto-Publish Scheduler
- **Status:** 🔜 Not Started — Schedule + auto-post ke platform API

### Story 2-5: White-Label Analytics Reports
- **Status:** 🔜 Not Started — PDF reports branded

---

## Epic 3: Testing & Quality

### Story 3-1: Unit Tests — API Routes
- **Status:** 🔜 Not Started

### Story 3-2: Integration Tests — Pipeline Flow
- **Status:** 🔜 Not Started

### Story 3-3: E2E Tests — Dashboard Workflow
- **Status:** 🔜 Not Started

---

## Epic 4: Production Readiness

### Story 4-1: Error Handling & Logging
- **Status:** 🔜 Not Started

### Story 4-2: Rate Limiting & Security
- **Status:** 🔜 Not Started

### Story 4-3: Docker Deployment
- **Status:** 🔜 Not Started
