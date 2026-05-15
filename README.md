# Outlit Agent Skills

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

After onboarding, agents should inspect integration capabilities before setup. Follow-up commands stay after the provider name, such as `outlit integrations setup hubspot mappings --json`, `outlit integrations setup salesforce mappings --json`, or `outlit integrations setup pylon webhooks --json`. `--session` is only for browser setup polling.

Or directly with the Skills CLI:

```sh
npx -y skills add https://github.com/OutlitAI/outlit-agent-skills --skill outlit -g
# or
bunx skills add https://github.com/OutlitAI/outlit-agent-skills --skill outlit -g
```

Install `outlit-sdk` separately when you need tracking or instrumentation help.

## Available Skills

| Skill | Description |
|-------|-------------|
| outlit | Customer intelligence through the Outlit CLI, MCP/Pi tools, SQL, source evidence, and notifications |
| outlit-sdk | Outlit SDK integration for product, website, server, native, identity, activation, and billing tracking |

## Usage

Once installed, agents automatically use these skills when working on Outlit-related tasks.

## License

MIT
