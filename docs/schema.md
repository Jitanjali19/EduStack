# Database Schema Documentation

This document describes the schema design, field types, relationships, constraints, denormalization choices, and scale limitations of the course platform database.

---

## 1. Tables (Collections), Columns, & Types

### 1.1 User

| Column | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique user identifier |
| `name` | String | Required, Trimmed | Full name of the user |
| `email` | String | Required, Unique, Lowercase | User email address used for login and bulk enrollment |
| `password` | String | Required | Bcrypt hashed password |
| `role` | String | Enum (`instructor`, `learner`), Default: `learner` | System role |
| `createdAt` | Date | Auto Timestamp | Account creation timestamp |
| `updatedAt` | Date | Auto Timestamp | Last modification timestamp |

### 1.2 Course

| Column | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique course identifier |
| `title` | String | Required, Trimmed | Course title |
| `description` | String | Required, Trimmed | Course detailed description |
| `category` | String | Required, Trimmed | Category string |
| `status` | String | Enum (`draft`, `published`, `archived`), Default: `draft` | Course lifecycle state |
| `instructor` | ObjectId | Ref -> User, Required | Foreign key to User document |
| `createdAt` | Date | Auto Timestamp | Course creation timestamp |
| `updatedAt` | Date | Auto Timestamp | Last modification timestamp |

### 1.3 Lesson

| Column | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique lesson identifier |
| `courseId` | ObjectId | Ref -> Course, Required | Foreign key to Course document |
| `title` | String | Required, Trimmed | Lesson title |
| `content` | String | Required, Trimmed | Lesson content text or markdown |
| `position` | Number | Required | Sequential position order inside the course |
| `createdAt` | Date | Auto Timestamp | Lesson creation timestamp |
| `updatedAt` | Date | Auto Timestamp | Last modification timestamp |

### 1.4 Enrollment (Progress Tracking)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique enrollment identifier |
| `userId` | ObjectId | Ref -> User, Required | Foreign key to User document |
| `courseId` | ObjectId | Ref -> Course, Required | Foreign key to Course document |
| `status` | String | Enum (`not_started`, `in_progress`, `completed`), Default: `not_started` | Learner progress state |
| `completedLessons` | Array of ObjectIds | Ref -> Lesson | Denormalized list of completed lesson IDs |
| `enrolledAt` | Date | Default: Date.now | Timestamp when learner was enrolled |
| `lastActivityAt` | Date | Default: Date.now | Timestamp of learner's last lesson activity |
| `completedAt` | Date | Default: null | Timestamp when course was completed |
| `dismissedAt` | Date | Default: null | Timestamp when instructor dismissed inactivity alert |
| `createdAt` | Date | Auto Timestamp | Document creation timestamp |
| `updatedAt` | Date | Auto Timestamp | Document modification timestamp |

**Indexes**: Compound unique index `{ userId: 1, courseId: 1 }` prevents duplicate enrollments.

### 1.5 ActivityLog

| Column | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique log entry identifier |
| `courseId` | ObjectId | Ref -> Course, Required | Foreign key to Course document |
| `actorId` | ObjectId | Ref -> User, Required | User who performed the action |
| `action` | String | Enum (`create`, `edit`, `publish`, `archive`, `restore`, `lesson_add`, `lesson_edit`, `lesson_delete`, `enrolled`, `completed`, `comment`) | Action type |
| `details` | String | Default: '' | Description of the action |
| `createdAt` | Date | Immutable Timestamp | Event log timestamp |

---

## 2. Relationships

- **One-to-Many**:
  - `User` (Instructor) -> `Course` (One instructor teaches many courses)
  - `Course` -> `Lesson` (One course contains many ordered lessons)
  - `Course` -> `ActivityLog` (One course has many immutable activity log events)
- **Many-to-Many**:
  - `User` (Learner) <-> `Course` (Managed via `Enrollment` join model)

---

## 3. Database vs Application Constraints

### Database Constraints (MongoDB & Mongoose Schema)
- Unique index on `User.email` prevents duplicate registrations.
- Compound unique index on `Enrollment.{ userId, courseId }` prevents duplicate course enrollments.
- Schema enums for `User.role`, `Course.status`, `Enrollment.status`, and `ActivityLog.action`.
- Schema level required fields and type casting.
- Mongoose middleware hooks on `ActivityLog` blocking `updateOne`, `updateMany`, `deleteOne`, and `deleteMany` to enforce immutability.

### Application Constraints (Backend Express Layer)
- **Publishing Rule**: Cannot publish a course with 0 lessons. Verified by `Lesson.countDocuments({ courseId })`.
- **Progress Machine Rule**: Forward-only transition (`not_started` -> `in_progress` -> `completed`). Rejects backwards or illegal jumps.
- **Course Completion Validation**: Marking a course completed requires all lessons in the course to be present in `completedLessons`.
- **Role Permissions**: Learners cannot create/edit courses or view other learners' progress; Instructors cannot enroll in unpublished courses.
- **Alert Reappearance**: Alerts reappear when `lastActivityAt > dismissedAt` after 14 days of quiet time.

---

## 4. Deliberately Denormalized Data

- `Enrollment.completedLessons`: Storing an array of completed `Lesson` ObjectIds directly inside the `Enrollment` document avoids creating a separate `LessonCompletion` join table for every learner-lesson pair. This speeds up progress percentage calculations and single-query status updates.

---

## 5. What Would Break First at 100x Data?

1. **Course Search Regex Matching**: `RegExp` regex search over course titles and descriptions will become slow without a MongoDB Text Index (`$text` index).
2. **Inactivity Alert Scanning**: Scanning all `in_progress` enrollments with JavaScript filtering for 14-day inactivity across millions of rows will degrade. Adding a compound index `{ courseId: 1, status: 1, lastActivityAt: 1 }` will be necessary.
3. **Weekly Completion Trend Bucketing**: Calculating 8-week completion trends in JS memory will reach memory limits. Transitioning to a native MongoDB Aggregation Pipeline `$bucket` operation will resolve this.
