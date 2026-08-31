# AI prompts

We used AI to help plan the project and speed up the setup. Below is the real list of prompts we used.

## 1. Understand the assignment

### Prompt

"Explain the course platform assignment in simple language. Tell me the 10 required goals, the stack, and the build order I should follow."

### What we got

A clear summary of the business problem and the list of things the app must do.

### What we corrected

We focused only on the required 10 features and ignored stretch ideas at first.

## 2. Design the project architecture

### Prompt

"Create a simple architecture for a course platform with React, Node, Express, and MongoDB. Explain how frontend, backend, and database connect."

### What we got

A simple architecture with frontend, API, and database layers.

### What we corrected

We made sure role checks and course rules stay in the backend, not only in the UI.

## 3. Plan the build

### Prompt

"Break this project into phases with a timeline and a clean order of implementation."

### What we got

A phase-by-phase plan for setup, auth, courses, enrollment, dashboard, and alerts.

### What we corrected

We changed the order so auth and course rules come before UI work.

## 4. Plan database schema

### Prompt

"Design the database schema for users, courses, lessons, enrollment, progress, alerts, and activity logs."

### What we got

A basic structure for the main tables and relationships.

### What we corrected

We kept the logic simple and clear, with separate records for progress and activity history.

## 5. Setup project foundation

### Prompt

"Set up the frontend and backend stack for a Node + Express + MongoDB course project."

### What we got

React + Vite frontend and backend dependency setup.

### What we corrected

We corrected PowerShell command issues and then ran the setup properly.

## 6. Build auth flow

### Prompt

"Create a clean login and register flow with JWT and role-based access."

### What I got
Copilot's first suggestion checked for the token but didn't return
early — it let the request continue to jwt.verify() even when the
Authorization header was missing entirely, which threw an unhandled
error instead of a clean response.

### What I corrected
I added an explicit check at the top of the middleware: if no
Authorization header (or no token after splitting "Bearer <token>"),
return res.status(401).json({ message: "No token, access denied" })
immediately, before calling jwt.verify(). This way an unauthenticated
request gets a proper 401/403 response instead of a server crash or
an unclear error.

## 7. Bulk Enrollment & Learner Progress CSV Export (Goal 7)

### Prompt

"Implement bulk enrollment for instructors to paste or upload email lists, classify per-address status (enrolled, already_enrolled, unknown), and export learner progress as CSV."

### What I got
The initial code had several serious issues during testing:
1. **Missing File Upload**: Only had a basic `<textarea>` without any CSV or TXT file upload or drag-and-drop support.
2. **Modal Reset / Vanishing Results**: On clicking "Start Bulk Enrollment", the code immediately called the parent's `onComplete()` callback inside `handleSubmit()`. This triggered `fetchMetrics()` with `setLoading(true)`, which unmounted the dashboard and destroyed the modal before the instructor could ever see the results screen.
3. **White Screen Crash**: Encountered an `Uncaught ReferenceError: detectedEmails is not defined` inside `BulkEnrollModal.jsx` due to an unreferenced variable in the render method, which crashed React with a blank white screen.
4. **Database & Metric Sync Confusion**: When pasting unregistered placeholder emails, they correctly classified as `unknown`, but because no new user was enrolled, the dashboard counters didn't increase until real registered accounts were provided.

### What I corrected & Action Taken
1. **Dual-Mode Input**: Added both a Paste mode (supporting commas, newlines, semicolons, tabs, and spaces) with live email detection count, and a File Upload dropzone supporting `.csv` and `.txt` files with header skipping and preview.
2. **Fixed State Lifecycle**: Removed the premature `onComplete()` from `handleSubmit()`. Created a dedicated `handleClose()` that only syncs parent metrics when the user clicks "Done" or closes the modal, keeping the Results Screen open.
3. **Fixed Dashboard Non-Blocking Refresh**: Updated `fetchMetrics(showLoading = false)` in `InstructorDashboardPage` so background updates don't show a full-screen loading spinner that unmounts active dialogs.
4. **Fixed Render Variable Bug**: Correctly scoped and declared `detectedEmails` in `BulkEnrollModal.jsx`.
5. **Per-Address Badges & CSV Export**: Added color-coded status badges (`NEWLY ENROLLED`, `ALREADY ENROLLED`, `UNKNOWN ADDRESS`), filter tabs, search filter, and an inline **"Export Course Learner Progress as CSV"** download button.

## Final note

This is the real prompt history we used. It shows the project started from the assignment, moved into system design, and then into implementation step by step.

