from flask import Blueprint, request, jsonify, g
import bcrypt
import uuid
from db import get_connection
from auth import generate_token, login_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields"}), 400
        
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_id = str(uuid.uuid4())
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check if exists
            cursor.execute("SELECT id FROM User WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "User already exists"}), 400
                
            cursor.execute(
                "INSERT INTO User (id, email, password, name, color) VALUES (%s, %s, %s, %s, %s)",
                (user_id, email, hashed, name, "#10b981")
            )
        token = generate_token(user_id)
        return jsonify({"token": token, "user": {"id": user_id, "email": email, "name": name}})
    finally:
        conn.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM User WHERE email = %s", (email,))
            user = cursor.fetchone()
            
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            return jsonify({"error": "Invalid credentials"}), 401
            
        token = generate_token(user["id"])
        # Remove password hash from response
        user.pop("password", None)
        return jsonify({"token": token, "user": user})
    finally:
        conn.close()

@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    user = dict(g.user)
    user.pop("password", None)
    return jsonify({"user": user})

@auth_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.json
    name = data.get("name")
    avatar = data.get("avatar")
    github_token = data.get("githubToken")
    user_id = g.user["id"]
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
        
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE User SET name = %s, avatar = %s, githubToken = %s WHERE id = %s",
                (name, avatar, github_token, user_id)
            )
            # Fetch updated user
            cursor.execute("SELECT * FROM User WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if user:
                user.pop("password", None)
            return jsonify({"success": True, "user": user})
    finally:
        conn.close()

@auth_bp.route("/account", methods=["DELETE"])
@login_required
def delete_account():
    user_id = g.user["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Delete user's workspaces
            cursor.execute("SELECT id FROM Workspace WHERE id IN (SELECT workspaceId FROM WorkspaceMember WHERE userId = %s AND role = 'owner')", (user_id,))
            workspaces = cursor.fetchall()
            for w in workspaces:
                w_id = w["id"]
                cursor.execute("DELETE FROM DocumentState WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM WorkspaceFileContent WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM WorkspaceMember WHERE workspaceId = %s", (w_id,))
                cursor.execute("DELETE FROM Workspace WHERE id = %s", (w_id,))
            
            # Delete user from other workspaces they joined
            cursor.execute("DELETE FROM WorkspaceMember WHERE userId = %s", (user_id,))
            
            # Delete notifications
            cursor.execute("DELETE FROM Notification WHERE userId = %s", (user_id,))
            
            # Delete the user
            cursor.execute("DELETE FROM User WHERE id = %s", (user_id,))
            
            return jsonify({"success": True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

