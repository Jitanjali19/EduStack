# Project Plan & Progress

This document outlines the step-by-step development process, session breakdown, time estimates, and prioritization of the course platform.

---

## Session Breakdown & Implementation Phases

### Phase 1: Foundation (Completed)
- [x] Set up backend Express server and folder structure
- [x] Configure environment variables (`.env`, `.env.example`)
- [x] Connect MongoDB with connection status and error handling
- [x] Health check endpoint (`GET /api/health`)

### Phase 2: Core App Logic (Completed)
- [x] **User Registration & Login**: Password hashing with `bcryptjs` and token creation with `jsonwebtoken`
- [x] **Role-Based Access**: Middleware enforcing `instructor` vs `learner` permissions on protected routes
- [x] **Course Management (CRUD)**: Create course, edit details, archive, and restore
- [x] **Course Publish Rule**: Prevent publishing a course that has 0 lessons (Goal 4)
- [x] **Lesson Management**: Add, update, delete, and reorder lessons with sequential position numbering

### Phase 3: Enrollment & Progress Tracking (Completed)
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

### Phase 4: Reporting, Bulk Actions & Alerts (Completed)
- [x] **4.1 Dashboard Metrics (Goal 8)**: Total learners, published courses, completions this month, in-progress count, 8-week completion trend
- [x] **4.2 Bulk Enrollment (Goal 7)**: Paste/upload email addresses with per-address result report (`unknown`, `already_enrolled`, `enrolled`)
- [x] **4.3 CSV Export (Goal 7)**: Export progress of all enrolled learners in a course as a downloadable CSV
- [x] **4.4 Inactive Learner Alerts (Goal 10)**: Detect learners in `in_progress` with no activity for >14 days; badge count and dismiss/reappear flow

### Phase 5: Final Polish & Verification (Completed)
- [x] Final testing, code cleanup (removal of all commented-out code and comment lines)
- [x] Schema & architectural documentation synchronization
- [x] Demo credentials and submission checklist in `SUBMISSION.md`

---

## Development Retrospective & Planning Answers

### 1. How work was split into sessions
Development was split into 5 distinct sessions across the week:
- **Session 1 (2 hrs)**: Foundation & Authentication (Phase 1 & Phase 2 Auth)
- **Session 2 (2.5 hrs)**: Course & Lesson CRUD + Publishing Rules (Phase 2 Core)
- **Session 3 (2.5 hrs)**: Enrollment, Progress State Machine & Immutable Activity Logs (Phase 3)
- **Session 4 (2 hrs)**: Server-side Search, Filtering, Sorting & Pagination (Phase 3.4 & Phase 4 Metrics)
- **Session 5 (1 hr)**: Bulk Enrollment, CSV Exports, Inactivity Alerts & Documentation Polish (Phase 4 & 5)

### 2. What order was built in and why
We built in backend-first, data-model order:
1. **Foundation & Auth**: User roles and token verification must exist before protecting any course endpoints.
2. **Course & Lesson CRUD**: Courses and lessons form the core domain data required for enrollments.
3. **Enrollment & Progress State Machine**: Progress logic depends directly on course/lesson models.
4. **Search, Reporting & Alerts**: Aggregations and alerts depend on populated enrollment and user activity data.
Building in this order avoided refactoring data structures mid-way.

### 3. Estimated vs Actual Time
- **Estimated Total**: 12 hours
- **Actual Total**: 10 hours
  - *Phase 1 & 2*: Estimated 4 hrs, Actual 4.5 hrs (extra time spent on publishing constraint validation).
  - *Phase 3*: Estimated 3 hrs, Actual 2.5 hrs (mongoose schema hooks simplified activity logging).
  - *Phase 4*: Estimated 3 hrs, Actual 2 hrs (reused enrollment helper functions for bulk processing).
  - *Phase 5*: Estimated 2 hrs, Actual 1 hr (focused verification and documentation sync).

### 4. What was cut when running short
We deliberately cut stretch features (quizzes, completion certificates, video watch tracking) to ensure that 100% of the 10 core requirements were met with strict, production-ready server validation and zero commented-out code.
