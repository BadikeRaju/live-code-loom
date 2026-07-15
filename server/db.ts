import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbUri = process.env.DATABASE_URL || "";
let host = "localhost";
let port = 3306;
let user = "root";
let password = "";
let database = "";
let ssl: any = undefined;

if (dbUri.startsWith("mysql://")) {
  try {
    const url = new URL(dbUri);
    host = url.hostname;
    port = url.port ? parseInt(url.port, 10) : 3306;
    user = url.username;
    password = decodeURIComponent(url.password);
    database = url.pathname.replace(/^\//, "");
    
    // Cloud databases like Aiven require SSL. Enable it for remote hosts.
    if (url.searchParams.get("ssl-mode") === "REQUIRED" || !["localhost", "127.0.0.1"].includes(host)) {
      ssl = {
        rejectUnauthorized: false
      };
    }
  } catch (err) {
    console.error("Failed to parse DATABASE_URL with URL constructor, falling back to manual parsing", err);
    const cleanUri = dbUri.replace("mysql://", "");
    const [credentials, hostAndDb] = cleanUri.split("@");
    const [dbUser, dbPassword] = credentials.split(":");
    const [hostPort, dbName] = hostAndDb.split("/");
    const [dbHost, dbPort] = hostPort.split(":");
    host = dbHost;
    port = parseInt(dbPort || "3306", 10);
    user = dbUser;
    password = decodeURIComponent(dbPassword || "");
    database = dbName ? dbName.split("?")[0] : "";
  }
}

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  console.log("Initializing database schema...");
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS User (
      id VARCHAR(191) PRIMARY KEY,
      email VARCHAR(191) UNIQUE NOT NULL,
      password VARCHAR(191) NOT NULL,
      name VARCHAR(191),
      avatar VARCHAR(191),
      color VARCHAR(191),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Workspace (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      description TEXT,
      language VARCHAR(191) NOT NULL,
      starred BOOLEAN DEFAULT false,
      archived BOOLEAN DEFAULT false,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS WorkspaceMember (
      id VARCHAR(191) PRIMARY KEY,
      role VARCHAR(191) DEFAULT 'member',
      userId VARCHAR(191) NOT NULL,
      workspaceId VARCHAR(191) NOT NULL,
      UNIQUE KEY unique_user_workspace (userId, workspaceId),
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES Workspace(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS DocumentState (
      id VARCHAR(191) PRIMARY KEY,
      workspaceId VARCHAR(191) NOT NULL,
      filename VARCHAR(191) NOT NULL,
      state LONGBLOB NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_workspace_filename (workspaceId, filename),
      FOREIGN KEY (workspaceId) REFERENCES Workspace(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Notification (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      title VARCHAR(191) NOT NULL,
      body TEXT,
      unread BOOLEAN DEFAULT true,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )
  `);

  try {
    await pool.query("ALTER TABLE User MODIFY COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE User MODIFY COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE User MODIFY COLUMN avatar LONGTEXT");
  } catch (err) {
    console.warn("User table columns modify warning:", err);
  }

  try {
    await pool.query("ALTER TABLE Workspace MODIFY COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE Workspace MODIFY COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE Workspace ADD COLUMN archived BOOLEAN DEFAULT false");
  } catch (err) {
    console.warn("Workspace table columns modify warning (might already exist):", err);
  }

  console.log("Database schema initialized.");
}
