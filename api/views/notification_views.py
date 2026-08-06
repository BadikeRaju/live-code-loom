import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from coflux.db import get_connection
from coflux.auth_middleware import login_required


@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_notifications(request):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, body, unread,
                CASE
                    WHEN TIMESTAMPDIFF(MINUTE, createdAt, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, createdAt, NOW()), 'm ago')
                    WHEN TIMESTAMPDIFF(HOUR, createdAt, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, createdAt, NOW()), 'h ago')
                    ELSE CONCAT(TIMESTAMPDIFF(DAY, createdAt, NOW()), 'd ago')
                END as `when`
                FROM Notification
                WHERE userId = %s
                ORDER BY createdAt DESC LIMIT 50
            """,
                (request.user_data["id"],),
            )
            notifications = cursor.fetchall()
            return JsonResponse(notifications, safe=False)
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def mark_read(request, notif_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE Notification SET unread = FALSE WHERE id = %s AND userId = %s",
                (notif_id, request.user_data["id"]),
            )
            return JsonResponse({"success": True})
    finally:
        conn.close()
