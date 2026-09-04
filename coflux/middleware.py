import traceback
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

class ApiExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if request.path.startswith('/api/'):
            logger.error("API Error: %s", exception, exc_info=True)
            return JsonResponse(
                {
                    "error": "Internal Server Error",
                    "details": str(exception)
                },
                status=500
            )
        return None
