# Outlit Agent Skills

Agent skills for working with [Outlit](https://outlit.ai).

## Installation

With the Outlit CLI:

```sh
outlit setup skills
```

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
