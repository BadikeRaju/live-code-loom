import { pool } from "./server/db.ts";
async function main() {
  const [rows] = await pool.query("SELECT * FROM Workspace ORDER BY createdAt DESC LIMIT 1;");
  console.log(rows);
  process.exit(0);
}
main().catch(console.error);
