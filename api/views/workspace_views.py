import json
import uuid
import os
import subprocess
import tempfile
import requests as http_requests
import y_py as Y
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from coflux.db import get_connection
from coflux.auth_middleware import login_required
from coflux.email_service import send_email


def get_workspace_files(workspace_id, cursor):
    cursor.execute("SELECT filename FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
    initial = [row["filename"] for row in cursor.fetchall()]

    cursor.execute("SELECT filename FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
    docs = [row["filename"] for row in cursor.fetchall()]

    return list(set(initial + docs))


@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_workspaces(request):
    user_id = request.user_data["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT w.*
                FROM Workspace w
                JOIN WorkspaceMember wm ON w.id = wm.workspaceId
                WHERE wm.userId = %s
            """,
                (user_id,),
            )
            workspaces = cursor.fetchall()

            for w in workspaces:
                cursor.execute(
                    """
                    SELECT wm.*, u.name as 'user.name', u.avatar as 'user.avatar', u.color as 'user.color'
                    FROM WorkspaceMember wm
                    JOIN User u ON wm.userId = u.id
                    WHERE wm.workspaceId = %s
                """,
                    (w["id"],),
                )
                members = cursor.fetchall()
                for m in members:
                    m["user"] = {
                        "name": m.pop("user.name"),
                        "avatar": m.pop("user.avatar"),
                        "color": m.pop("user.color"),
                    }
                w["members"] = members

                files = get_workspace_files(w["id"], cursor)
                if not files:
                    lang = w.get("language", "").lower()
                    if lang == "python":
                        files = ["main.py", "requirements.txt", "README.md"]
                    elif lang == "c":
                        files = ["main.c", "Makefile", "README.md"]
                    elif lang == "java":
                        files = ["src/Main.java", "pom.xml", "README.md"]
                    elif lang == "sql":
                        files = ["schema.sql", "queries.sql", "README.md"]
                    else:
                        files = ["src/index.ts", "package.json", "docs/README.md"]
                w["files"] = files

        return JsonResponse(workspaces, safe=False)
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def create_workspace(request):
    data = json.loads(request.body)
    name = data.get("name")
    description = data.get("description", "")
    language = data.get("language", "typescript")
    repo_url = data.get("repoUrl")

    if not name:
        return JsonResponse({"error": "Name is required"}, status=400)

    workspace_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    user_id = request.user_data["id"]

    files_to_insert = []

    if repo_url:
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                subprocess.run(["git", "clone", "--depth", "1", repo_url, tmpdir], check=True, capture_output=True)
                for root, dirs, files in os.walk(tmpdir):
                    if ".git" in dirs:
                        dirs.remove(".git")
                    for file in files:
                        filepath = os.path.join(root, file)
                        relpath = os.path.relpath(filepath, tmpdir)
                        if os.path.getsize(filepath) > 5 * 1024 * 1024:
                            continue
                        try:
                            with open(filepath, "r", encoding="utf-8") as f:
                                files_to_insert.append((str(uuid.uuid4()), workspace_id, relpath, f.read()))
                        except UnicodeDecodeError:
                            pass
            except subprocess.CalledProcessError as e:
                err_msg = e.stderr.decode("utf-8", errors="ignore") if e.stderr else str(e)
                return JsonResponse({"error": f"Failed to clone repository: {err_msg}"}, status=400)
            except Exception as e:
                return JsonResponse({"error": f"Failed to clone repository: {str(e)}"}, status=400)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO Workspace (id, name, description, language, repoUrl) VALUES (%s, %s, %s, %s, %s)",
                (workspace_id, name, description, language, repo_url),
            )
            cursor.execute(
                "INSERT INTO WorkspaceMember (id, workspaceId, userId, role) VALUES (%s, %s, %s, 'owner')",
                (member_id, workspace_id, user_id),
            )

            for f in files_to_insert:
                cursor.execute(
                    "INSERT INTO WorkspaceFileContent (id, workspaceId, filename, content) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                    f,
                )

        return JsonResponse({"id": workspace_id, "name": name})
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def upload_files(request, workspace_id):
    data = json.loads(request.body)
    files = data.get("files", [])

    if not files:
        return JsonResponse({"error": "No files provided"}, status=400)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s",
                (workspace_id, request.user_data["id"]),
            )
            if not cursor.fetchone():
                return JsonResponse({"error": "Not authorized"}, status=403)

            for f in files:
                cursor.execute(
                    "INSERT INTO WorkspaceFileContent (id, workspaceId, filename, content) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                    (str(uuid.uuid4()), workspace_id, f["filename"], f["content"]),
                )
        return JsonResponse({"success": True})
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_initial_file_content(request, workspace_id, filename):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s",
                (workspace_id, request.user_data["id"]),
            )
            if not cursor.fetchone():
                return JsonResponse({"error": "Not authorized"}, status=403)

            cursor.execute(
                "SELECT content FROM WorkspaceFileContent WHERE workspaceId = %s AND filename = %s",
                (workspace_id, filename),
            )
            row = cursor.fetchone()
            if not row:
                return JsonResponse({"error": "File not found"}, status=404)

            return JsonResponse({"content": row["content"]})
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["GET"])
def get_workspace(request, workspace_id):
    user_id = request.user_data["id"]
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s",
                (workspace_id, user_id),
            )
            if not cursor.fetchone():
                return JsonResponse({"error": "Not found"}, status=404)

            cursor.execute("SELECT * FROM Workspace WHERE id = %s", (workspace_id,))
            workspace = cursor.fetchone()

            if not workspace:
                return JsonResponse({"error": "Not found"}, status=404)

            cursor.execute(
                """
                SELECT wm.*, u.name as 'user.name', u.avatar as 'user.avatar', u.color as 'user.color'
                FROM WorkspaceMember wm
                JOIN User u ON wm.userId = u.id
                WHERE wm.workspaceId = %s
            """,
                (workspace_id,),
            )
            members = cursor.fetchall()
            for m in members:
                m["user"] = {
                    "name": m.pop("user.name"),
                    "avatar": m.pop("user.avatar"),
                    "color": m.pop("user.color"),
                }
            workspace["members"] = members

            files = get_workspace_files(workspace_id, cursor)
            if not files:
                lang = workspace.get("language", "").lower()
                if lang == "python":
                    files = ["main.py", "requirements.txt", "README.md"]
                elif lang == "c":
                    files = ["main.c", "Makefile", "README.md"]
                elif lang == "java":
                    files = ["src/Main.java", "pom.xml", "README.md"]
                elif lang == "sql":
                    files = ["schema.sql", "queries.sql", "README.md"]
                else:
                    files = ["src/index.ts", "package.json", "docs/README.md"]
            workspace["files"] = files

            return JsonResponse(workspace)
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def share_workspace(request, workspace_id):
    data = json.loads(request.body)
    email = data.get("email")
    role = data.get("role", "editor")

    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM User WHERE email = %s", (email,))
            target = cursor.fetchone()

            if not target:
                send_email(email, "Invitation to join CoFlux workspace", "You have been invited to collaborate on a workspace. Register to join.")
                return JsonResponse({"success": True, "message": "Invitation email sent"})

            cursor.execute(
                "SELECT id FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s",
                (workspace_id, target["id"]),
            )
            if cursor.fetchone():
                return JsonResponse({"error": "User already in workspace"}, status=400)

            cursor.execute(
                "INSERT INTO WorkspaceMember (id, workspaceId, userId, role) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), workspace_id, target["id"], role),
            )

            cursor.execute("SELECT name FROM Workspace WHERE id = %s", (workspace_id,))
            w_name = cursor.fetchone()["name"]

            # Insert Notification
            cursor.execute(
                "INSERT INTO Notification (id, userId, title, body) VALUES (%s, %s, %s, %s)",
                (str(uuid.uuid4()), target["id"], "Workspace Invite", f"{request.user_data['name']} invited you to '{w_name}'"),
            )

            send_email(email, f"You've been added to {w_name}", "You can now access the workspace on CoFlux.")

            cursor.execute("SELECT name, avatar, color FROM User WHERE id = %s", (target["id"],))
            user_info = cursor.fetchone()

            return JsonResponse({
                "success": True,
                "member": {
                    "userId": target["id"],
                    "role": role,
                    "user": {
                        "name": user_info["name"],
                        "avatar": user_info["avatar"],
                        "color": user_info["color"],
                    },
                },
            })
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def commit_and_push(request, workspace_id):
    data = json.loads(request.body)
    msg = data.get("message", "Commit from CoFlux")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Get user's githubToken
            cursor.execute("SELECT githubToken FROM User WHERE id = %s", (request.user_data["id"],))
            token_row = cursor.fetchone()
            if not token_row or not token_row.get("githubToken"):
                return JsonResponse({"error": "GitHub Personal Access Token is required. Please set it in Settings."}, status=400)
            token = token_row["githubToken"]

            # 2. Get workspace repoUrl
            cursor.execute("SELECT repoUrl FROM Workspace WHERE id = %s", (workspace_id,))
            ws_row = cursor.fetchone()
            if not ws_row or not ws_row.get("repoUrl"):
                return JsonResponse({"error": "Workspace is not linked to a GitHub repository."}, status=400)
            repo_url = ws_row["repoUrl"]

            # Extract owner/repo from url
            clean_repo_url = repo_url[:-4] if repo_url.endswith(".git") else repo_url
            parts = clean_repo_url.split("/")
            if len(parts) < 2:
                return JsonResponse({"error": "Invalid repoUrl"}, status=400)
            owner_repo = f"{parts[-2]}/{parts[-1]}"

            # 3. Get all files
            files_content = {}
            cursor.execute("SELECT filename, content FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
            for row in cursor.fetchall():
                files_content[row["filename"]] = row["content"]

            cursor.execute("SELECT filename, state FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
            for row in cursor.fetchall():
                if row["state"]:
                    doc = Y.YDoc()
                    try:
                        Y.apply_update(doc, bytes(row["state"]))
                        text = doc.get_text(row["filename"])
                        files_content[row["filename"]] = str(text)
                    except Exception:
                        pass

            if not files_content:
                return JsonResponse({"error": "No files to commit"}, status=400)

            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
            api_base = f"https://api.github.com/repos/{owner_repo}"

            # A) Get latest commit SHA on main
            res = http_requests.get(f"{api_base}/git/refs/heads/main", headers=headers)
            if res.status_code != 200:
                res = http_requests.get(f"{api_base}/git/refs/heads/master", headers=headers)
                if res.status_code != 200:
                    return JsonResponse({"error": f"Failed to fetch branch ref: {res.text}"}, status=400)
            ref_data = res.json()
            commit_sha = ref_data["object"]["sha"]
            branch_ref = ref_data["ref"]

            # Fetch the commit to get its tree SHA
            res = http_requests.get(f"{api_base}/git/commits/{commit_sha}", headers=headers)
            if res.status_code != 200:
                return JsonResponse({"error": f"Failed to fetch commit: {res.text}"}, status=400)
            commit_data = res.json()
            base_tree_sha = commit_data["tree"]["sha"]

            # B) Create Tree
            tree = []
            for filepath, content in files_content.items():
                tree.append({"path": filepath, "mode": "100644", "type": "blob", "content": content})

            res = http_requests.post(f"{api_base}/git/trees", headers=headers, json={"base_tree": base_tree_sha, "tree": tree})
            if res.status_code != 201:
                return JsonResponse({"error": f"Failed to create tree: {res.text}"}, status=400)
            new_tree_sha = res.json()["sha"]

            # C) Create Commit
            res = http_requests.post(
                f"{api_base}/git/commits",
                headers=headers,
                json={"message": msg, "tree": new_tree_sha, "parents": [commit_sha]},
            )
            if res.status_code != 201:
                return JsonResponse({"error": f"Failed to create commit: {res.text}"}, status=400)
            new_commit_sha = res.json()["sha"]

            # D) Update Ref
            res = http_requests.patch(f"{api_base}/git/{branch_ref}", headers=headers, json={"sha": new_commit_sha})
            if res.status_code != 200:
                return JsonResponse({"error": f"Failed to push commit: {res.text}"}, status=400)

            return JsonResponse({"success": True, "sha": new_commit_sha})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        conn.close()


@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def delete_workspace(request, workspace_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT role FROM WorkspaceMember WHERE workspaceId = %s AND userId = %s",
                (workspace_id, request.user_data["id"]),
            )
            row = cursor.fetchone()
            if not row or row["role"] != "owner":
                return JsonResponse({"error": "Only the workspace owner can delete it"}, status=403)

            cursor.execute("DELETE FROM DocumentState WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM WorkspaceFileContent WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM WorkspaceMember WHERE workspaceId = %s", (workspace_id,))
            cursor.execute("DELETE FROM Workspace WHERE id = %s", (workspace_id,))

            return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        conn.close()
