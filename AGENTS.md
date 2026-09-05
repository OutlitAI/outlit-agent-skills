# Outlit Skills

## Agent workflow

- Follow the user's requested outcome through implementation and relevant verification when they ask for a change. A request to review or explain stays read-only unless it also authorizes fixes. Reuse decisions and authorization already given in the conversation.
- Inspect discoverable facts and make routine, reversible implementation choices. Ask only for unresolved decisions that materially affect scope, behavior, risk, or external actions; continue independent authorized work while waiting. Prepare a concrete result before seeking any remaining release approval.
- Use skills that materially help the task. These repository workflow rules take precedence over generic skill process defaults, subject to system/developer instructions and the user's request. Skill discovery, a planning template, or a finishing menu must not create an extra approval gate. If a skill blocks progress, cite its exact file and instruction and explain the unresolved requirement.
- Scale planning to the work. Use a short internal plan for a clear change; write a durable plan for meaningful sequencing, contracts, migrations, or long work. An authorized implementation task continues after planning. Keep changes cohesive and preserve unrelated work; add abstractions only for a current requirement or demonstrated consumer.
- When delegation is available and permitted by the session, use bounded specialists for independent work that benefits from parallel execution or fresh review. Keep one lead responsible for integration and final evidence. Give writers separate ownership and reviewers distinct questions. Reuse passing checks and stop review when requested risks are covered; repeat only for relevant changes or unresolved findings.
- Match verification to the claim. Use relevant tests and required CI for code; inspect or render documentation, copy, and visual changes as appropriate. Do not add tests that only restate the edit or repeat passing checks on unchanged inputs. Keep product-specific security, data, and release gates.
- Report the outcome, evidence, and remaining limits concisely. Identify the checked revision and environment when they matter. For long reviews, save detailed findings to a linked artifact. A running server, empty screen, queued job, or green build alone does not prove a requested user flow or deployment succeeded.

## Maintaining skills

The public skill packages under `skills/` describe Outlit product use. Development workflow skills under `.agents/skills/` guide work on this repository. Keep those roles separate. Preserve frontmatter, references, and product authorization boundaries. Validate changed skill structure and use a realistic independent scenario when behavior changes warrant it; formatting-only edits do not need a new behavioral baseline.

Available skills in this repository:

- **[skills/outlit/SKILL.md](skills/outlit/SKILL.md)** — Customer intelligence access through the Outlit CLI, MCP/Pi tools, SQL, source evidence, and integration setup. Use when querying customers, users, workspace users, timelines, facts, search, revenue, churn, or analytics.

- **[skills/outlit-sdk/SKILL.md](skills/outlit-sdk/SKILL.md)** — Complete Outlit SDK integration guide covering browser, server, native, desktop, identity, consent, product activity, activation-event configuration, verified billing integrations, customerId attribution, and event tracking. Use when integrating Outlit tracking into applications.
