import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-coflux-key")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.staticfiles",
    "corsheaders",
    "api",
    "realtime",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "coflux.middleware.ApiExceptionMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = ["*"]

ROOT_URLCONF = "coflux.urls"

ASGI_APPLICATION = "coflux.asgi.application"

# ── Database (raw PyMySQL — same as before) ──
DATABASE_URL = os.getenv("DATABASE_URL")

def _parse_db_url(url):
    if not url:
        return {}
    parsed = urlparse(url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
        "ssl": any(cloud in (parsed.hostname or "") for cloud in ["aivencloud", "tidbcloud"]),
    }

DB_PARAMS = _parse_db_url(DATABASE_URL)

# We keep raw PyMySQL for all queries (no Django ORM migrations needed)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ── JWT ──
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-coflux-key")

# ── SMTP ──
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

# ── Static files (serve built React SPA) ──
STATIC_URL = "/assets/"
STATICFILES_DIRS = [
    BASE_DIR / "dist" / "assets",
]
STATIC_ROOT = BASE_DIR / "staticfiles"

# ── Channel Layers (in-memory for now) ──
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# Silence Django system checks we don't need
SILENCED_SYSTEM_CHECKS = ["urls.W002"]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
