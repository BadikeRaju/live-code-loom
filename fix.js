const fs = require('fs');
const content = fs.readFileSync('src/routes/workspace.$id.tsx', 'utf8');
const fixed = content.replace('import { LogoMark } from "@/components/site-header";', 'const initialVersionHistory: any[] = [];\nimport { LogoMark } from "@/components/site-header";');
fs.writeFileSync('src/routes/workspace.$id.tsx', fixed);
