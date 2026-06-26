import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

import { prepareOpenClawSkill } from "./prepare-openclaw-skill.mjs";

async function makeTempDir() {
  return mkdtemp(join(tmpdir(), "outlit-openclaw-"));
}

async function listFiles(root) {
  const files = [];

  async function walk(dir, prefix = "") {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }

  await walk(root);
  return files.sort();
}

test("prepareOpenClawSkill copies only the OpenClaw upload files", async () => {
  const root = await makeTempDir();
  const source = join(root, "skills", "outlit");
  const target = join(root, "dist", "openclaw", "outlit");

  await mkdir(join(source, "agents"), { recursive: true });
  await mkdir(join(source, "references"), { recursive: true });
  await writeFile(join(source, "SKILL.md"), "# Outlit\n", "utf8");
  await writeFile(join(source, "agents", "openai.yaml"), "interface: {}\n", "utf8");
  await writeFile(join(source, "references", "sql-reference.md"), "# SQL\n", "utf8");
  await writeFile(join(source, ".DS_Store"), "junk", "utf8");

  const result = await prepareOpenClawSkill({ sourceDir: source, targetDir: target });

  assert.equal(result.targetDir, target);
  assert.deepEqual(await listFiles(target), ["SKILL.md", "references/sql-reference.md"]);
  assert.equal(await readFile(join(source, "agents", "openai.yaml"), "utf8"), "interface: {}\n");

  await rm(root, { recursive: true, force: true });
});

test("prepareOpenClawSkill rejects a source without SKILL.md", async () => {
  const root = await makeTempDir();
  const source = join(root, "skills", "outlit");
  const target = join(root, "dist", "openclaw", "outlit");

  await mkdir(source, { recursive: true });

  await assert.rejects(
    () => prepareOpenClawSkill({ sourceDir: source, targetDir: target }),
    /SKILL\.md is required/,
  );

  await rm(root, { recursive: true, force: true });
});

test("prepareOpenClawSkill rejects target directories that would delete the source tree", async () => {
  const root = await makeTempDir();
  const source = join(root, "skills", "outlit");

  await mkdir(source, { recursive: true });
  await writeFile(join(source, "SKILL.md"), "# Outlit\n", "utf8");

  await assert.rejects(
    () => prepareOpenClawSkill({ sourceDir: source, targetDir: root }),
    /Target directory must not be the source directory or one of its ancestors/,
  );

  await assert.rejects(
    () => prepareOpenClawSkill({ sourceDir: source, targetDir: join(root, "skills") }),
    /Target directory must not be the source directory or one of its ancestors/,
  );

  await rm(root, { recursive: true, force: true });
});
