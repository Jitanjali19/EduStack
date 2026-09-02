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

## 8. Fix CSV export permission problem

### Problem

When I clicked the CSV button on the instructor dashboard, the file did not download. The browser console showed a `403 Forbidden` error.

The reason was that the dashboard was showing courses from the whole platform, but the CSV backend route was checking that the logged-in instructor owned the course. So an instructor could see a course in the table, but the backend rejected the export if that course belonged to another instructor.

### What I corrected

First, I made sure the dashboard loads all courses, because the instructor needs to see the complete course progress table. Then I checked the permission rule in the CSV route. The correct rule is:

- An instructor can export their own course, whether it is a draft or published.
- An instructor can export another instructor's course only when that course is published.
- A draft course owned by another instructor must stay protected.

The CSV request already sends the login token through the shared API client, so the problem was not the download code or the token. It was the backend permission check.

### Result

The dashboard can show all available courses, and the CSV export permission now matches what the dashboard shows. This removes the confusing `403 Forbidden` error for published courses while keeping unpublished courses protected. I also checked the edited backend route files for syntax errors and confirmed that the route modules load correctly.

## 9. Remove course moderation from Admin

### Prompt

"Admin me se Draft, Publish, Archive, Restore hata do. Ye instructor ka kaam hai. Admin ka kaam
instructor create karna aur users manage karna hai."

### What I got

The first fix removed the moderation section and course API request from the Admin page. A second
review showed that the old admin course endpoints still existed in the backend, so a direct API call
could still let an admin moderate a course.

### What I corrected

I removed the admin course listing and moderation routes as well. The instructor course routes already
enforce the instructor role and ownership, so the permission model now matches the visible UI.

## 10. Add password recovery without SMTP

### Prompt

"SMTP wala mat karo. Normal rakho: reset link do, phir user new password set kar sake."

### What I got

The first password recovery design expected SMTP variables and `nodemailer`, which was too much setup
for a local demo and would not work without a mail provider.

### What I corrected

I removed SMTP and `nodemailer`. The backend now creates a random one-time token, stores only its hash
with a 15-minute expiry, and returns a reset URL. The frontend shows an Open reset link action, and
the reset page accepts the new password. A logged-in user also has a current-password-verified change
password form in Profile.

## 11. Fix Vercel refresh routing

### Prompt

"Fix the Vercel SPA routing issue. When `/dashboard` is refreshed, Vercel shows 404 NOT_FOUND. Add
the proper rewrite to `/index.html` without changing UI or app logic."

### What I got

There was no Vercel configuration in the frontend, so direct access to React Router routes failed even
though in-app navigation worked.

### What I corrected

I added only `frontend/vercel.json` with a catch-all rewrite to `/index.html`. The existing React, API,
and authentication code was left unchanged. The Vite production build passed afterward.

## 12. Validation mistakes recorded

### Problem

Some checks first ran from `C:\course-platform` while the relevant `package.json` was inside
`frontend`, or while the terminal was already inside `backend`, which created paths like
`backend\backend`.

### Correction

I reran the checks from the correct project directories. Backend syntax checks and the frontend
production build passed. Full lint still reports older unrelated warnings, so those were documented
instead of changing unrelated files.

