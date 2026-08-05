from flask import Blueprint, jsonify
from auth import login_required

notification_bp = Blueprint("notification", __name__)

@notification_bp.route("", methods=["GET"])
@login_required
def get_notifications():
    # Return mock data matching what frontend expects
    return jsonify([
        {
            "id": "1",
            "title": "New Comment",
            "body": "Alex mentioned you in router.ts",
            "when": "2m ago",
            "unread": True
        },
        {
            "id": "2",
            "title": "Workspace Invite",
            "body": "Sarah invited you to 'Project Phoenix'",
            "when": "1h ago",
            "unread": False
        }
    ])
