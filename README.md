# Outlit Skills

Agent skills for working with [Outlit](https://outlit.ai).

## Installation

With the Outlit CLI:

```sh
outlit setup skills
```

For a coding agent with the current CLI:

```sh
outlit onboard --agent codex --json
```

`outlit onboard` can be the first command: it starts browser auth when no API key is available, installs the Outlit skill for the selected agent, checks integration readiness, and prints next actions.

After onboarding, use `outlit integrations setup <provider>` when the user asks to connect a data source and `outlit integrations status [provider]` to inspect readiness. Interactive setup handles capability negotiation and secure prompts. Automation passes one strict JSON object through `--config-stdin`; provider secrets must not appear in command arguments.

Or directly with the Skills CLI:

```sh
npx -y skills add OutlitAI/skills --skill outlit -g
# or
bunx skills add OutlitAI/skills --skill outlit -g
```

Install `outlit-sdk` separately when you need tracking or instrumentation help.

## Available Skills

| Skill | Description |
|-------|-------------|
| outlit | Customer intelligence through the Outlit CLI, MCP/Pi tools, SQL, source evidence, workspace users, and integration setup |
| outlit-sdk | Outlit SDK integration for browser, server, native, desktop, identity, consent, product activity, activation-event configuration, customerId attribution, and verified billing integrations |

## Usage

Once installed, agents automatically use these skills when working on Outlit-related tasks.

## OpenClaw / ClawHub packaging

The source skill can keep platform-specific metadata such as `agents/openai.yaml`. Before publishing
the Outlit skill to ClawHub, generate a clean OpenClaw upload folder:

```sh
npm run prepare:openclaw
clawhub publish dist/openclaw/outlit --version <semver>
```

## License

MIT
