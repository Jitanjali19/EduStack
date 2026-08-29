# Decisions

These are the main technical choices we made while building this project.

## Decision 1: Frontend

- **Chose:** React + Vite for the frontend.
- **Rejected:** A heavy multi-page setup or plain HTML without state management.
- **Why:** Vite is fast to start and build, and React components make building dynamic dashboards and progress bars simple.

## Decision 2: Backend

- **Chose:** Node.js with Express.
- **Rejected:** Serverless functions or embedding business logic into the frontend.
- **Why:** The backend is the central place to strictly enforce rules (role access, course publishing constraints, forward-only progress states).

## Decision 3: Database

- **Chose:** MongoDB with Mongoose.
- **Rejected:** SQL setup or in-memory array storage.
- **Why:** Flexible document schemas work well for course trees, lesson lists, activity logs, and many-to-many enrollments.

## Decision 4: Auth & Route Protection

- **Chose:** Explicit early-return checks in `authMiddleware` (returning clean 401/403 status immediately if token is missing or invalid).
- **Rejected:** Allowing `jwt.verify()` to throw unhandled errors into a generic global error handler.
- **Why:** Explicit checks make it clear why a request failed and prevent unnecessary execution.

## Decision 5: Course Finding & Search Logic (Goal 6)

- **Chose:** Server-side search, category/status filtering, dynamic sorting (by title, date, or enrollment count), and pagination via MongoDB aggregation.
- **Rejected:** Fetching all courses to the browser and filtering client-side.
- **Why:** Client-side filtering breaks at scale when thousands of courses exist. Server-side queries return only the requested page of data with exact total match counts.

## Decision 6: Progress Tracking & Course Completion Rules (Goal 4)

- **Chose:** Server-enforced forward-only state machine (`not_started` -> `in_progress` -> `completed`) driven by lesson completions.
- **Rejected:** Letting learners manually mark a course complete without finishing all its lessons.
- **Why:** Prevents skipping required material. Course completion is strictly verified on the backend by checking that all course lessons are completed.

## Decision 7: Activity Log Immutability (Goal 9)

- **Chose:** Mongoose middleware hooks on `ActivityLog` that block `updateOne`, `updateMany`, and `delete` operations.
- **Rejected:** Editable activity logs or soft-delete flags.
- **Why:** Audit history must be permanent and unchangeable by instructors and learners alike.
