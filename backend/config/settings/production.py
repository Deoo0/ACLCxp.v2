from .base import *

DEBUG = False
# Neon uses transaction pooling; streaming CSV queries cannot hold server cursors.
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = config("DB_DISABLE_SERVER_SIDE_CURSORS", default=True, cast=bool)
DATABASES["default"]["CONN_MAX_AGE"] = config("DB_CONN_MAX_AGE", default=60, cast=int)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True
# Render supplies its hostname even when ALLOWED_HOSTS is not explicitly set.
ALLOWED_HOSTS = [host.strip() for host in config("ALLOWED_HOSTS", default="").split(",") if host.strip()]
render_hostname = config("RENDER_EXTERNAL_HOSTNAME", default="").strip()
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in config("CORS_ALLOWED_ORIGINS", default="").split(",") if origin.strip()]
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in config("CSRF_TRUSTED_ORIGINS", default="").split(",") if origin.strip()]
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=3600, cast=int)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
if config("TRUST_PROXY_SSL_HEADER", default=False, cast=bool):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
STATIC_ROOT = BASE_DIR.parent / "staticfiles"
STORAGES = {"default": {"BACKEND": "apps.core.storage.DatabaseMediaStorage"},
            "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}}
