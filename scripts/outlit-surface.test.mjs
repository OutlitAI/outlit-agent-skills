import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const skill = await readFile(new URL("../skills/outlit/SKILL.md", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const catalogDocs = await Promise.all(
  ["README.md", "CLAUDE.md", "AGENTS.md", "skills.sh.json"].map((path) =>
    readFile(new URL(`../${path}`, import.meta.url), "utf8"),
  ),
);

test("Outlit skill says when agents should use it", () => {
  assert.match(skill, /^## When to Use Outlit$/m);
  assert.match(skill, /onboarding, adoption, retention, renewal, or expansion/);
  assert.match(skill, /Use the `outlit-sdk` skill instead/);
});

test("Outlit chooser documents the current public capability families", () => {
  for (const toolName of [
    "outlit_list_workspace_users",
    "outlit_get_customer_relationship",
    "outlit_list_destinations",
    "outlit_get_integration_capabilities",
    "outlit_get_customer_activation",
    "outlit_get_workspace_settings",
    "outlit_list_features",
    "outlit_get_customer_features",
    "outlit_list_attention_items",
  ]) {
    assert.match(skill, new RegExp(`\\b${toolName}\\b`));
  }

  assert.match(skill, /\| Browse workspace users \| `outlit_list_workspace_users` \| `outlit ws-users list` \|/);
  assert.match(skill, /deterministic enumeration of .*Slack/);
  assert.match(skill, /`SLACK`/);
});

test("Outlit integration guidance matches the current secure CLI", () => {
  assert.match(skill, /outlit integrations setup <provider>/);
  assert.match(skill, /outlit integrations status \[provider\]/);
  assert.match(skill, /--config-stdin/);
  assert.match(skill, /--accept-recommended/);
  assert.match(skill, /Use `setup` to connect or repair/);
  assert.match(skill, /use `status` to inspect readiness/);

  for (const doc of [skill, readme]) {
    assert.doesNotMatch(doc, /outlit integrations capabilities/);
    assert.doesNotMatch(doc, /outlit integrations list/);
    assert.doesNotMatch(doc, /outlit integrations status --session/);
    assert.doesNotMatch(doc, /outlit integrations setup \S+ (?:mappings|webhooks)/);
    assert.doesNotMatch(doc, /--config(?:\s|=)/);
  }
});

test("Outlit facts guidance covers current public fact filters and contact transitions", () => {
  const factTypesLine = skill
    .split("\n")
    .find((line) => line.startsWith("- Public `factTypes` filters accept"));
  const factCategoriesLine = skill
    .split("\n")
    .find((line) => line.startsWith("- Public `factCategories` filters accept"));

  assert.ok(factTypesLine, "missing public factTypes filter list");
  assert.ok(factCategoriesLine, "missing public factCategories filter list");

  for (const factType of [
    "CUSTOM",
    "COMPANY_CHANGE",
    "FUNDING_REVENUE",
    "TECHNOLOGY",
    "STRATEGY",
    "COMPETITIVE",
    "SENTIMENT",
    "CHAMPION_RISK",
    "EXPANSION",
    "CHURN_RISK",
    "TIMELINE",
    "BUDGET",
    "DECISION_MAKER",
    "REQUIREMENTS",
    "PRODUCT_USAGE",
    "CONTACT_INFO",
    "CONTACT_PREFERENCE",
    "CONTACT_DEPARTURE",
    "CONTACT_POSITION_CHANGE",
    "CONTACT_DISENGAGEMENT",
  ]) {
    assert.match(factTypesLine, new RegExp(`\\b${factType}\\b`));
  }

  assert.match(factCategoriesLine, /`MEMORY`, `RELATIONSHIP`, and `CUSTOM`/);
  assert.match(skill, /left or is leaving/);
  assert.match(skill, /title, department, team, or professional responsibility/);
  assert.match(skill, /stopped participating, organizing, responding, or owning/);
  assert.match(skill, /single unanswered message.*insufficient/);
  assert.match(skill, /`CONTACT_DISENGAGEMENT`.*does not currently wake Churn/);
  assert.match(skill, /`CHAMPION_RISK`.*historical.*readable/i);
});

test("Outlit authorization guidance includes the onboarding key preset", () => {
  assert.match(skill, /Personal CLI/);
  assert.match(skill, /creator-bound integration setup/);
});

test("OpenClaw metadata allows stored credentials and browser onboarding", () => {
  const frontmatter = skill.split("---", 3)[1] ?? "";
  assert.doesNotMatch(frontmatter, /^\s+env:/m);
  assert.match(frontmatter, /^\s+primaryEnv: OUTLIT_API_KEY$/m);
});

test("repository docs use the current Skills repository name", () => {
  for (const doc of catalogDocs.slice(0, 3)) {
    assert.doesNotMatch(doc, /^# Outlit Agent Skills$/m);
    assert.match(doc, /^# Outlit Skills$/m);
  }
});

test("Outlit docs do not advertise the retired notification action surface", () => {
  assert.doesNotMatch(skill, /\bnotifications?\b|outlit_send_notification|outlit notify/i);
  for (const doc of catalogDocs) {
    assert.doesNotMatch(doc, /\bnotifications?\b/i);
  }
});

test("Outlit docs reference the current @outlit/tools public exports", () => {
  for (const exportName of [
    "customerToolContracts",
    "defaultAgentToolNames",
    "actionToolNames",
    "analyticalAgentToolNames",
    "allCustomerToolNames",
  ]) {
    assert.doesNotMatch(skill, new RegExp(`\\b${exportName}\\b`));
  }

  for (const exportName of [
    "publicToolContracts",
    "publicToolNames",
    "consumerToolPolicies",
    "defaultToolNames",
    "analyticalToolNames",
    "piToolNames",
    "cliToolNames",
    "allPublicToolNames",
    "sqlToolNames",
  ]) {
    assert.match(skill, new RegExp(`\\b${exportName}\\b`));
  }
});
