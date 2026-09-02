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
- [x] **4.2 Bulk Enrollment (Goal 7)**:
  - Dual-mode input: Paste (multi-delimiter regex) & File Upload (.csv and .txt drag-and-drop)
  - Strict per-address outcome classification (`enrolled`, `already_enrolled`, `unknown`)
  - Color-coded audit badges, interactive status filter tabs, and email search
  - Modal lifecycle preservation (avoiding destructive parent unmount during review)
- [x] **4.3 CSV Export (Goal 7)**: Export progress of all enrolled learners in a course as a downloadable CSV with proper HTTP headers and escaping
- [x] **4.4 Inactive Learner Alerts (Goal 10)**: Detect learners in `in_progress` with no activity for >14 days; badge count and dismiss/reappear flow

### Phase 5: Final Polish & Verification (Completed)

- [x] Final testing, code cleanup (removal of all commented-out code and comment lines)
- [x] Schema & architectural documentation synchronization
- [x] Demo credentials and submission checklist in `SUBMISSION.md`

### Phase 6: Responsibility, Recovery & Deployment Fixes (Completed)

- [x] Removed course Draft/Publish/Archive/Restore controls from the Admin Console.
- [x] Removed admin course moderation API routes so admins cannot change course lifecycle directly.
- [x] Kept course lifecycle actions in instructor-owned routes with role and ownership checks.
- [x] Added logged-in password change with current-password verification.
- [x] Added forgot-password and reset-password flow using a one-time hashed token.
- [x] Removed SMTP/nodemailer so the local demo generates a reset link directly.
- [x] Added Vercel SPA rewrite so direct React Router routes do not return `404 NOT_FOUND`.
- [x] Updated documentation with the problems, decisions, and validation results.

### Server-side course listing work

I kept the Courses page small and simple for the user, but made the data work on the server. The page sends the current search, category, status, sort order, page number, and page size to the API. The backend applies these options in MongoDB and sends back only the matching courses for that page.

I chose this because the project should still work if a company has a very large course library. It might have been simpler to fetch every course and filter it in React, but I rejected that approach because the dataset can grow significantly. Server-side pagination reduces the amount of data transferred and processed by the browser. With this approach, the first page contains 10 courses, and the browser asks for another page only when the user clicks Next.

This also keeps the total result count correct after a search or filter. The user can see how many courses match without React downloading and processing all records.

---

## Development Retrospective & Planning Answers

### 1. How work was split into sessions

Development was split into 5 distinct sessions across the week:

- **Session 1 (2 hrs)**: Foundation & Authentication (Phase 1 & Phase 2 Auth)
- **Session 2 (2.5 hrs)**: Course & Lesson CRUD + Publishing Rules (Phase 2 Core)
- **Session 3 (2.5 hrs)**: Enrollment, Progress State Machine & Immutable Activity Logs (Phase 3)
- **Session 4 (2 hrs)**: Server-side Search, Filtering, Sorting & Pagination (Phase 3.4 & Phase 4 Metrics)
- **Session 5 (1.5 hrs)**: Bulk Enrollment, CSV Exports, Inactivity Alerts, Modal Lifecycle Bugfix & Documentation Polish (Phase 4 & 5)

### 2. What order was built in and why

We built in backend-first, data-model order:

1. **Foundation & Auth**: User roles and token verification must exist before protecting any course endpoints.
2. **Course & Lesson CRUD**: Courses and lessons form the core domain data required for enrollments.
3. **Enrollment & Progress State Machine**: Progress logic depends directly on course/lesson models.
4. **Search, Reporting & Alerts**: Aggregations and alerts depend on populated enrollment and user activity data.
5. **Bulk Operations & Export**: Built on top of single enrollment primitives, with dedicated UI review states and CSV streaming.
   Building in this order avoided refactoring data structures mid-way.

### 3. Estimated vs Actual Time

- **Estimated Total**: 12 hours
- **Actual Total**: 10.5 hours
  - _Phase 1 & 2_: Estimated 4 hrs, Actual 4.5 hrs (extra time spent on publishing constraint validation).
  - _Phase 3_: Estimated 3 hrs, Actual 2.5 hrs (mongoose schema hooks simplified activity logging).
  - _Phase 4_: Estimated 3 hrs, Actual 2.5 hrs (extra time spent resolving React modal unmounting lifecycle and bulk CSV file parsing).
  - _Phase 5_: Estimated 2 hrs, Actual 1 hr (focused verification and documentation sync).

### 4. What was cut when running short

We deliberately cut stretch features (quizzes, completion certificates, video watch tracking) to ensure that 100% of the 10 core requirements were met with strict, production-ready server validation and zero commented-out code.

### 5. What I considered for large data

I deliberately spent time on server-side listing because this is the part that would matter most when the app grows. At small scale, client-side filtering can look easier, but it would create a problem later. A large dataset would make the browser download too much data and make search and sorting slower. The current design gives MongoDB the heavy work and keeps the browser response limited to one page.

### 6. Problems found after the first working version

- **Admin had too much course control**: The Admin Console showed moderation buttons even though instructors should manage their own courses. I removed those controls and the matching admin endpoints, then kept instructor ownership checks in the course routes.
- **Forgot-password depended on email infrastructure**: SMTP would have required provider settings and credentials just to demonstrate the feature locally. I changed it to return a short-lived reset link directly, with a hashed token stored in MongoDB.
- **Vercel refresh returned 404**: React Router routes worked after navigating inside the app, but Vercel did not know that `/dashboard` was a client-side route on a fresh request. Adding the frontend rewrite to `/index.html` fixed direct access and refreshes.
- **Validation commands sometimes ran from the wrong folder**: The package files are inside `frontend` and `backend`, so commands from the repository root gave misleading path errors. Running each command from its owning folder gave the correct result.
- **Existing lint warnings**: Full frontend lint still reports older unrelated issues in files such as `ActivityLogModal`, `AuthContext`, and `AdminPage`. The changed password and routing files have no diagnostics, and the production build passes.
