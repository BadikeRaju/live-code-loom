from flask import Blueprint, request, jsonify, g
import uuid
import os
import subprocess
import tempfile
from db import get_connection
from auth import login_required
from email_service import send_email

workspace_bp = Blueprint("workspace", __name__)

def get_workspace_files(workspace_id, cursor):
    cursor.execute("SELECT filename FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
    initial = [row["filename"] for row in cursor.fetchall()]
    
    cursor.execute("SELECT filename FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
    docs = [row["filename"] for row in cursor.fetchall()]
    
    combined = list(set(initial + docs))
    return combined

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
                for m in members:
                    m["user"] = {
                        "name": m.pop("user.name"),
                        "avatar": m.pop("user.avatar"),
                        "color": m.pop("user.color")
                    }
                w["members"] = members
                
                files = get_workspace_files(w["id"], cursor)
                if not files:
                    lang = w.get("language", "").lower()
                    if lang == "python": files = ["main.py", "requirements.txt", "README.md"]
                    elif lang == "c": files = ["main.c", "Makefile", "README.md"]
                    elif lang == "java": files = ["src/Main.java", "pom.xml", "README.md"]
                    elif lang == "sql": files = ["schema.sql", "queries.sql", "README.md"]
                    else: files = ["src/index.ts", "package.json", "docs/README.md"]
                w["files"] = files
                
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
    repo_url = data.get("repoUrl")
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
        
    workspace_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    user_id = g.user["id"]
    
    files_to_insert = []
    
    if repo_url:
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                subprocess.run(["git", "clone", "--depth", "1", repo_url, tmpdir], check=True, capture_output=True)
                for root, dirs, files in os.walk(tmpdir):
                    if '.git' in dirs:
                        dirs.remove('.git')
                    for file in files:
                        filepath = os.path.join(root, file)
                        relpath = os.path.relpath(filepath, tmpdir)
                        if os.path.getsize(filepath) > 5 * 1024 * 1024:
                            continue
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                files_to_insert.append((str(uuid.uuid4()), workspace_id, relpath, f.read()))
                        except UnicodeDecodeError:
                            pass
            except Exception as e:
                return jsonify({"error": f"Failed to clone repository: {str(e)}"}), 400
    
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
            
            for f in files_to_insert:
                cursor.execute(
                    "INSERT INTO WorkspaceFileContent (id, workspaceId, filename, content) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                    f
                )
                
        return jsonify({"id": workspace_id, "name": name})
    finally:
        conn.close()

@workspace_bp.route("/<workspace_id>/files", methods=["POST"])
@login_required
def upload_files(workspace_id):
    data = request.json
    files = data.get("files", [])
    
    if not files:
        return jsonify({"error": "No files provided"}), 400
        
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check permission
            cursor.execute("SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s", (workspace_id, g.user["id"]))
            if not cursor.fetchone():
                return jsonify({"error": "Not authorized"}), 403
                
            for f in files:
                cursor.execute(
                    "INSERT INTO WorkspaceFileContent (id, workspaceId, filename, content) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                    (str(uuid.uuid4()), workspace_id, f["filename"], f["content"])
                )
        return jsonify({"success": True})
    finally:
        conn.close()

@workspace_bp.route("/<workspace_id>/files/<path:filename>/initial", methods=["GET"])
@login_required
def get_initial_file_content(workspace_id, filename):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check permission
            cursor.execute("SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s", (workspace_id, g.user["id"]))
            if not cursor.fetchone():
                return jsonify({"error": "Not authorized"}), 403
                
            cursor.execute("SELECT content FROM WorkspaceFileContent WHERE workspaceId = %s AND filename = %s", (workspace_id, filename))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "File not found"}), 404
                
            return jsonify({"content": row["content"]})
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
            
            files = get_workspace_files(workspace_id, cursor)
            if not files:
                lang = workspace.get("language", "").lower()
                if lang == "python": files = ["main.py", "requirements.txt", "README.md"]
                elif lang == "c": files = ["main.c", "Makefile", "README.md"]
                elif lang == "java": files = ["src/Main.java", "pom.xml", "README.md"]
                elif lang == "sql": files = ["schema.sql", "queries.sql", "README.md"]
                else: files = ["src/index.ts", "package.json", "docs/README.md"]
            workspace["files"] = files
            
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
