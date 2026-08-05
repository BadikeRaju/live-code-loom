import jwt
import datetime
from functools import wraps
from flask import request, jsonify, g
from config import JWT_SECRET
from db import get_connection

def generate_token(user_id: str) -> str:
    payload = {
        "userId": user_id,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("userId")
            
            conn = get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM User WHERE id = %s", (user_id,))
                user = cursor.fetchone()
            conn.close()
            
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
                
            # Store user in Flask's global g context for this request
            g.user = user
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
    return decorated_function
