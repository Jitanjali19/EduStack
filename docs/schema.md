# Schema

This is the current database structure for the course platform. The idea is simple: users sign in, instructors create courses and lessons, learners enroll, and the app tracks progress and alerts.

## 1. User

| Field     | Type     | Notes                     |
| --------- | -------- | ------------------------- |
| \_id      | ObjectId | Unique MongoDB id         |
| name      | String   | Full name of the user     |
| email     | String   | Unique email address      |
| password  | String   | Hashed password           |
| role      | String   | `instructor` or `learner` |
| createdAt | Date     | When account was created  |
| updatedAt | Date     | Last update time          |

### Relationship

- One user can teach many courses.
- One user can enroll in many courses.

## 2. Course

| Field       | Type     | Notes                            |
| ----------- | -------- | -------------------------------- |
| \_id        | ObjectId | Unique course id                 |
| title       | String   | Course title                     |
| description | String   | Course summary                   |
| category    | String   | Example: Web Development         |
| status      | String   | `draft`, `published`, `archived` |
| instructor  | ObjectId | Refers to User                   |
| createdAt   | Date     | Course created date              |
| updatedAt   | Date     | Last update date                 |

### Relationship

- One instructor can create many courses.
- One course can have many lessons.
- One course can have many enrollments.

## 3. Lesson

| Field     | Type     | Notes                          |
| --------- | -------- | ------------------------------ |
| \_id      | ObjectId | Unique lesson id               |
| courseId  | ObjectId | Refers to Course               |
| title     | String   | Lesson title                   |
| content   | String   | Lesson text or description     |
| position  | Number   | Lesson order inside the course |
| createdAt | Date     | Created date                   |
| updatedAt | Date     | Last update                    |

### Relationship

- One course can have many lessons.
- Each lesson belongs to exactly one course.

## 4. Enrollment / Progress

| Field          | Type     | Notes                                     |
| -------------- | -------- | ----------------------------------------- |
| \_id           | ObjectId | Unique id                                 |
| userId         | ObjectId | Refers to User                            |
| courseId       | ObjectId | Refers to Course                          |
| status         | String   | `not_started`, `in_progress`, `completed` |
| enrolledAt     | Date     | When learner joined                       |
| completedAt    | Date     | Null until course ends                    |
| lastActivityAt | Date     | Last action date                          |
| createdAt      | Date     | Record created                            |
| updatedAt      | Date     | Last change                               |

### Relationship

- One learner can be enrolled in many courses.
- One course can have many learners.
- This is a many-to-many table.

## 5. Activity Log

| Field     | Type     | Notes                                   |
| --------- | -------- | --------------------------------------- |
| \_id      | ObjectId | Unique id                               |
| courseId  | ObjectId | Course affected                         |
| actorId   | ObjectId | User who performed action               |
| action    | String   | Example: create, edit, publish, archive |
| details   | String   | Extra information                       |
| createdAt | Date     | Time of event                           |

### Purpose

- Keeps a history of course changes.
- This log should not be edited or deleted later.

## 6. Alert

| Field       | Type     | Notes                        |
| ----------- | -------- | ---------------------------- |
| \_id        | ObjectId | Unique id                    |
| userId      | ObjectId | Learner involved             |
| courseId    | ObjectId | Course involved              |
| status      | String   | `active` or `dismissed`      |
| triggeredAt | Date     | When alert started           |
| dismissedAt | Date     | When instructor dismissed it |
| lastSeenAt  | Date     | Last learner activity seen   |
| createdAt   | Date     | Alert creation date          |

### Purpose

- Shows learners who are inactive for too long.
- Instructor can dismiss and later it may reappear.

## Database rules

These rules live in MongoDB and app logic:

- email must be unique in User
- role must be either instructor or learner
- course status must be one of the allowed values
- each lesson is tied to one course
- enrollment belongs to one user and one course

## App rules

These are managed in the backend code:

- only instructor can create or edit courses
- publish is blocked if the course has no lesson
- learner progress moves in order
- learner cannot see other learners' progress
- instructor sees inactive learner alerts

## Simple summary

The app is basically built around this flow:

User -> Course -> Lesson -> Enrollment -> Progress -> Alert

This keeps the project easy to scale and easy to understand.
