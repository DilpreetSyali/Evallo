# HRMS Full Stack App

This project is a Human Resource Management System built with:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL-compatible SQL

## Features

- Organisation registration and login
- JWT-based authentication
- Employee CRUD
- Team CRUD
- Employee-to-team assignment and removal
- Audit logging for login, logout, create, update, delete, and assignment actions

## Project Structure

- `src/` - React frontend
- `backend/` - Express API, SQL schema helpers, controllers, and routes

## Setup

### 1. Install dependencies

Run these from the project root and backend folder:

```bash
npm install
cd backend
npm install
```

### 2. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and update the values:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrms
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
```

If `DATABASE_URL` is left blank, the backend starts with an in-memory PostgreSQL-compatible database for demo use. Point it to a real Postgres instance to keep data between restarts.

### 2a. Set up local PostgreSQL

Install PostgreSQL 15+ and make sure the server is running on port `5432`.

Create a database and user, then grant access:

```sql
CREATE DATABASE hrms;
CREATE USER hrms_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE hrms TO hrms_user;
```

Then set:

```env
DATABASE_URL=postgresql://hrms_user:your_password_here@localhost:5432/hrms
```

If you prefer, you can use the default `postgres` user instead of creating a new one.

### 2b. Seed demo data

After the database is ready, load sample employees, teams, memberships, and logs:

```bash
cd backend
npm run seed
```

Demo login:

- Email: `admin@acme.com`
- Password: `Admin@123`

### 3. Start the backend

```bash
cd backend
npm run dev
```

The API will run on `http://localhost:5000`.

### 4. Start the frontend

In a separate terminal from the project root:

```bash
npm run dev
```

The UI will run on `http://localhost:3000`. If that port is already in use, Vite will fall back to `http://localhost:3001`, which is also allowed by the backend during local development.

## API Overview

- `POST /api/auth/register` - Create organisation and admin user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/:id/teams` - Assign employee to team
- `DELETE /api/employees/:id/teams/:teamId` - Remove employee from team
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/audit-logs` - View audit trail

## Notes

- All protected routes require a valid JWT access token.
- Data is scoped by organisation so each account manages only its own employees and teams.
- Audit logs are stored in the SQL database for traceability.

## Schema Overview

- `organisations` - Stores each company account created during registration.
- `users` - Stores authentication users and links them to an organisation.
- `employees` - Stores employee profiles and their organisation ownership.
- `teams` - Stores team records and basic metadata.
- `team_employees` - Join table that supports many-to-many employee-team assignments.
- `audit_logs` - Stores backend activity logs for login, CRUD, and assignment actions.

## Assignment Checklist

- Employee list: implemented in the Employees page and `/api/employees`.
- Teams list: implemented in the Teams page and `/api/teams`.
- Team assignment: implemented through the employee-team join table and assign/unassign endpoints.
- Forms for employees and teams: implemented in the modal-based create/edit flows.
- CRUD for employees and teams: implemented in the backend routes and UI actions.
- Logging: implemented through the `audit_logs` table and backend `logAction()` helper.
- Multi-team employees: supported by the `team_employees` join table.
- Authentication required before data changes: enforced by JWT middleware.
- Organisation account first: supported by organisation registration in `/api/auth/register`.
