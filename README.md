# CoFlux (Live-Code-Loom)

CoFlux is a powerful, real-time collaborative web-based IDE and code editor. It brings the robust, familiar coding experience of desktop editors (like VS Code) directly into your browser while allowing multiple developers to type, edit, and collaborate on the same codebase simultaneously.

## 🚀 What It Does

CoFlux bridges the gap between local development and cloud collaboration. It provides a full-featured workspace where you can:
- **Write Code in Real-Time**: Multiple users can edit the same file simultaneously. You can see your collaborators' remote cursors dancing across the screen with their names and custom colors.
- **Clone & Sync with GitHub**: Paste a GitHub repository URL to instantly clone it into a collaborative workspace. Once you and your team are done editing, you can securely commit and push your changes back to GitHub directly from the editor.
- **Import Local Projects**: Drag and drop your local folders to upload them to a cloud workspace.
- **Manage Workspaces & Permissions**: Create unlimited workspaces. Invite colleagues via email and assign them roles (Owner, Editor, Viewer).

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, and TanStack Router for lightning-fast, type-safe navigation.
- **Styling**: Tailwind CSS, heavily customized with a premium, sleek, "Obsidian-like" dark theme UI.
- **Editor Engine**: Monaco Editor (the exact same engine that powers Microsoft's VS Code).
- **Collaboration**: Powered by `Yjs` and `y-websocket` using CRDTs (Conflict-free Replicated Data Types) to ensure zero merge conflicts when multiple people type at once.
- **Backend**: Python (Flask) with `simple-websocket` for real-time traffic.
- **Database**: MySQL for storing user profiles, workspaces, and offline document states.

## 💡 What Are The Uses Of This?

CoFlux is built for any scenario where code and collaboration intersect:

1. **Remote Pair Programming**: No need to share screens on Zoom while one person dictates code to the other. Both developers can jump into a CoFlux workspace and actively type and build features together.
2. **Technical Interviews**: Interviewers can set up a workspace with boilerplate code, invite a candidate, and watch them problem-solve and write algorithms in real-time.
3. **Hackathons & Rapid Prototyping**: Skip the setup phase. Teams can instantly spin up a React or Python workspace, collaboratively build an MVP without worrying about local environment issues, and push it straight to GitHub.
4. **Mentorship & Education**: Teachers can invite students to a workspace to help them debug complex code, showing them exactly where the errors are with a visible cursor.
5. **Seamless Code Reviews**: Instead of leaving comments on a Pull Request, you can invite a reviewer into the active workspace to walk through the architecture together.
