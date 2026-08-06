import jwt
import datetime
from functools import wraps
from django.http import JsonResponse
from django.conf import settings
from coflux.db import get_connection


def generate_token(user_id: str) -> str:
    payload = {
        "userId": user_id,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def login_required(f):
    @wraps(f)
    def decorated_function(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"error": "Unauthorized"}, status=401)

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("userId")

            conn = get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM User WHERE id = %s", (user_id,))
                user = cursor.fetchone()
            conn.close()

            if not user:
                return JsonResponse({"error": "Unauthorized"}, status=401)

            # Attach user to the Django request object
            request.user_data = user
            return f(request, *args, **kwargs)

        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Token expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"error": "Invalid token"}, status=401)

    return decorated_function
