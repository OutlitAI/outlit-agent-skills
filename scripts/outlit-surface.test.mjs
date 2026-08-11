import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const skill = await readFile(new URL("../skills/outlit/SKILL.md", import.meta.url), "utf8");
const catalogDocs = await Promise.all(
  ["README.md", "CLAUDE.md", "AGENTS.md", "skills.sh.json"].map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  ),
);

test("Outlit chooser documents the current workspace-user and source surfaces", () => {
  assert.match(skill, /\| Browse workspace users \| `outlit_list_workspace_users` \| `outlit ws-users list` \|/);
  assert.match(skill, /deterministic enumeration of .*Slack/);
  assert.match(skill, /`SLACK`/);
});

test("Outlit docs do not advertise the retired notification action surface", () => {
  assert.doesNotMatch(skill, /\bnotifications?\b|outlit_send_notification|outlit notify/i);
  for (const doc of catalogDocs) {
    assert.doesNotMatch(doc, /\bnotifications?\b/i);
  }
});
