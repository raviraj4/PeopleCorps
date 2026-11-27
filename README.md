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

### Create the first administrator

Add these optional values to the root `.env`, using a unique password of at least 12 characters, then run `npm run seed`:

```env
BOOTSTRAP_ADMIN_NAME=PeopleCorps Admin
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=your-unique-password
```

The seed command creates or updates the Admin, Manager, and Employee role permissions. It creates an Admin only when the configured email does not already exist. Remove the bootstrap password from `.env` after the account is created. The application has no public registration endpoint.

## Vercel and Atlas deployment

1. Push this repository to GitHub and import it into Vercel using the repository root as the project root.
2. In Vercel Project Settings → Environment Variables, configure `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. `CLIENT_ORIGIN` is optional; set it to the deployed app origin to restrict CORS.
3. In MongoDB Atlas Network Access, allow Vercel's database connections. For a quick prototype Atlas supports allowing `0.0.0.0/0`; use strong database credentials and least-privilege DB access, and prefer a restricted network strategy where available.
4. Deploy. Verify `/api/health`. To initialize the Atlas database, set `MONGODB_URI` and the bootstrap administrator variables in your local root `.env`, then run `npm run seed` once. The seed script creates the three roles and the initial Admin in Atlas.

Vercel functions are stateless and may cold start, so the API reuses Mongoose's process-level connection. The app uses bearer JWTs and clears the client session on logout or token expiry.

## Assignment implementation checklist

- [x] MERN folder separation and Vercel entry point
- [x] User and dynamic role permission schemas
- [x] JWT authentication and account-active check middleware
- [x] Permission-check middleware and dashboard summary endpoint
- [x] Backend user listing pagination fixed at 10, search, role and active filters
- [x] Persistent theme foundation and page shell
- [x] Seed Admin, Manager, Employee default roles and permissions
- [x] Authentication state, login/logout and protected frontend routes
- [x] Permission-filtered sidebar and module pages
- [x] User and role CRUD APIs with create/edit/delete permission enforcement
- [x] Reports, settings, profile updates and input validation
- [x] Optional gender field and automatically refreshed diversity chart
- [x] API documentation with request/response examples
- [x] Local setup, Atlas seed, Vercel configuration, and deployment walkthrough

## API outline

Full endpoint details, request bodies, permission requirements, and response examples are in [docs/API.md](docs/API.md).

All API responses use `{ success, data }` on success and `{ success: false, error: { message } }` on error.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/login` | Validate credentials and issue JWT |
| POST | `/api/auth/logout` | Authenticated logout acknowledgement |
| GET | `/api/auth/me` | Current authenticated user and latest role permissions |
| GET | `/api/dashboard` | Counts for users, active/inactive users, and roles |
| GET | `/api/users?page=1&search=&role=&active=` | Permission-checked users, 10 per page |
| POST/PATCH/DELETE | `/api/users` and `/api/users/:id` | Create, edit, or delete users (matching permission required) |
| GET | `/api/roles/options` | Role names for user filters and assignment |
| GET/POST | `/api/roles` | List or create roles |
| PATCH/DELETE | `/api/roles/:id` | Edit permissions or delete an unassigned role |
| GET | `/api/reports?role=<id>` | User totals by role and account status |
| GET | `/api/reports/diversity` | Aggregated gender counts for the diversity chart |
| GET | `/api/reports/export?role=<id>` | Filtered user directory, role totals, and gender data for PDF export |
| GET/PATCH | `/api/settings` | Read or update workspace name |
| GET/PATCH | `/api/profile` | Read or update the signed-in user's profile |

Protected endpoints use `Authorization: Bearer <token>`. Role permissions are stored per module (`dashboard`, `users`, `roles`, `reports`, `settings`, `profile`) with `view`, `create`, `edit`, and `delete` booleans. Run the seed command once to create the required default role matrix and initial Admin account.
