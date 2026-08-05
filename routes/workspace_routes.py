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
            
            # Insert Notification
            cursor.execute(
                "INSERT INTO Notification (id, userId, title, body) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), target["id"], "Workspace Invite", f"{g.user['name']} invited you to '{w_name}'")
            )
            
            send_email(email, f"You've been added to {w_name}", f"You can now access the workspace on CoFlux.")
            
            # Fetch target user details to return to frontend
            cursor.execute("SELECT name, avatar, color FROM User WHERE id = %s", (target["id"],))
            user_info = cursor.fetchone()
            
            return jsonify({
                "success": True, 
                "member": {
                    "userId": target["id"],
                    "role": role,
                    "user": {
                        "name": user_info["name"],
                        "avatar": user_info["avatar"],
                        "color": user_info["color"]
                    }
                }
            })
    finally:
        conn.close()

import requests
import base64
import y_py as Y

@workspace_bp.route("/<workspace_id>/commit", methods=["POST"])
@login_required
def commit_and_push(workspace_id):
    msg = request.json.get("message", "Commit from CoFlux")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Get user's githubToken
            cursor.execute("SELECT githubToken FROM User WHERE id = %s", (g.user["id"],))
            token_row = cursor.fetchone()
            github_token_encoded = token_row.get("githubToken") if token_row else None
        
            if not github_token_encoded:
                return jsonify({"error": "GitHub PAT is required. Connect it in Settings."}), 400
                
            try:
                token = base64.b64decode(github_token_encoded).decode("utf-8")
            except:
                token = github_token_encoded # fallback if not base64 encoded
            
            # 2. Get workspace repoUrl
            cursor.execute("SELECT repoUrl FROM Workspace WHERE id = %s", (workspace_id,))
            ws_row = cursor.fetchone()
            if not ws_row or not ws_row.get("repoUrl"):
                return jsonify({"error": "Workspace is not linked to a GitHub repository."}), 400
            repo_url = ws_row["repoUrl"]
            
            # Extract owner/repo from url: https://github.com/owner/repo.git
            parts = repo_url.rstrip(".git").split("/")
            if len(parts) < 2: return jsonify({"error": "Invalid repoUrl"}), 400
            owner_repo = f"{parts[-2]}/{parts[-1]}"
            
            # 3. Get all files
            files_content = {}
            # Base files
            cursor.execute("SELECT filename, content FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
            for row in cursor.fetchall():
                files_content[row["filename"]] = row["content"]
                
            # Live edits
            cursor.execute("SELECT filename, state FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
            for row in cursor.fetchall():
                if row["state"]:
                    doc = Y.YDoc()
                    try:
                        Y.apply_update(doc, bytes(row["state"]))
                        text = doc.get_text(row["filename"])
                        files_content[row["filename"]] = str(text)
                    except:
                        pass
                        
            if not files_content:
                return jsonify({"error": "No files to commit"}), 400

            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
            api_base = f"https://api.github.com/repos/{owner_repo}"
            
            # A) Get latest commit SHA on main
            res = requests.get(f"{api_base}/git/refs/heads/main", headers=headers)
            if res.status_code != 200:
                # Try master
                res = requests.get(f"{api_base}/git/refs/heads/master", headers=headers)
                if res.status_code != 200:
                    return jsonify({"error": f"Failed to fetch branch ref: {res.text}"}), 400
            ref_data = res.json()
            base_tree_sha = ref_data["object"]["sha"]
            branch_ref = ref_data["ref"]
            
            # B) Create Tree
            tree = []
            for filepath, content in files_content.items():
                tree.append({
                    "path": filepath,
                    "mode": "100644",
                    "type": "blob",
                    "content": content
                })
                
            res = requests.post(f"{api_base}/git/trees", headers=headers, json={"base_tree": base_tree_sha, "tree": tree})
            if res.status_code != 201: return jsonify({"error": f"Failed to create tree: {res.text}"}), 400
            new_tree_sha = res.json()["sha"]
            
            # C) Create Commit
            res = requests.post(f"{api_base}/git/commits", headers=headers, json={
                "message": msg,
                "tree": new_tree_sha,
                "parents": [base_tree_sha]
            })
            if res.status_code != 201: return jsonify({"error": f"Failed to create commit: {res.text}"}), 400
            new_commit_sha = res.json()["sha"]
            
            # D) Update Ref
            res = requests.patch(f"{api_base}/git/{branch_ref}", headers=headers, json={"sha": new_commit_sha})
            if res.status_code != 200: return jsonify({"error": f"Failed to push commit: {res.text}"}), 400
            
            return jsonify({"success": True, "sha": new_commit_sha})
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@workspace_bp.route("/<workspace_id>", methods=["DELETE"])
@login_required
def delete_workspace(workspace_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check if user is owner
            cursor.execute("SELECT role FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s", (workspace_id, g.user["id"]))
            row = cursor.fetchone()
            if not row or row["role"] != "owner":
                return jsonify({"error": "Only the workspace owner can delete it"}), 403
            
            # Delete related data
            cursor.execute("DELETE FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM WorkspaceMember WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM Workspace WHERE id = %s", (workspace_id,))
            
            return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
