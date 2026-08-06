from django.urls import re_path
from realtime.consumers import YjsConsumer

websocket_urlpatterns = [
    re_path(r"^(?P<doc_name>.+)$", YjsConsumer.as_asgi()),
]
