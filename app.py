import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sock import Sock
from db import init_db

from routes.auth_routes import auth_bp
from routes.workspace_routes import workspace_bp
from routes.notification_routes import notification_bp
from yjs_ws import register_websockets

app = Flask(__name__, static_folder="dist/assets")
CORS(app)
sock = Sock(app)

# Initialize database schema
init_db()

# Register WebSockets
register_websockets(sock)

# API Routes
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(workspace_bp, url_prefix="/api/workspaces")
app.register_blueprint(notification_bp, url_prefix="/api/notifications")

# Serve React static assets (JS/CSS)
@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory('dist/assets', path)

# Serve static files from dist root (e.g. favicon.ico, sitemap.xml)
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('dist', path)):
        return send_from_directory('dist', path)
    return serve_index()

# Catch-all route to serve the React SPA entry point
@app.route('/', defaults={'path': ''})
def serve_index(path=''):
    return send_from_directory('dist', 'index.html')

if __name__ == "__main__":
    port = int(os.getenv("PORT", "1234"))
    print(f"Starting Flask server on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
