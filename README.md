# Labour Attendance & Billing Management System (MERN)

Full-stack MERN application for labour attendance, monthly billing, and role-based admin management.

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt
- Frontend: React (Vite), React Router, Axios, Tailwind CSS, Context API

## Features
- Multi-login with roles: `super_admin`, `admin`, `manager`, `labour`
- JWT auth with protected/role-based routes
- Daily attendance dashboard
- Attendance row locking after submission
- Labour categories:
  - `salary_based`: payable by hour-weighted attendance (`10 hours = 1 attendance unit`)
    salary type options:
    - `daily`: direct daily salary
    - `monthly`: daily rate is derived by month length (`monthly_salary / days_in_month`)
  - `contract_based`: payable by finished ply x per-ply rate
- Labour profile monthly billing summary
- Billing adjustments with dated entries:
  - Canteen (multiple entries)
  - Advance taken (multiple entries with who gave)
  - Extra work (extra hours for salary labour, extra ply for contract labour)
- Billing formula:
  - `salary_based (daily)`: `Gross = total_attendance_unit x daily_salary`
  - `salary_based (monthly)`: `Gross = total_attendance_unit x (monthly_salary / days_in_month)`
    where `attendance_unit = hours_worked / 10`
  - `contract_based`: `Gross = total_ply x per_ply_rate`
  - `Net = Gross + ExtraAmount - CanteenTotal - AdvanceTotal`
  - `FinalPayable = max(Net, 0)`
  - `DuesOnLabour = abs(Net)` when `Net < 0`
- Print and PDF download from labour profile
- Labour CRUD (`delete` restricted to `super_admin`)
- Monthly reports page
- Dark mode toggle, loading skeletons, toast notifications
- Mobile responsive sidebar + dashboard layout

## Project Structure
```
.
├── client/         # Vite + React frontend
└── server/         # Express + MongoDB backend
```

## Backend Setup (`server`)
1. Copy env file:
   - `cp .env.example .env`
2. Update env values in `.env`
3. Install dependencies:
   - `npm install`
4. Seed first super admin (optional):
   - `npm run seed:admin`
5. Run backend:
   - `npm run dev`

### Backend Environment Variables
- `PORT` (default `5000`)
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `7d`)
- `CLIENT_URL` (comma-separated allowed frontend origins)
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Frontend Setup (`client`)
1. Copy env file:
   - `cp .env.example .env`
2. Set API URL in `.env`
   - `VITE_API_URL=http://localhost:5000/api`
3. Install dependencies:
   - `npm install`
4. Run frontend:
   - `npm run dev`

## API Overview
- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/labour/login`
  - `GET /api/auth/me`
  - `PUT /api/auth/me/profile-image`
  - `GET /api/auth/admins` (super_admin)
  - `POST /api/auth/admins` (super_admin)
  - `DELETE /api/auth/admins/:id` (super_admin)
- Labours:
  - `GET /api/labours`
  - `GET /api/labours/:id`
  - `POST /api/labours` (super_admin)
  - `PUT /api/labours/:id` (super_admin)
  - `DELETE /api/labours/:id` (super_admin)
- Attendance:
  - `GET /api/attendance/daily`
  - `GET /api/attendance/summary`
  - `POST /api/attendance`
- Billing:
  - `GET /api/billing/my-profile` (labour self)
  - `GET /api/billing/labour/:id`
  - `PUT /api/billing/labour/:id/payment` (super_admin)
  - `POST /api/billing/labour/:id/adjustments/canteen` (super_admin)
  - `POST /api/billing/labour/:id/adjustments/advance` (super_admin)
  - `POST /api/billing/labour/:id/adjustments/extra` (super_admin)
- Reports:
  - `GET /api/reports/monthly`

## Deployment (Production)

This repo is configured for:
- Backend on Render using [`render.yaml`](./render.yaml)
- Frontend on Vercel using [`client/vercel.json`](./client/vercel.json)

### 1) Deploy Backend on Render
1. Push this project to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Render will detect `render.yaml` values:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check: `/api/health`
4. Add environment variables in Render service settings:
   - `NODE_ENV=production`
   - `MONGO_URI=<your mongodb connection string>`
   - `JWT_SECRET=<strong random secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=<your vercel production url or custom frontend domain>`
5. Deploy and verify: `https://<render-service>/api/health`

### 2) Deploy Frontend on Vercel
1. In Vercel, import the same repo.
2. Set **Root Directory** to `client`.
3. Confirm build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add env variable:
   - `VITE_API_URL=https://<render-service>/api`
5. Deploy and open the Vercel URL.

### 3) Final CORS Step
After Vercel gives your final production domain:
1. Update Render env `CLIENT_URL` with that exact domain.
2. Redeploy Render backend.

### 4) Production Database (Real-life)
- Use a managed MongoDB cluster (commonly MongoDB Atlas) for `MONGO_URI`.
- Restrict DB network access and create a dedicated app user with strong password.
- Enable regular backups/snapshots in your DB provider.

### 5) Go-live Checklist
- Set custom domains on Vercel and Render.
- Keep `JWT_SECRET` strong and private.
- Seed one super admin (`npm run seed:admin`) only once, then rotate default credentials.
- Use HTTPS-only URLs in `CLIENT_URL` and `VITE_API_URL`.
- Monitor Render logs, set alerts, and verify `/api/health` periodically.

## Default Login (after seed)
- Email: value of `SEED_ADMIN_EMAIL` (default `admin@example.com`)
- Password: value of `SEED_ADMIN_PASSWORD` (default `admin123`)
# plywood
