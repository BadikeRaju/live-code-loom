import express from "express";
import cors from "cors";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import * as Y from "yjs";
import { pool, initDb } from "./db.js";
import { generateToken, requireAuth } from "./auth.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendEmail } from "./email.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --- Authentication API ---

app.post("/api/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // 1. Password strength validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      res.status(400).json({ error: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character." });
      return;
    }

    // 2. Check if email exists
    const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM User WHERE email = ?", [email]);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    // 3. Create user
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const color = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#6366f1", "#d946ef"][Math.floor(Math.random() * 7)];
    const displayName = name || email.split("@")[0];

    await pool.execute(
      "INSERT INTO User (id, email, password, name, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      [id, email, hashedPassword, displayName, color]
    );

    res.json({ token: generateToken(id), user: { id, email, name: displayName, color, avatar: null } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query<RowDataPacket[]>("SELECT * FROM User WHERE email = ?", [email]);
    if (users.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = users[0];
    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    res.json({ token: generateToken(user.id), user: { id: user.id, email: user.email, name: user.name, color: user.color, avatar: user.avatar } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [users] = await pool.query<RowDataPacket[]>("SELECT id, email, name, color, avatar FROM User WHERE id = ?", [userId]);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/me/avatar", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { avatar } = req.body;
    await pool.query("UPDATE User SET avatar = ? WHERE id = ?", [avatar, userId]);
    res.json({ success: true, avatar });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Workspaces API ---

app.get("/api/workspaces", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const [workspaces] = await pool.query<RowDataPacket[]>(`
      SELECT w.* 
      FROM Workspace w 
      JOIN WorkspaceMember wm ON w.id = wm.workspaceId 
      WHERE wm.userId = ?
    `, [userId]);

    // For each workspace, fetch members (since the frontend expects w.members)
    for (let w of workspaces) {
      const [members] = await pool.query<RowDataPacket[]>(`
        SELECT wm.id, wm.role, u.id as userId, u.name, u.email, u.color, u.avatar
        FROM WorkspaceMember wm
        JOIN User u ON wm.userId = u.id
        WHERE wm.workspaceId = ?
      `, [w.id]);

      // format members to match what Prisma returned
      w.members = members.map((m: any) => ({
        id: m.id,
        role: m.role,
        user: { id: m.userId, name: m.name, email: m.email, color: m.color, avatar: m.avatar },
        userId: m.userId,
        workspaceId: w.id
      }));
    }

    res.json(workspaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/workspaces", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { name, language, description } = req.body;
  try {
    const workspaceId = uuidv4();
    await pool.execute(
      "INSERT INTO Workspace (id, name, language, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [workspaceId, name, language || "TypeScript", description || ""]
    );

    const memberId = uuidv4();
    await pool.execute(
      "INSERT INTO WorkspaceMember (id, role, userId, workspaceId) VALUES (?, 'owner', ?, ?)",
      [memberId, userId, workspaceId]
    );

    // Fetch the created workspace with members
    const [workspaces] = await pool.query<RowDataPacket[]>("SELECT * FROM Workspace WHERE id = ?", [workspaceId]);
    const workspace = workspaces[0];

    const [members] = await pool.query<RowDataPacket[]>(`
      SELECT wm.id, wm.role, u.id as userId, u.name, u.email, u.color, u.avatar
      FROM WorkspaceMember wm
      JOIN User u ON wm.userId = u.id
      WHERE wm.workspaceId = ?
    `, [workspaceId]);

    workspace.members = members.map((m: any) => ({
      id: m.id,
      role: m.role,
      user: { id: m.userId, name: m.name, email: m.email, color: m.color, avatar: m.avatar },
      userId: m.userId,
      workspaceId: workspace.id
    }));

    res.json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/workspaces/:id/files", requireAuth, async (req, res) => {
  const workspaceId = req.params.id;
  const { files } = req.body;
  
  try {
    for (const file of files) {
      const doc = new Y.Doc();
      const ytext = doc.getText(file.filename);
      ytext.insert(0, file.content);
      const state = Buffer.from(Y.encodeStateAsUpdate(doc));
      const docId = uuidv4();

      await pool.execute(
        `INSERT INTO DocumentState (id, workspaceId, filename, state, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE state = VALUES(state), updatedAt = NOW()`,
        [docId, workspaceId, file.filename, state]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/workspaces/:id", requireAuth, async (req, res) => {
  try {
    const [workspaces] = await pool.query<RowDataPacket[]>("SELECT * FROM Workspace WHERE id = ?", [req.params.id]);
    if (workspaces.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const workspace = workspaces[0];

    const [members] = await pool.query<RowDataPacket[]>(`
      SELECT wm.id, wm.role, u.id as userId, u.name, u.email, u.color, u.avatar
      FROM WorkspaceMember wm
      JOIN User u ON wm.userId = u.id
      WHERE wm.workspaceId = ?
    `, [workspace.id]);

    workspace.members = members.map((m: any) => ({
      id: m.id,
      role: m.role,
      user: { id: m.userId, name: m.name, email: m.email, color: m.color, avatar: m.avatar },
      userId: m.userId,
      workspaceId: workspace.id
    }));

    const [files] = await pool.query<RowDataPacket[]>(
      "SELECT filename FROM DocumentState WHERE workspaceId = ?",
      [workspace.id]
    );
    workspace.files = files.map((f: any) => f.filename);

    res.json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/workspaces/:id/star", requireAuth, async (req, res) => {
  const { starred } = req.body;
  try {
    await pool.query("UPDATE Workspace SET starred = ? WHERE id = ?", [starred ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/workspaces/:id/archive", requireAuth, async (req, res) => {
  const { archived } = req.body;
  try {
    await pool.query("UPDATE Workspace SET archived = ? WHERE id = ?", [archived ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/workspaces/:id/share", requireAuth, async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await pool.query<RowDataPacket[]>("SELECT id FROM User WHERE email = ?", [email]);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const memberId = uuidv4();
    try {
      await pool.execute(
        "INSERT INTO WorkspaceMember (id, role, userId, workspaceId) VALUES (?, 'editor', ?, ?)",
        [memberId, users[0].id, req.params.id]
      );

      // Fetch workspace name to send customized email
      const [workspaces] = await pool.query<RowDataPacket[]>("SELECT name FROM Workspace WHERE id = ?", [req.params.id]);
      const workspaceName = workspaces.length > 0 ? workspaces[0].name : "a workspace";

      // Send invitation email
      await sendEmail({
        to: email,
        subject: `Invitation to collaborate on ${workspaceName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Hello!</h2>
            <p>You have been invited to collaborate on the workspace <strong>${workspaceName}</strong> on CoFlux.</p>
            <p>Log in to your account and check your dashboard under the "Shared with me" tab to begin collaborating.</p>
            <br/>
            <p><a href="http://localhost:8080/dashboard" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
            <br/>
            <p>Best regards,<br/>The CoFlux Team</p>
          </div>
        `
      });

      res.json({ success: true });
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: "User is already a member" });
      } else {
        throw dbErr;
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/workspaces/:id", requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const [members] = await pool.query<RowDataPacket[]>(
      "SELECT role FROM WorkspaceMember WHERE workspaceId = ? AND userId = ?",
      [req.params.id, userId]
    );
    if (members.length === 0 || members[0].role !== 'owner') {
      res.status(403).json({ error: "Only the owner can delete the workspace" });
      return;
    }
    await pool.query("DELETE FROM DocumentState WHERE workspaceId = ?", [req.params.id]);
    await pool.query("DELETE FROM WorkspaceMember WHERE workspaceId = ?", [req.params.id]);
    await pool.query("DELETE FROM Workspace WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


// --- Notifications API ---

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [notifications] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Yjs Websocket & Persistence Setup ---

setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    // docName is expected to be workspaceId_filename
    const [workspaceId, ...filenameParts] = docName.split("_");
    const filename = filenameParts.join("_");

    try {
      const [docs] = await pool.query<RowDataPacket[]>(
        "SELECT state FROM DocumentState WHERE workspaceId = ? AND filename = ?",
        [workspaceId, filename]
      );
      if (docs.length > 0 && docs[0].state) {
        Y.applyUpdate(ydoc, new Uint8Array(docs[0].state));
      }
    } catch (e) {
      console.error("Error loading document", docName, e);
    }
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    const [workspaceId, ...filenameParts] = docName.split("_");
    const filename = filenameParts.join("_");
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    const docId = uuidv4();

    try {
      await pool.execute(
        `INSERT INTO DocumentState (id, workspaceId, filename, state, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE state = VALUES(state), updatedAt = NOW()`,
        [docId, workspaceId, filename, state]
      );
    } catch (e) {
      console.error("Error saving document", docName, e);
    }
  }
});


// --- Server Startup ---

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (conn: WebSocket, req: http.IncomingMessage) => {
  setupWSConnection(conn, req);
});

const PORT = process.env.PORT || 1234;

// Initialize Database then Start Server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
    console.log(`WebSocket Server running on ws://localhost:${PORT}`);
  });
}).catch(console.error);
