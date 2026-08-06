import os
from django.urls import path, include, re_path
from django.http import JsonResponse, FileResponse, Http404
from django.views.static import serve
from django.conf import settings


def health_check(request):
    return JsonResponse({"status": "up", "service": "live-code-loom"})


def serve_index(request, path=""):
    index_path = os.path.join(settings.BASE_DIR, "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(open(index_path, "rb"), content_type="text/html")
    raise Http404("index.html not found")


def serve_dist_file(request, path):
    """Serve any file from the dist/ directory (favicon, sitemap, etc.)."""
    file_path = os.path.join(settings.BASE_DIR, "dist", path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(open(file_path, "rb"))
    # Fall through to SPA
    return serve_index(request)


urlpatterns = [
    # API
    path("api/health", health_check),
    path("api/", include("api.urls")),

    # Serve built React assets
    re_path(r"^assets/(?P<path>.*)$", serve, {"document_root": os.path.join(settings.BASE_DIR, "dist", "assets")}),

    # Catch-all: try dist file first, then fall back to SPA index.html
    re_path(r"^(?P<path>.+)$", serve_dist_file),
    path("", serve_index),
]
