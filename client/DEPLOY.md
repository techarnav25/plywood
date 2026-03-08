# Client Deploy (Vercel / Netlify)

Use this env variable:

```env
VITE_API_URL=https://plywood.onrender.com/api
```

## Vercel

1. Import `client` folder/repo in Vercel.
2. Add environment variable `VITE_API_URL`.
3. Deploy (build/output are set in `vercel.json`).

## Netlify

1. Import `client` folder/repo in Netlify.
2. Add environment variable `VITE_API_URL`.
3. Deploy (build/publish/redirect are set in `netlify.toml`).

## Important

After frontend deploy, update Render backend `CLIENT_URL` with your final frontend domain and redeploy backend once.

