# Cloudora Genie (v1)


Files in this document form a complete working starter for: job application flow, employee creation, Supabase integration, admin lead upload & assignment, multi-language hooks, web TTS/STT support, and a minimal backend.


## Setup
1. Create a Supabase project and run the SQL schema provided in the README or console.
2. Replace the SUPABASE variables in `manifest.json`, `global.js`, and `backend/.env`.
3. Deploy backend: `node backend/index.js` (set env variables: SUPA_URL, SUPA_SERVICE_KEY).
4. Serve frontend as static files (GitHub Pages / Netlify / local static server).


## Notes
- Keep `SUPA_SERVICE_KEY` server-side only.
- Frontend uses anon key for public operations.
- Admin-only tasks use backend endpoints.