import { mkdir, readdir, rm, stat, copyFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SOURCE_DIR = "skills/outlit";
const DEFAULT_TARGET_DIR = "dist/openclaw/outlit";

const SKIPPED_DIRS = new Set([".git", ".clawhub", ".clawdhub", "node_modules", "__MACOSX"]);
const SKIPPED_FILES = new Set(["agents/openai.yaml"]);

export async function prepareOpenClawSkill({
  sourceDir = DEFAULT_SOURCE_DIR,
  targetDir = DEFAULT_TARGET_DIR,
  cwd = process.cwd(),
} = {}) {
  const source = resolve(cwd, sourceDir);
  const target = resolve(cwd, targetDir);

  await validateSource(source);
  validateTarget(source, target);

  await rm(target, { recursive: true, force: true });
  await copySkillFiles(source, target);

  return { sourceDir: source, targetDir: target };
}

async function validateSource(source) {
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat?.isDirectory()) {
    throw new Error(`Source skill directory not found: ${source}`);
  }

  const skillStat = await stat(join(source, "SKILL.md")).catch(() => null);
  if (!skillStat?.isFile()) {
    throw new Error(`SKILL.md is required in ${source}`);
  }
}

function validateTarget(source, target) {
  if (isWithinOrSame(target, source)) {
    throw new Error("Target directory must not be the source directory or one of its ancestors");
  }

  if (isWithinOrSame(source, target)) {
    throw new Error("Target directory must not be inside the source skill directory");
  }
}

function isWithinOrSame(parent, child) {
  const relativePath = relative(parent, child);
  return !relativePath || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

async function copySkillFiles(source, target) {
  async function walk(currentSource, relativeDir = "") {
    const entries = await readdir(currentSource, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const sourcePath = join(currentSource, entry.name);
      const targetPath = join(target, relativePath);

      if (shouldSkip(relativePath, entry)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(sourcePath, relativePath);
      } else if (entry.isFile()) {
        await mkdir(dirname(targetPath), { recursive: true });
        await copyFile(sourcePath, targetPath);
      }
    }
  }

  await walk(source);
}

function shouldSkip(relativePath, entry) {
  if (entry.name === ".DS_Store" || entry.name.startsWith("._")) {
    return true;
  }

  if (entry.isDirectory()) {
    return SKIPPED_DIRS.has(entry.name);
  }

  return SKIPPED_FILES.has(relativePath);
}

function usage() {
  return [
    "Usage: npm run prepare:openclaw -- [sourceDir] [targetDir]",
    "",
    `Defaults: ${DEFAULT_SOURCE_DIR} -> ${DEFAULT_TARGET_DIR}`,
  ].join("\n");
}

async function main() {
  const [sourceDir, targetDir] = process.argv.slice(2);

  if (sourceDir === "--help" || sourceDir === "-h") {
    console.log(usage());
    return;
  }

  const result = await prepareOpenClawSkill({ sourceDir, targetDir });
  console.log(`Prepared OpenClaw skill folder: ${relative(process.cwd(), result.targetDir)}`);
  console.log("Upload with: clawhub publish dist/openclaw/outlit --version <semver>");
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
