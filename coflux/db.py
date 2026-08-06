import pymysql
import pymysql.cursors
from django.conf import settings


def get_connection():
    """Return a raw PyMySQL connection using the parsed DATABASE_URL."""
    params = settings.DB_PARAMS
    if not params:
        raise ValueError("DATABASE_URL is not set")

    return pymysql.connect(
        host=params["host"],
        port=params["port"],
        user=params["user"],
        password=params["password"],
        database=params["database"],
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl_mode": "REQUIRED"} if params.get("ssl") else None,
        autocommit=True,
    )


def init_db():
    """Create tables and run migrations on startup — identical to the old db.py."""
    schema = """
    CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(191) NOT NULL,
        name VARCHAR(191) NOT NULL,
        color VARCHAR(191),
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Workspace (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        description TEXT,
        language VARCHAR(191) DEFAULT 'typescript',
        visibility ENUM('public', 'private') DEFAULT 'private',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        archived BOOLEAN DEFAULT FALSE,
        starred BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS WorkspaceMember (
        id VARCHAR(191) PRIMARY KEY,
        workspaceId VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        role ENUM('owner', 'editor', 'viewer') DEFAULT 'viewer',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY workspace_user_idx (workspaceId, userId)
    );

    CREATE TABLE IF NOT EXISTS DocumentState (
        id VARCHAR(191) PRIMARY KEY,
        workspaceId VARCHAR(191) NOT NULL,
        filename VARCHAR(191) NOT NULL,
        state LONGBLOB,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY doc_idx (workspaceId, filename)
    );

    CREATE TABLE IF NOT EXISTS WorkspaceFileContent (
        id VARCHAR(191) PRIMARY KEY,
        workspaceId VARCHAR(191) NOT NULL,
        filename VARCHAR(191) NOT NULL,
        content LONGTEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY wfile_idx (workspaceId, filename)
    );

    CREATE TABLE IF NOT EXISTS Notification (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        body TEXT,
        unread BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Schema upgrades (safe to re-run)
            try:
                cursor.execute("ALTER TABLE User MODIFY avatar LONGTEXT;")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE User ADD COLUMN githubToken VARCHAR(255);")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE Workspace ADD COLUMN repoUrl VARCHAR(255);")
            except Exception:
                pass

        with conn.cursor() as cursor:
            for stmt in schema.strip().split(";"):
                if stmt.strip():
                    cursor.execute(stmt)
        conn.close()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not initialize database schema: {e}")
