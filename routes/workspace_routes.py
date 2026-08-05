from flask import Blueprint, request, jsonify, g
import uuid
from db import get_connection
from auth import login_required
from email_service import send_email

workspace_bp = Blueprint("workspace", __name__)

@workspace_bp.route("", methods=["GET"])
@login_required
def get_workspaces():
    user_id = g.user["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT w.* 
                FROM Workspace w
                JOIN WorkspaceMember wm ON w.id = wm.workspaceId
                WHERE wm.userId = %s
            """, (user_id,))
            workspaces = cursor.fetchall()
            
            for w in workspaces:
                cursor.execute("""
                    SELECT wm.*, u.name as 'user.name', u.avatar as 'user.avatar', u.color as 'user.color'
                    FROM WorkspaceMember wm
                    JOIN User u ON wm.userId = u.id
                    WHERE wm.workspaceId = %s
                """, (w["id"],))
                members = cursor.fetchall()
                # Format to match frontend expectations
                for m in members:
                    m["user"] = {
                        "name": m.pop("user.name"),
                        "avatar": m.pop("user.avatar"),
                        "color": m.pop("user.color")
                    }
                w["members"] = members
                
                # Determine files based on language
                lang = w.get("language", "").lower()
                if lang == "python":
                    w["files"] = ["main.py", "requirements.txt", "README.md"]
                elif lang == "c":
                    w["files"] = ["main.c", "Makefile", "README.md"]
                elif lang == "java":
                    w["files"] = ["src/Main.java", "pom.xml", "README.md"]
                elif lang == "sql":
                    w["files"] = ["schema.sql", "queries.sql", "README.md"]
                else:
                    w["files"] = ["src/index.ts", "package.json", "docs/README.md"]
                
        return jsonify(workspaces)
    finally:
        conn.close()

@workspace_bp.route("", methods=["POST"])
@login_required
def create_workspace():
    data = request.json
    name = data.get("name")
    description = data.get("description", "")
    language = data.get("language", "typescript")
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
        
    workspace_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    user_id = g.user["id"]
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO Workspace (id, name, description, language) VALUES (%s, %s, %s, %s)",
                (workspace_id, name, description, language)
            )
            cursor.execute(
                "INSERT INTO WorkspaceMember (id, workspaceId, userId, role) VALUES (%s, %s, %s, 'owner')",
                (member_id, workspace_id, user_id)
            )
        return jsonify({"id": workspace_id, "name": name})
    finally:
        conn.close()

@workspace_bp.route("/<workspace_id>", methods=["GET"])
@login_required
def get_workspace(workspace_id):
    user_id = g.user["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s", (workspace_id, user_id))
            if not cursor.fetchone():
                return jsonify({"error": "Not found"}), 404
                
            cursor.execute("SELECT * FROM Workspace WHERE id = %s", (workspace_id,))
            workspace = cursor.fetchone()
            
            if not workspace:
                return jsonify({"error": "Not found"}), 404
                
            cursor.execute("""
                SELECT wm.*, u.name as 'user.name', u.avatar as 'user.avatar', u.color as 'user.color'
                FROM WorkspaceMember wm
                JOIN User u ON wm.userId = u.id
                WHERE wm.workspaceId = %s
            """, (workspace_id,))
            members = cursor.fetchall()
            for m in members:
                m["user"] = {
                    "name": m.pop("user.name"),
                    "avatar": m.pop("user.avatar"),
                    "color": m.pop("user.color")
                }
            workspace["members"] = members
            lang = workspace.get("language", "").lower()
            if lang == "python":
                workspace["files"] = ["main.py", "requirements.txt", "README.md"]
            elif lang == "c":
                workspace["files"] = ["main.c", "Makefile", "README.md"]
            elif lang == "java":
                workspace["files"] = ["src/Main.java", "pom.xml", "README.md"]
            elif lang == "sql":
                workspace["files"] = ["schema.sql", "queries.sql", "README.md"]
            else:
                workspace["files"] = ["src/index.ts", "package.json", "docs/README.md"]
            
            return jsonify(workspace)
    finally:
        conn.close()

@workspace_bp.route("/<workspace_id>/share", methods=["POST"])
@login_required
def share_workspace(workspace_id):
    email = request.json.get("email")
    role = request.json.get("role", "editor")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM User WHERE email = %s", (email,))
            target = cursor.fetchone()
            
            if not target:
                send_email(email, "Invitation to join CoFlux workspace", f"You have been invited to collaborate on a workspace. Register to join.")
                return jsonify({"success": True, "message": "Invitation email sent"})
                
            cursor.execute("SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s", (workspace_id, target["id"]))
            if cursor.fetchone():
                return jsonify({"error": "User already in workspace"}), 400
                
            cursor.execute(
                "INSERT INTO WorkspaceMember (id, workspaceId, userId, role) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), workspace_id, target["id"], role)
            )
            
            cursor.execute("SELECT name FROM Workspace WHERE id = %s", (workspace_id,))
            w_name = cursor.fetchone()["name"]
            
            send_email(email, f"You've been added to {w_name}", f"You can now access the workspace on CoFlux.")
            return jsonify({"success": True})
    finally:
        conn.close()
