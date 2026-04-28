To test run in mobile:
    !Make sure that your laptop and mobile is connected to the same wifi

    in backend/apps/config/settings/development.py:
    CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # adjust if your Vite dev server is on another port
    'http://127.0.0.1:5173',
    'http://<IP of your laptop>:5173',
]
    in frontend run: npx vite --host
    in backend run: python manage.py 0.0.0.0:8000