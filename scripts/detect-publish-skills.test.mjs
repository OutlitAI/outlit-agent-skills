import assert from "node:assert/strict";
import { test } from "node:test";

import { detectPublishSkills } from "./detect-publish-skills.mjs";

test("detectPublishSkills returns no skills for non-skill changes", () => {
  assert.deepEqual(
    detectPublishSkills(["README.md", ".github/workflows/validate.yml", "AGENTS.md"]),
    [],
  );
});

test("detectPublishSkills maps outlit skill and packaging changes", () => {
  assert.deepEqual(detectPublishSkills(["skills/outlit/SKILL.md"]), [
    {
      skill: "outlit",
      slug: "outlit",
      name: "Outlit",
      path: "dist/openclaw/outlit",
      sourcePath: "skills/outlit",
    },
  ]);

  assert.deepEqual(detectPublishSkills(["scripts/prepare-openclaw-skill.mjs"]), [
    {
      skill: "outlit",
      slug: "outlit",
      name: "Outlit",
      path: "dist/openclaw/outlit",
      sourcePath: "skills/outlit",
    },
  ]);
});

test("detectPublishSkills ignores packaging test-only changes", () => {
  assert.deepEqual(
    detectPublishSkills([
      "scripts/prepare-openclaw-skill.test.mjs",
      "scripts/detect-publish-skills.test.mjs",
    ]),
    [],
  );
});

test("detectPublishSkills maps sdk skill changes and deduplicates output", () => {
  assert.deepEqual(
    detectPublishSkills([
      "skills/outlit-sdk/SKILL.md",
      "skills/outlit-sdk/SKILL.md",
      "skills/outlit/references/sql-reference.md",
    ]),
    [
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
    ],
  );
});
