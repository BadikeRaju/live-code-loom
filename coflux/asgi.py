import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "coflux.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from realtime.routing import websocket_urlpatterns
from coflux.db import init_db

# Initialize MySQL schema on startup
init_db()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
