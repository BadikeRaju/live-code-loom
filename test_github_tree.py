import requests
import json

repo = "BadikeRaju/live-code-loom"
# Use a public repo that has commits
headers = {
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

res = requests.get(f"https://api.github.com/repos/{repo}/git/refs/heads/main", headers=headers)
if res.status_code == 200:
    ref_data = res.json()
    commit_sha = ref_data["object"]["sha"]
    
    res = requests.get(f"https://api.github.com/repos/{repo}/git/commits/{commit_sha}", headers=headers)
    tree_sha = res.json()["tree"]["sha"]
    
    tree = [{"path": "src/index.ts", "mode": "100644", "type": "blob", "content": "Hello World"}]
    # POST to a public repo without token (simulating lack of write access)
    res = requests.post(f"https://api.github.com/repos/{repo}/git/trees", headers=headers, json={"base_tree": tree_sha, "tree": tree})
    print("Status:", res.status_code)
    print("Response:", res.text)
else:
    print("Failed to get refs", res.status_code)
