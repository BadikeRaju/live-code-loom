from flask import Blueprint, jsonify, request, g
from auth import login_required
from db import get_connection

notification_bp = Blueprint("notification", __name__)

@notification_bp.route("", methods=["GET"])
@login_required
def get_notifications():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, body, unread, 
                CASE 
                    WHEN TIMESTAMPDIFF(MINUTE, createdAt, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, createdAt, NOW()), 'm ago')
                    WHEN TIMESTAMPDIFF(HOUR, createdAt, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, createdAt, NOW()), 'h ago')
                    ELSE CONCAT(TIMESTAMPDIFF(DAY, createdAt, NOW()), 'd ago')
                END as `when`
                FROM Notification 
                WHERE userId = %s 
                ORDER BY createdAt DESC LIMIT 50
            """, (g.user["id"],))
            notifications = cursor.fetchall()
            return jsonify(notifications)
    finally:
        conn.close()

@notification_bp.route("/<notif_id>/read", methods=["POST"])
@login_required
def mark_read(notif_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE Notification SET unread = FALSE WHERE id = %s AND userId = %s", (notif_id, g.user["id"]))
            return jsonify({"success": True})
    finally:
        conn.close()
