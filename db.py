import pymysql
import pymysql.cursors
from config import DATABASE_URL
from urllib.parse import urlparse

def get_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set")
    
    parsed = urlparse(DATABASE_URL)
    
    return pymysql.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip("/"),
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl_mode": "REQUIRED"} if "aivencloud" in (parsed.hostname or "") else None,
        autocommit=True
    )

def init_db():
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
    """
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Upgrade avatar to LONGTEXT if needed (ignoring errors if it already is)
            try:
                cursor.execute("ALTER TABLE User MODIFY avatar LONGTEXT;")
            except Exception:
                pass

        with conn.cursor() as cursor:
            for stmt in schema.strip().split(';'):
                if stmt.strip():
                    cursor.execute(stmt)
        conn.close()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not initialize database schema: {e}")
