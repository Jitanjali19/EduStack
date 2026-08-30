# Project Plan & Progress

This document outlines the step-by-step development process of the course platform.

---

## Phase 1: Foundation (Completed)

- [x] Set up backend Express server and folder structure
- [x] Configure environment variables (`.env`, `.env.example`)
- [x] Connect MongoDB with connection status and error handling
- [x] Health check endpoint (`GET /api/health`)

---

## Phase 2: Core App Logic (Completed)

- [x] **User Registration & Login**: Password hashing with `bcryptjs` and token creation with `jsonwebtoken`
- [x] **Role-Based Access**: Middleware enforcing `instructor` vs `learner` permissions on protected routes
- [x] **Course Management (CRUD)**: Create course, edit details, archive, and restore
- [x] **Course Publish Rule**: Prevent publishing a course that has 0 lessons (Goal 4)
- [x] **Lesson Management**: Add, update, delete, and reorder lessons with sequential position numbering

---

## Phase 3: Enrollment & Progress Tracking (Completed)

- [x] **3.1 Enrollment Model & Routes**: 
  - Compound unique index (`userId` + `courseId`) to prevent duplicate enrollments
  - Enforce enrollment only on `published` courses (reject `draft` or `archived`)
  - Learner self-enrollment and instructor-managed enrollment
- [x] **3.2 Progress Tracking**:
  - State machine: `not_started` -> `in_progress` -> `completed`
  - Rejection of invalid backwards state transitions
  - Tracking `lastActivityAt` on every action for inactivity alerts (Goal 10)
- [x] **3.3 Course Completion Rules**:
  - Course only completes when all lessons in the course are finished
  - Automatic `completedAt` timestamp recording
  - Immutable activity history logging for all course events (Goal 9)
- [x] **3.4 Finding Courses & Enrollment Filtering (Goal 6)**:
  - 100% server-side search over titles and descriptions
  - Server-side filtering by category, status (instructors only), and instructor
  - Dynamic sorting by title, creation date, or total enrollment count
  - Pagination with total match counts

---

## Phase 4: Reporting, Bulk Actions & Alerts (Next)

- [x] **4.1 Dashboard Metrics (Goal 8)**: Total learners, published courses, completions this month, in-progress count, 8-week completion trend
- [x] **4.2 Bulk Enrollment (Goal 7)**: Paste/upload email addresses with per-address result report (`unknown`, `already_enrolled`, `enrolled`)
- [ ] **4.3 CSV Export (Goal 7)**: Export progress of all enrolled learners in a course as a downloadable CSV
- [ ] **4.4 Inactive Learner Alerts (Goal 10)**: Detect learners in `in_progress` with no activity for >14 days; badge count and dismiss/reappear flow

---

## Phase 5: Frontend UI & Final Polish

- [ ] Connect React frontend with modern UI design
- [ ] Authentication views (Login / Register)
- [ ] Instructor Course Studio & Lesson Builder
- [ ] Learner Course Catalog & Lesson Viewer
- [ ] Dashboard & Alerts UI
- [ ] Final testing, demo credentials, and submission documentation
