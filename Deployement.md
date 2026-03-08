# Deployement Guide (Localhost)

This guide gives full run steps for both backend and frontend on localhost.

## Prerequisites (Both macOS and Windows)

- Node.js 18+ (recommended 20/22)
- npm
- Git
- MongoDB connection string (Atlas free tier or local MongoDB)

Project folders:

- `server/` = backend (Express + MongoDB)
- `client/` = frontend (React + Vite)

## macOS (Run Backend + Frontend)

1. Clone and open project:

```bash
git clone <your-repo-url>
cd plywood
```

2. Setup backend:

```bash
cd server
cp .env.example .env
npm install
```

3. Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db-name>?retryWrites=true&w=majority
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin123
```

4. Optional: seed first super admin:

```bash
npm run seed:admin
```

5. Run backend (Terminal 1):

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

6. Setup frontend (Terminal 2):

```bash
cd ../client
cp .env.example .env
npm install
```

7. Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

8. Run frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Windows (PowerShell) (Run Backend + Frontend)

1. Clone and open project:

```powershell
git clone <your-repo-url>
cd plywood
```

2. Setup backend:

```powershell
cd server
Copy-Item .env.example .env
npm install
```

3. Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db-name>?retryWrites=true&w=majority
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin123
```

4. Optional: seed first super admin:

```powershell
npm run seed:admin
```

5. Run backend (PowerShell Window 1):

```powershell
npm run dev
```

Backend URL: `http://localhost:5000`

6. Setup frontend (PowerShell Window 2):

```powershell
cd ..\client
Copy-Item .env.example .env
npm install
```

7. Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

8. Run frontend:

```powershell
npm run dev
```

Frontend URL: `http://localhost:5173`

## Login

- Open: `http://localhost:5173/login`
- If seeded:
  - Email: `SEED_ADMIN_EMAIL`
  - Password: `SEED_ADMIN_PASSWORD`

## Common Errors

- `Missing required environment variable: MONGO_URI`
  - Add valid `MONGO_URI` in `server/.env`
- `Missing required environment variable: JWT_SECRET`
  - Add `JWT_SECRET` in `server/.env`
- `Invalid scheme, expected mongodb:// or mongodb+srv://`
  - Fix `MONGO_URI` format in `server/.env`
- CORS issue
  - Keep `CLIENT_URL=http://localhost:5173` in `server/.env`

## Frontend Hosting (Vercel / Netlify)

Use backend API:

```env
VITE_API_URL=https://plywood.onrender.com/api
```

### Vercel

1. Import repo in Vercel.
2. Keep repo root as default.
3. `vercel.json` already sets build/output (`npm run build` -> `client/dist`).
5. Add env `VITE_API_URL=https://plywood.onrender.com/api`
6. Deploy.

### Netlify

1. Import repo in Netlify.
2. Keep default repo root. `netlify.toml` already sets build + publish (`client/dist`).
3. Add env `VITE_API_URL=https://plywood.onrender.com/api`
4. Deploy.

After frontend deploy, set backend `CLIENT_URL` in Render to your deployed frontend domain and redeploy backend.

If login shows `Invalid credentials` on production, set these in Render backend and redeploy:

```env
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=your-admin-email
SEED_ADMIN_PASSWORD=your-admin-password
```

On server start, backend auto-creates this account as `super_admin` if that email is not already present.
