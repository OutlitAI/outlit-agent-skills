import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SKILLS = [
  {
    skill: "outlit",
    slug: "outlit",
    name: "Outlit",
    path: "dist/openclaw/outlit",
    sourcePath: "skills/outlit",
  },
  {
    skill: "outlit-sdk",
    slug: "outlit-sdk",
    name: "Outlit SDK",
    path: "skills/outlit-sdk",
    sourcePath: "skills/outlit-sdk",
  },
];

const OUTLIT_PACKAGING_FILES = new Set([
  "scripts/prepare-openclaw-skill.mjs",
  "scripts/prepare-openclaw-skill.test.mjs",
]);

export function detectPublishSkills(files) {
  const changed = new Set();

  for (const file of files) {
    const normalized = file.trim().replaceAll("\\", "/");
    if (!normalized) continue;

    if (normalized === "skills/outlit/SKILL.md" || normalized.startsWith("skills/outlit/")) {
      changed.add("outlit");
      continue;
    }

    if (
      normalized === "skills/outlit-sdk/SKILL.md" ||
      normalized.startsWith("skills/outlit-sdk/")
    ) {
      changed.add("outlit-sdk");
      continue;
    }

    if (OUTLIT_PACKAGING_FILES.has(normalized)) {
      changed.add("outlit");
    }
  }

  return SKILLS.filter((skill) => changed.has(skill.skill));
}

function readChangedFilesFromStdin() {
  return readFileSync(0, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function main() {
  const include = detectPublishSkills(readChangedFilesFromStdin());
  process.stdout.write(`${JSON.stringify({ include })}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
