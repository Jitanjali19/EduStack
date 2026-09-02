# Architecture

This project is a course platform for internal training. The main idea is simple: instructors create courses, learners enroll and complete lessons, and the system keeps progress, alerts, and activity history in one place instead of spreadsheets and email threads.

## Moving pieces

1. Frontend: React + Vite app
   - Runs in the browser.
   - Shows login, dashboard, course catalog, lesson pages, instructor tools, and learner progress views.
   - Calls the backend API with HTTP requests.

2. Backend: Node.js + Express
   - Runs as a server process.
   - Handles authentication, authorization, course CRUD, enrollment logic, search/filtering, progress updates, alerts, and reporting.
   - Validates business rules before saving changes.
   - Applies course search, filters, sorting, and pagination before sending data to the browser.

3. Database: MongoDB
   - Stores users, courses, lessons, enrollments, progress records, activity logs, and alerts.
   - Keeps complex relationships and updates for several learners and many courses.

4. API layer
   - REST endpoints for auth, courses, lessons, enrollments, dashboard, and reports.
   - Central place for role checks like instructor vs learner.
   - Password recovery uses a one-time hashed token instead of storing a usable reset password.

5. File/document layer
   - Course data and activity history live in MongoDB documents.
   - CSV export generation is handled in the backend so the browser does not own the data logic.

## How they talk to each other

- The browser sends requests to the Express API.
- Express uses Mongoose to read/write MongoDB data.
- The backend checks the user role before allowing operations.
- The frontend receives JSON responses and renders screens based on the result.

For the Courses page, the browser sends the search text, filters, sort order, page number, and page size. MongoDB applies these options and the API returns only that page of courses. This is important for a company-size course library because the browser never needs to download the complete dataset just to show the first page.

## Where each piece runs

- React frontend: local machine in development, later deployed as a static frontend host.
- Express backend: local machine in development, later deployed as a backend server.
- MongoDB: managed database service in production.
- Environment variables keep secrets like JWT secret and database connection string out of the repo.

## Representative user flow

Example flow: a learner opens a published course and marks a lesson complete.

1. User logs in via the frontend.
2. Frontend sends email/password to POST /api/auth/login.
3. Express verifies credentials and returns a JWT token.
4. Frontend stores the token and calls GET /api/courses/:id or GET /api/enrollments.
5. The learner opens the lesson and clicks “Mark complete”.
6. Frontend sends PATCH /api/progress/:courseId/lesson/:lessonId or an equivalent progress update.
7. Express checks that the learner is enrolled in that course.
8. Backend updates the learner’s progress state, checks course completion rules, and saves the activity log.
9. Frontend refreshes the learner dashboard and shows “In Progress” or “Completed”.

## What I decided not to build yet

I am not starting with stretch features like quizzes, certificates, discussion threads, video tracking, or learning paths. Those are useful, but they are not required for the core assignment. For this project, the critical path is:

- auth + roles
- course creation and publishing
- lesson management
- enrollment and progress tracking
- dashboard + alerts
- activity log

## Responsibility boundaries

One important correction was made after reviewing the Admin Console. Course Draft, Publish,
Archive, and Restore actions belong to the instructor who owns the course. They are now removed
from the Admin UI and from the admin course moderation API routes. The backend course routes check
both the instructor role and course ownership, so hiding a button is not the only protection.

The admin role is intentionally smaller: an admin creates instructor accounts and reviews users.
This keeps platform administration separate from day-to-day course authoring.

## Password recovery flow

If a user forgets a password, the frontend sends the email to `POST /api/auth/forgot-password`.
The backend creates a random token, stores only its SHA-256 hash, and sets a 15-minute expiry. In
this project there is no SMTP service, so the API returns a local reset link directly on the screen.
The user opens that link and submits a new password to `POST /api/auth/reset-password/:token`.
The token is cleared after use. Logged-in users can instead change their password from Profile by
providing the current password.

## Deployment detail: React Router refreshes

The frontend is a Vite single-page application, so routes such as `/dashboard` are handled by
React Router in the browser. A direct refresh initially caused a Vercel `404 NOT_FOUND` because
Vercel looked for a physical `/dashboard` file. `frontend/vercel.json` now rewrites every unknown
frontend path to `/index.html`, allowing React Router to load the correct screen.

Those are the minimum features that prove the system works. Once the core is stable, stretch ideas can be added without breaking the architecture.

## Practical architecture choice

I am using a clean three-layer setup instead of a monolith with frontend logic mixed into the backend. That keeps responsibilities separated:

- Frontend: user experience
- Backend: business rules and authentication
- Database: persistence and relationships

This will make debugging easier and keeps the project manageable before the 3 September deadline.
