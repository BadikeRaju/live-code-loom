import requests
import os

token = os.getenv("GITHUB_TOKEN") or "" # I don't have a token, but I can try without one
repo = "BadikeRaju/live-code-loom"
headers = {
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

# 1. Fetch refs
print("Fetching refs...")
res = requests.get(f"https://api.github.com/repos/{repo}/git/refs/heads/main", headers=headers)
print("Refs status:", res.status_code)
if res.status_code == 200:
    ref_data = res.json()
    commit_sha = ref_data["object"]["sha"]
    print("Commit SHA:", commit_sha)
    
    # 2. Fetch commit
    res = requests.get(f"https://api.github.com/repos/{repo}/git/commits/{commit_sha}", headers=headers)
    print("Commit status:", res.status_code)
    commit_data = res.json()
    tree_sha = commit_data["tree"]["sha"]
    print("Tree SHA:", tree_sha)
    
    # 3. Create tree WITHOUT token (should be 404 or 401)
    tree = [{"path": "test.txt", "mode": "100644", "type": "blob", "content": "Hello World"}]
    res = requests.post(f"https://api.github.com/repos/{repo}/git/trees", headers=headers, json={"base_tree": tree_sha, "tree": tree})
    print("Create Tree status (no token):", res.status_code)
    print("Response:", res.text)
