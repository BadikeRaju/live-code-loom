import json
import bcrypt
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from coflux.db import get_connection
from coflux.auth_middleware import generate_token, login_required


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password or not name:
        return JsonResponse({"error": "Missing required fields"}, status=400)

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = str(uuid.uuid4())

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM User WHERE email = %s", (email,))
            if cursor.fetchone():
                return JsonResponse({"error": "User already exists"}, status=400)

            cursor.execute(
                "INSERT INTO User (id, email, password, name, color) VALUES (%s, %s, %s, %s, %s)",
                (user_id, email, hashed, name, "#10b981"),
            )
        token = generate_token(user_id)
        return JsonResponse({"token": token, "user": {"id": user_id, "email": email, "name": name}})
    finally:
        conn.close()


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM User WHERE email = %s", (email,))
            user = cursor.fetchone()

        if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        token = generate_token(user["id"])
        user.pop("password", None)
        return JsonResponse({"token": token, "user": user})
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_me(request):
    user = dict(request.user_data)
    user.pop("password", None)
    return JsonResponse({"user": user})


@csrf_exempt
@login_required
@require_http_methods(["PUT"])
def update_profile(request):
    data = json.loads(request.body)
    name = data.get("name")
    avatar = data.get("avatar")
    github_token = data.get("githubToken")
    user_id = request.user_data["id"]

    if not name:
        return JsonResponse({"error": "Name is required"}, status=400)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE User SET name = %s, avatar = %s, githubToken = %s WHERE id = %s",
                (name, avatar, github_token, user_id),
            )
            cursor.execute("SELECT * FROM User WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if user:
                user.pop("password", None)
            return JsonResponse({"success": True, "user": user})
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def delete_account(request):
    user_id = request.user_data["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM Workspace WHERE id IN (SELECT workspaceId FROM WorkspaceMember WHERE userId = %s AND role = 'owner')",
                (user_id,),
            )
            workspaces = cursor.fetchall()
            for w in workspaces:
                w_id = w["id"]
                cursor.execute("DELETE FROM DocumentState WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM WorkspaceFileContent WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM WorkspaceMember WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM Workspace WHERE id = %s", (w_id,))

            cursor.execute("DELETE FROM WorkspaceMember WHERE userId = %s", (user_id,))
            cursor.execute("DELETE FROM Notification WHERE userId = %s", (user_id,))
            cursor.execute("DELETE FROM User WHERE id = %s", (user_id,))

            return JsonResponse({"success": True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        conn.close()
