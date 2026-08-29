# Decisions

These are the main choices we made while building the project.

## Decision 1: Frontend

- **Chose:** We used React + Vite for the frontend.
- **Rejected:** A bigger framework or a plain HTML version.
- **Why:** It is fast, simple, and good for a dashboard-based app.

## Decision 2: Backend

- **Chose:** We used Node.js + Express for the backend.
- **Rejected:** Putting everything into the frontend.
- **Why:** The backend is the right place for login, rules, role checks, and course logic.

## Decision 3: DataBase

- **Chose:** We used MongoDB with Mongoose.
- **Rejected:** A full SQL setup from the start.
- **Why:** The project is mostly document-based and easier to manage in MongoDB.

## Decision 4: How to handle unauthenticated/unauthorized requests

- **Chose:** Explicit early-return check in authMiddleware — if no
  token or invalid token, immediately respond with 401/403 and a
  clear message, before request reaches any route logic.
- **Rejected:** Letting jwt.verify() throw and relying on a global
  Express error handler to catch it.
- **Why:** Explicit checks make it obvious exactly where and why a
  request is being rejected, and keep the middleware self-contained
  — easier to test and reason about than routing errors through a
  generic catch-all handler.


