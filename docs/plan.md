# Plan

We are building this project in simple steps so it is easier to finish on time.

## Phase 1: Setup

- Install backend and frontend basics
- Set up environment variables
- Connect MongoDB
- Start the server and check the health route

## Phase 2: User login and roles

- Register users
- Login users
- Create instructor and learner roles
- Protect routes with JWT and backend checks

## Phase 3: Courses and lessons

- Create course
- Edit course
- Publish course only when it has at least one lesson
- Archive and restore course
- Add, update, reorder, and delete lessons

## Phase 4: Enrollment and progress

- Learner enrolls in published course
- Track progress per learner per course
- Move status from not started to in progress to completed
- Show learner course list

## Phase 5: Dashboard and alerts

- Show total learners and total courses
- Show progress and completion numbers
- Show alerts for inactive learners
- Show activity log and course history

## Phase 6: Final work

- Fix bugs and test backend flow
- Clean the code
- Update docs
- Prepare submission files

## Why this order

This order matters because the app depends on login first, then courses, then enrollment, and only then dashboards and alerts. If the base is weak, later features become messy.

## What we cut if time is short

We will not cut the required 10 goals. We will only delay stretch features like:

- quiz system
- certificates
- discussion threads
- extra analytics

## Simple timeline

- First days: setup, login, roles, courses
- Middle days: lessons, enrollment, progress
- Final days: dashboard, alerts, cleanup, docs

This keeps the project realistic and makes it easier to finish before the deadline.
