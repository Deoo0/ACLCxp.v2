To test on mobile:
- Make sure that your laptop and mobile device are connected to the same Wi-Fi network.

In `backend/apps/config/settings/development.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # adjust if your Vite dev server is on another port
    'http://127.0.0.1:5173',
    'http://<IP of your laptop>:5173',
]
```

Frontend:
```bash
cd frontend
npm install
npm run dev -- --host
```

Backend:
```bash
python manage.py runserver
```
