# AccessDesk — Role Based Access Management

MERN assignment scaffold designed for local development and deployment to Vercel with MongoDB Atlas.

## Stack and layout

- `frontend/`: React, Vite, React Router, persistent light/dark theme.
- `backend/`: Express app, Mongoose models, route modules, JWT and dynamic permission middleware.
- `api/[...path].js`: Vercel serverless entry point for the Express API.
- `vercel.json`: builds the Vite frontend and routes `/api/*` to the API function.

## Local setup

1. Install Node.js 20 or newer.
2. Create a MongoDB Atlas cluster and database. Add your current IP to Atlas Network Access and create a database user.
3. Copy `.env.example` to `.env`; set `MONGODB_URI`, a long random `JWT_SECRET`, and `CLIENT_ORIGIN=http://localhost:5173`.
4. Run `npm install` at the repository root.
5. Run `npm run dev`. The frontend is at `http://localhost:5173` and the API at `http://localhost:4000`.

There is not yet a seeded administrator account. The next implementation step is role seeding and the permission-checked registration/admin CRUD flows; do not expose an open public registration endpoint for privileged accounts.

## Vercel and Atlas deployment

1. Push this repository to GitHub and import it into Vercel using the repository root as the project root.
2. In Vercel Project Settings → Environment Variables, configure `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. Set `CLIENT_ORIGIN` to the deployed app origin if using strict CORS.
3. In MongoDB Atlas Network Access, allow Vercel's database connections. For a quick prototype Atlas supports allowing `0.0.0.0/0`; use strong database credentials and least-privilege DB access, and prefer a restricted network strategy where available.
4. Deploy. Verify `/api/health`, then finish app bootstrap and create the first Admin.

Vercel functions are stateless and may cold start, so the API reuses Mongoose's process-level connection. The app uses bearer JWTs; logout clears client-side auth state once the frontend auth flow is implemented.

## Assignment implementation checklist

- [x] MERN folder separation and Vercel entry point
- [x] User and dynamic role permission schemas
- [x] JWT authentication and account-active check middleware
- [x] Permission-check middleware and dashboard summary endpoint
- [x] Backend user listing pagination fixed at 10, search, role and active filters
- [x] Persistent theme foundation and page shell
- [ ] Seed Admin, Manager, Employee default roles and permissions
- [ ] Complete authentication state, login/logout and protected frontend routes
- [ ] Complete permission-filtered sidebar and module pages
- [ ] User and role CRUD APIs with create/edit/delete permission enforcement
- [ ] Reports, settings, profile updates and input validation
- [ ] API documentation and end-to-end deployment walkthrough

## API outline

All API responses use `{ success, data }` on success and `{ success: false, error: { message } }` on error.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/login` | Validate credentials and issue JWT |
| POST | `/api/auth/logout` | Authenticated logout acknowledgement |
| GET | `/api/dashboard` | Counts for users, active/inactive users, and roles |
| GET | `/api/users?page=1&search=&role=&active=` | Permission-checked users, 10 per page |
| GET | `/api/roles` | Permission-checked roles and permissions |
| GET | `/api/profile` | Current user's profile |

Protected endpoints use `Authorization: Bearer <token>`. Role permissions are stored per module (`dashboard`, `users`, `roles`, `reports`, `settings`, `profile`) with `view`, `create`, `edit`, and `delete` booleans. The required default role matrix is to be added in the seed step.
