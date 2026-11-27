# PeopleCorps API

Base path: `/api`. All protected endpoints require `Authorization: Bearer <token>`.

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "message": "..." } }`.

## Authentication

### `POST /auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Success (`200`):

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "6650a123456789abcdef0123",
      "name": "PeopleCorps Admin",
      "email": "admin@example.com",
      "phone": "",
      "isActive": true,
      "role": {
        "name": "Admin",
        "permissions": {
          "dashboard": { "view": true, "create": true, "edit": true, "delete": true }
        }
      }
    }
  }
}
```

Login returns `401` for invalid credentials or inactive accounts. Tokens expire according to `JWT_EXPIRES_IN`.

### `GET /auth/me`

Returns the current active user, including the latest role permissions. Requires authentication.

### `POST /auth/logout`

Requires authentication. The browser clears its stored bearer token after this acknowledgement.

## Dashboard

### `GET /dashboard`

Requires `dashboard.view`.

```json
{
  "success": true,
  "data": {
    "totalUsers": 11,
    "activeUsers": 10,
    "inactiveUsers": 1,
    "totalRoles": 3,
    "roles": [
      { "id": "6650a123456789abcdef0123", "name": "Employee", "userCount": 8 }
    ]
  }
}
```

## Users

All user routes require authentication and the matching `users` permission.

### `GET /users`

Requires `users.view`. Query parameters: `page` (default `1`), `search` (matches name/email), `role` (MongoDB role ID), and `active` (`true` or `false`). Results contain 10 users per page. Search, filters, and pagination can be combined.

Example: `GET /users?page=2&search=alex&role=6650a123456789abcdef0123&active=true`

```json
{
  "success": true,
  "data": [
    {
      "_id": "6650b123456789abcdef0456",
      "name": "Alex Morgan",
      "email": "alex@example.com",
      "gender": "woman",
      "isActive": true,
      "role": { "_id": "6650a123456789abcdef0123", "name": "Employee" }
    }
  ],
  "pagination": { "page": 2, "limit": 10, "total": 11, "totalPages": 2 }
}
```

### `POST /users`

Requires `users.create`. `name`, `email`, `password` (at least 8 characters), and `role` are required. `phone`, `gender`, and `isActive` are optional. Gender values: `woman`, `man`, `non_binary`, `another_identity`, `prefer_not_to_say`, or an empty string for not provided.

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "temporary-password",
  "role": "6650a123456789abcdef0123",
  "gender": "woman",
  "phone": "+1 555 0100",
  "isActive": true
}
```

### `PATCH /users/:id`

Requires `users.edit`. Send fields to update; `password` is optional and must be at least 8 characters if provided. A user cannot deactivate or delete their own account.

```json
{ "gender": "non_binary", "isActive": true }
```

### `DELETE /users/:id`

Requires `users.delete`. Users assigned to a role are not deleted when that role is removed; instead role deletion is blocked until its users are reassigned.

## Roles and permissions

All role routes require authentication.

### `GET /roles/options`

Requires `roles.view` or `users.view`. Returns role IDs and names for filters and user assignment.

### `GET /roles`

Requires `roles.view`. Returns the stored permission map and assigned user counts.

### `POST /roles`

Requires `roles.create`.

```json
{
  "name": "Auditor",
  "description": "Read-only access to reports",
  "permissions": {
    "dashboard": { "view": true },
    "reports": { "view": true }
  }
}
```

Omitted module/action permissions default to `false`.

### `PATCH /roles/:id`

Requires `roles.edit`. Send any of `name`, `description`, or a complete `permissions` map. A permission update replaces the role's permission map; omitted permissions become `false`.

### `DELETE /roles/:id`

Requires `roles.delete`. Returns `409` if users are still assigned to the role.

## Reports

### `GET /reports?role=<roleId>`

Requires `reports.view`. Returns role totals and active/inactive counts. The role parameter is optional and must be a valid MongoDB ID.

### `GET /reports/diversity`

Requires `reports.view`. Aggregates current user gender selections and includes `Not provided` for records without a selection.

```json
{
  "success": true,
  "data": {
    "total": 11,
    "categories": [
      { "key": "woman", "label": "Woman", "count": 6, "percentage": 54.5 },
      { "key": "not_provided", "label": "Not provided", "count": 5, "percentage": 45.5 }
    ],
    "updatedAt": "2026-11-27T10:00:00.000Z"
  }
}
```

### `GET /reports/export?role=<roleId>`

Requires both `reports.view` and `users.view`. Returns the filtered user directory, role summary, and diversity categories used by the browser's print-to-PDF report.

## Settings and profile

### `GET /settings`, `PATCH /settings`

Requires `settings.view` to read and `settings.edit` to update. PATCH body:

```json
{ "organizationName": "PeopleCorps" }
```

### `GET /profile`, `PATCH /profile`

Requires authentication. PATCH accepts `name`, `email`, and `phone`. To change your own password, also send `currentPassword` and `newPassword` (minimum 8 characters).

```json
{
  "name": "Alex Morgan",
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

## Default permission matrix

| Module | Admin | Manager | Employee |
| --- | --- | --- | --- |
| Dashboard | View, Create, Edit, Delete | View | View |
| User Management | Full access | View | No access |
| Role Management | Full access | No access | No access |
| Reports | Full access | View | No access |
| Settings | Full access | No access | No access |
| My Profile | Full access | Full access | Full access |
