# Submission

## Links

- **GitHub repository:** https://github.com/Jitanjali19/course-platform
- **Live application:** http://localhost:5000

## Notes for the reviewer

The backend API server strictly enforces all business rules, role-based security, state transitions, course publishing constraints, bulk enrollment parsing, CSV exports, and inactivity alert logic.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Instructor | instructor@example.com | Password123! |
| Learner | learner@example.com | Password123! |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React + Vite | Fast setup, reactive component model |
| Backend | Node.js + Express | Strict central business rule validation and REST API routing |
| Database | MongoDB + Mongoose | Schema validation, indexes, and document aggregations |
| Hosting | Render / Local | Free tier deployment |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Server-enforced instructor vs learner permissions via JWT middleware |
| 2 | Courses | Done | Create, edit, archive, and restore course lifecycle |
| 3 | Lessons inside courses | Done | Ordered lesson CRUD within parent courses |
| 4 | Course and progress states | Done | Draft -> Published -> Archived lifecycle and Not Started -> In Progress -> Completed learner progress machine |
| 5 | Enrollment | Done | Learner self-enrollment and instructor enrollment |
| 6 | Finding courses | Done | 100% server-side search, filtering, dynamic sorting, and pagination |
| 7 | Bulk enrollment & CSV export | Done | Bulk email enrollment reporting and progress CSV download |
| 8 | A dashboard | Done | Headline stats, course progress breakdown, and 8-week completion trend |
| 9 | History you cannot rewrite | Done | Immutable ActivityLog model preventing edits/deletes |
| 10 | Inactivity alerts | Done | Inactivity (>14 days) detection, badge count, and dismiss/reappear flow |

## How much time did you actually spend?

Approximately 10 hours across structured phases.

## What would you do next, with another 12 hours?

Add interactive lesson quiz scoring, automated certificate generation on completion, and lesson video progress tracking.

## What are you least happy with in this codebase, and why?

In-memory weekly aggregation for 8-week trend data could be converted into pure MongoDB pipeline `$bucket` aggregation for maximum throughput at 100x scale.
