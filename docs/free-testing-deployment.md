# Free testing deployment: Vercel + Render + Neon

Use a new Neon testing project. Do not point this setup at real school data. Free hosting is for the pilot; concurrent-user capacity has not been measured.

## 1. Commit and push

Push these changes and all migrations to the GitHub branch you will test. Gunicorn and `frontend/vercel.json` are already in the repository. Never commit actual environment values.

## 2. Neon database

Create a Neon account and a Free project named `aclcxp-testing`. Choose a region near your Render service. In Connect, select the database and copy both connection strings privately:

- Pooled connection (hostname includes `-pooler`): Render `DATABASE_URL`.
- Direct connection (pooling disabled): Render `MIGRATION_DATABASE_URL`, and local administrator setup.

Keep the generated TLS parameters such as `sslmode=require`. Neither string belongs in frontend variables or Git. Neon Free has storage/compute/transfer limits; monitor its Usage page.

## 3. Render backend

Create a Web Service from your GitHub repository, not a Render database. Choose Python and the Free instance type explicitly.

| Setting | Value |
| --- | --- |
| Branch | The branch containing these changes, preferably develop for testing |
| Root directory | backend |
| Build command | python render_build.py |
| Start command | gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120 --access-logfile - --error-logfile - |

The `.python-version` file selects Python 3.13. The build script installs dependencies, collects static assets, and applies migrations. Free services lack the paid pre-deploy/shell workflow, so migrations run during the build for this isolated pilot. A failed migration fails the build. Database changes are not undone if a later deployment fails.

Add these Render environment variables:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
SECRET_KEY=<new-random-private-secret>
DATABASE_URL=<Neon-pooled-connection-string>
MIGRATION_DATABASE_URL=<Neon-direct-connection-string>
ALLOWED_HOSTS=<your-service>.onrender.com
TRUST_PROXY_SSL_HEADER=True
SECURE_SSL_REDIRECT=True
DB_DISABLE_SERVER_SIDE_CURSORS=True
DB_CONN_MAX_AGE=60
```

Generate a secret locally from the repository root:

```powershell
.\backend\venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(64))"
```

Use the actual hostname Render assigns, with no scheme/path. CORS/CSRF variables can remain empty until the frontend URL exists. After deployment, visit `https://<your-service>.onrender.com/api/users/health/`. The backend root `/` may correctly return 404.

## 4. Vercel frontend

Import the repository, select root `frontend`, framework Vite, install `npm ci`, build `npm run build`, output `dist`. Select your testing branch as this testing project's deployment branch.

Set the following variables for the deployment environment being used:

```dotenv
VITE_API_URL=https://<your-service>.onrender.com
VITE_API_TIMEOUT_MS=90000
```

Do not append `/api`. The 90-second timeout allows a sleeping test backend time to start; it does not make requests faster or automatically retry writes. Vercel must rebuild after environment-variable changes. Keep database credentials and Django secrets out of Vercel frontend variables.

## 5. Connect the domains

After Vercel assigns the frontend URL, add these variables to Render and redeploy:

```dotenv
CORS_ALLOWED_ORIGINS=https://<your-testing-project>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<your-testing-project>.vercel.app,https://<your-service>.onrender.com
```

Use exact origins, without trailing slashes. Add any additional test origin explicitly, comma-separated. Do not allow all Vercel preview domains indiscriminately.

## 6. Create the administrator without a Render shell

Render Free does not include SSH/shell access. Run Django's normal command locally against ONLY the new Neon testing database, after the build has migrated it. Open a NEW PowerShell terminal at the repository root so closing it discards the environment overrides:

```powershell
$env:DATABASE_URL = Read-Host 'Paste the DIRECT Neon TEST database connection string'
$env:SECRET_KEY = Read-Host 'Paste the Render Django SECRET_KEY'
$env:ALLOWED_HOSTS = 'localhost,127.0.0.1'
$env:CORS_ALLOWED_ORIGINS = ''
cd backend
.\venv\Scripts\python.exe manage.py createsuperuser --settings=config.settings.production
```

Use an uppercase identifier such as `TEST-ADMIN`. The command prompts for email, name, year level and password. Use synthetic details and a strong password. Do not paste credentials in chat or commit them. Close this terminal afterward, then log in on Vercel. No bootstrap password or account-creation route is embedded in the app.

## 7. Pilot checks

Verify login, direct-route refresh, houses, roster/ticket activation, event registration, check-in, merit totals, attendance CSV and archive/restore using synthetic records. After backend inactivity, allow time for its first request to complete. Do not use keep-alive traffic to evade service limits.

Start with a small group. Having 500 accounts is different from 500 simultaneous logins or registrations. Before inviting a large group, run a staged load test and check provider testing policies and quotas. The current deployment is not certified for 100–500 concurrent users.

References: [Render Django](https://render.com/docs/deploy-django), [Render Free limitations](https://render.com/docs/free), [Neon Django connection](https://neon.com/docs/guides/django), [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite).
