import { pool } from "./server/db.ts";

async function test(id: string) {
  try {
    const [workspaces] = await pool.query("SELECT * FROM Workspace WHERE id = ?", [id]);
    if ((workspaces as any).length === 0) {
      console.log("Not found");
      return;
    }
    const workspace = (workspaces as any)[0];
    const [members] = await pool.query(`
      SELECT wm.id, wm.role, u.id as userId, u.name, u.email, u.color
      FROM WorkspaceMember wm
      JOIN User u ON wm.userId = u.id
      WHERE wm.workspaceId = ?
    `, [workspace.id]);
    workspace.members = (members as any).map((m: any) => ({
      id: m.id,
      role: m.role,
      user: { id: m.userId, name: m.name, email: m.email, color: m.color },
      userId: m.userId,
      workspaceId: workspace.id
    }));
    console.log(JSON.stringify(workspace, null, 2));
  } catch (error) {
    console.error("Error", error);
  }
  process.exit(0);
}
test('8d8b14d0-f1c3-4c57-a7e6-b2f7997e8f33');
