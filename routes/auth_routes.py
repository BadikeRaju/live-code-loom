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
