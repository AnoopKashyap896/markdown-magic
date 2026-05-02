import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });

cpSync(join(root, "demo"), join(dist, "demo"), { recursive: true });
cpSync(join(root, "src"), join(dist, "src"), { recursive: true });
