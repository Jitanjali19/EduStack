# Technical Decisions & Architectural Choices

This document records key technical decisions made during development, what was chosen, what was rejected, why, and a decision that was later reversed.

---

## Decision 1: Frontend Framework

- **Chose**: React + Vite.
- **Rejected**: Multi-page server rendering (EJS/Pug) or raw vanilla JS without state management.
- **Why**: Vite provides fast HMR during development, and React components simplify state management for dynamic dashboard charts and enrollment rosters.

## Decision 2: Centralized Server-Side Enforcement

- **Chose**: Express backend middleware as the single authority for business rules.
- **Rejected**: Relying on frontend UI guards or client-side validation.
- **Why**: Server enforcement ensures role security, publishing checks, and progress state machine integrity cannot be bypassed via direct API calls (curl/Postman).

## Decision 3: Database & Document Modeling

- **Chose**: MongoDB with Mongoose ORM.
- **Rejected**: Relational SQL (PostgreSQL) or in-memory arrays.
- **Why**: Flexible document structures fit hierarchical course-lesson trees, activity log audit records, and dynamic learner progress tracking.

## Decision 4: Authentication & Route Protection

- **Chose**: Explicit early-return checks in `authMiddleware` returning 401/403 status immediately.
- **Rejected**: Letting `jwt.verify()` throw unhandled exceptions to global error middleware.
- **Why**: Explicit checks make failure reasons clear and prevent unnecessary route execution.

## Decision 5: Course Search, Filtering & Pagination (Goal 6)

- **Chose**: 100% server-side search, filtering, sorting, and pagination via MongoDB `$facet` aggregation.
- **Rejected**: Loading all courses into the browser and filtering client-side.
- **Why**: One decision I made was to keep search, filtering, sorting, and pagination on the server instead of doing it in React. It might have been simpler to fetch everything and filter on the client, but I rejected that approach because the dataset can grow significantly in a real company. Server-side pagination reduces the amount of data transferred and processed by the browser. The browser sends the search text, filters, sort choice, page number, and page size, and MongoDB returns only the required page, such as 10 courses.
- **Result**: Opening the page or choosing `All` loads the first 10 courses. Searching, filtering, sorting, or moving to another page sends a new API request. The backend also returns the total number of matching courses, so pagination stays accurate without loading the full dataset into React.

## Decision 6: Progress State Machine & Completion Rules (Goal 4 & 9)

- **Chose**: Server-enforced forward-only progress (`not_started` -> `in_progress` -> `completed`) validated against lesson completion.
- **Rejected**: Unrestricted progress updates or client-side self-reporting.
- **Why**: Prevents learners from skipping mandatory material or setting invalid progress states.

## Decision 7: Activity History Immutability (Goal 9)

- **Chose**: Mongoose pre-hooks on `ActivityLog` blocking `updateOne`, `updateMany`, `deleteOne`, and `deleteMany`.
- **Rejected**: Soft-deletes or mutable log records.
- **Why**: Guaranteeing permanent, non-rewritable audit history as required by Goal 9.

## Decision 8: Inactivity Alert Tracking (REVERSED)

- **Chose (Reversed)**: Initially designed a separate `Alert` collection to track active vs. dismissed alerts.
- **Reversed To**: Embedded `dismissedAt` timestamp directly inside the `Enrollment` model.
- **Why**: A separate collection required complex multi-collection joins (`$lookup`) between `User`, `Course`, `Enrollment`, and `Alert` just to compute inactivity alert counts. Embedding `dismissedAt` directly on `Enrollment` allowed single-pass querying of inactive learners (`lastActivityAt <= 14 days ago`) while seamlessly supporting alert reappearance (`lastActivityAt > dismissedAt`).

## Decision 9: Bulk Enrollment Modal Lifecycle & In-Modal Result Review (Goal 7)

- **Chose**: In-modal results view with decoupled parent dashboard metric refresh (only triggering dashboard re-fetch on modal dismissal/Done).
- **Rejected**: Immediately triggering full-page metric refetch (`fetchMetrics`) upon API response inside `handleSubmit`.
- **Why**: Goal 7 requires explicitly displaying the outcome per address (`enrolled`, `already_enrolled`, `unknown`). When `fetchMetrics` ran synchronously on API return, the dashboard showed a loading spinner and unmounted the modal before the instructor could inspect the per-learner audit list. Decoupling the review state allows instructors to examine the color-coded results, filter by status, and download the learner progress CSV before closing the modal.
