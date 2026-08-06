import requests

repo = "BadikeRaju/live-code-loom"
headers = {
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

tree = [{"path": "src/index.ts", "mode": "100644", "type": "blob", "content": "Hello World"}]
res = requests.post(f"https://api.github.com/repos/{repo}/git/trees", headers=headers, json={"base_tree": "0000000000000000000000000000000000000000", "tree": tree})
print("Status:", res.status_code)
print("Response:", res.text)
