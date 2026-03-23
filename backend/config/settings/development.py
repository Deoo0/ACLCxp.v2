from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # adjust if your Vite dev server is on another port
    'http://127.0.0.1:5173',
]

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600
    )
}

AUTH_USER_MODEL = 'users.User'