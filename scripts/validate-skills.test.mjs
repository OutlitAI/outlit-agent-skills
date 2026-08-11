import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);
const validator = await readFile(new URL("./validate-skills.sh", import.meta.url), "utf8");

async function runValidator(root) {
  try {
    const result = await execFileAsync("bash", [join(root, "scripts", "validate-skills.sh")], {
      cwd: root,
    });
    return { status: 0, output: `${result.stdout}${result.stderr}` };
  } catch (error) {
    return {
      status: error.code,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

test("validate-skills scopes link checks to published skills", async () => {
  const root = await mkdtemp(join(tmpdir(), "outlit-validate-"));

  try {
    await mkdir(join(root, "scripts"), { recursive: true });
    await mkdir(join(root, "skills/outlit/references"), { recursive: true });
    await mkdir(join(root, "skills/outlit/agents"), { recursive: true });
    await mkdir(join(root, "skills/outlit-sdk"), { recursive: true });
    await mkdir(join(root, ".agents/skills/workflow"), { recursive: true });

    await writeFile(join(root, "scripts/validate-skills.sh"), validator, "utf8");
    await writeFile(
      join(root, "skills/outlit/SKILL.md"),
      "---\nname: outlit\ndescription: Use when testing Outlit.\n---\n[SQL](references/sql-reference.md)\n",
      "utf8",
    );
    await writeFile(join(root, "skills/outlit/references/sql-reference.md"), "# SQL\n", "utf8");
    await writeFile(join(root, "skills/outlit/agents/openai.yaml"), "interface: {}\n", "utf8");
    await writeFile(
      join(root, "skills/outlit-sdk/SKILL.md"),
      "---\nname: outlit-sdk\ndescription: Use when testing Outlit SDK.\n---\n",
      "utf8",
    );
    await writeFile(
      join(root, ".agents/skills/workflow/SKILL.md"),
      "[missing workflow reference](missing.md)\n",
      "utf8",
    );

    const workflowOnlyResult = await runValidator(root);
    assert.equal(workflowOnlyResult.status, 0, workflowOnlyResult.output);

    await writeFile(
      join(root, "skills/outlit/SKILL.md"),
      "---\nname: outlit\ndescription: Use when testing Outlit.\n---\n[Missing](missing.md)\n",
      "utf8",
    );

    const publishedSkillResult = await runValidator(root);
    assert.notEqual(publishedSkillResult.status, 0);
    assert.match(publishedSkillResult.output, /skills\/outlit\/SKILL\.md: broken relative link/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
