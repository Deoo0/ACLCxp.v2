# ACLCxp frontend

React 19 and TypeScript application built with Vite 7 and Tailwind CSS 4. It provides public competition results, student workspaces, staff attendance, and an administrator console.

## Development

Use Node.js 22.12+ and run `npm ci` from `frontend`. Create or edit `.env.local` with:

```dotenv
VITE_API_URL=http://localhost:8000
```

Start the Django backend separately using the [project setup guide](../docs/README.md#local-setup), run `npm run dev`, and open `http://localhost:5173`.

`VITE_API_URL` must contain the backend origin without `/api`. The API client adds `/api`. `VITE_API_TIMEOUT_MS` optionally sets the request timeout (20,000 ms by default). Restart Vite after environment changes; deployed builds require rebuilding.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Check TypeScript and create `dist/` |
| `npm run preview` | Preview the production build locally |

## Source layout

- `src/pages/`: public, authentication, student, and admin screens.
- `src/components/`: shared layouts, navigation, attendance tools, and dashboard components.
- `src/routes/`: route definitions and role guards.
- `src/context/AuthContext.tsx`: authentication state.
- `src/services/`: API client, token refresh, queries, and download helpers.
- `src/ui/`: theme and UI primitives.

Student access also depends on the backend's current season and ticket checks. See [Season administration](../docs/seasons.md) before testing enrollment or student dashboards.

For hosting, see the [Vercel + Render + Neon deployment guide](../docs/free-testing-deployment.md). `vercel.json` provides SPA rewrites for client-side routes.
