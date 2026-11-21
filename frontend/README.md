# ClassManage frontend

Next.js App Router application using TypeScript and Material UI.

Authentication uses same-origin Next.js route handlers. Access and refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies and are not exposed to browser JavaScript. Calls to backend APIs should go through `/api/backend/<backend-path>`; that proxy refreshes and rotates tokens when needed, then retries a request once after a `401`.

Set `BACKEND_API_URL` to the backend API base URL (defaults to `http://localhost:3003/api`). Copy `.env.example` to `.env.local` for local development.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
