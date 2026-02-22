---
name: openclaw-setup
description: Set up, harden, and troubleshoot OpenClaw on macOS with multi-agent routing and Slack Socket Mode. Use this skill when configuring gateway service lifecycle, agent/binding setup, channel allowlists, Slack token wiring, and diagnosing "Slack connected but no inbound messages" failures.
---

# OpenClaw Setup

## Establish baseline

Run these first:

```bash
openclaw --version
openclaw gateway status
openclaw status
openclaw agents list --bindings
openclaw channels status --probe
```

Verify all of these are true before deeper debugging:
- Gateway runtime is `running`
- Only one gateway process is active
- Slack channel status is `enabled/configured/running/works`
- Expected bindings exist for each channel

## Keep one gateway process only

If behavior is flaky or logs show repeated `gateway already running` errors:

```bash
openclaw gateway stop
openclaw gateway uninstall
openclaw gateway install
openclaw gateway start
```

Then confirm:

```bash
ps -axo pid,ppid,etime,command | rg "openclaw-gateway"
```

Keep only one long-lived `openclaw-gateway`.

## Service reload rules (important)

Use the right reload level for the change type:
- `openclaw gateway restart` for config/model/agent/binding/skill-list updates.
- `openclaw gateway install --force` (or uninstall/install) when the service definition itself must be rewritten (for example runtime/path migration, service args changes, stale service file).
- `openclaw gateway uninstall && openclaw gateway install && openclaw gateway restart` for full service rebuild.

Always verify runtime env after reload:

```bash
launchctl print gui/$(id -u)/ai.openclaw.gateway | rg "PATH =>"
```

Important behavior:
- `openclaw gateway restart` does not rewrite the LaunchAgent plist.
- `openclaw gateway install --force` rewrites the plist and can overwrite manual plist edits.

When service definition usually changes (use `install --force`):
- Runtime/install path migration (for example NVM Node to Homebrew Node).
- Gateway launch arguments changed (for example port/runtime flags).
- Launch-time service env changed (for example daemon PATH/token env).
- Service file drift/corruption or doctor reports stale/non-standard service config.

Manual plist edits policy:
- Not the default/recommended workflow.
- Use only as a targeted launchd workaround when needed.
- Prefer OpenClaw config + skill-level env where possible.
- If you do edit plist manually, re-apply after any forced install.

## Per-agent credentials pattern

Use the right credential store for the right layer:
- Model/provider auth: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- CLI/tool auth (for example `gh`, `gog`, custom CLIs): skill env + tool-specific config directory

Example (`gh` for one agent):
- Set `skills.entries.<skill>.env.GH_CONFIG_DIR` to that agent directory.
- Keep agent-specific files under `~/.openclaw/agents/<agentId>/agent/`.

Do not assume provider auth files configure external CLIs.

## Skill injection verification

When a skill appears installed but the agent says a tool is unavailable, verify in this order:

```bash
openclaw skills info <skill>
openclaw agent --agent <id> -m "Return ONLY JSON: {\"skills\":$SYSTEM_PROMPT_REPORT.skills.names}"
openclaw agent --agent <id> -m "Run: which <bin> && <bin> --version"
```

If `skills info` is ready but runtime cannot find the binary, treat it as PATH/env mismatch in gateway runtime.

## LaunchAgent vs shell PATH

On macOS, interactive shell PATH (`.zshrc`, `.bashrc`) is not the same as launchd service PATH.
OpenClaw gateway follows LaunchAgent env.

Use these checks:

```bash
echo "$PATH"
launchctl print gui/$(id -u)/ai.openclaw.gateway | rg "PATH =>"
```

If they differ, fix LaunchAgent PATH and reload service (not just shell rc files).

Preferred approach (no manual plist edits):

```bash
openclaw config set env.PATH "/Users/<user>/homebrew/bin:/Users/<user>/homebrew/sbin:/Users/<user>/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
openclaw gateway install --force --runtime node
openclaw gateway restart
```

Operational rule:
- Run service lifecycle commands from the intended OpenClaw install path (for example `/Users/<user>/homebrew/bin/openclaw`) so service `ProgramArguments` do not drift back to NVM paths.

## Configure agents and routing

Set stable agent IDs (for example `main` plus any specialist agents) and bind channels to agent IDs.
Do not change routing logic based on display names; routing uses `agentId` and binding match rules.

Validate:

```bash
openclaw agents list --bindings
```

## Set per-agent models safely

Prefer explicit per-agent model entries in `agents.list[].model.primary`.
After any model change, verify all agents, not just one:

```bash
for a in main <agent2> <agent3>; do
  openclaw models status --agent "$a" --json | jq '{agentId,defaultModel,resolvedDefault,missingProvidersInUse:.auth.missingProvidersInUse}'
done
```

If a model command unexpectedly changes multiple agents, correct `agents.defaults.model.primary` and each `agents.list[].model.primary` explicitly, then restart gateway.

## Configure Slack channel policy correctly

If `channels.slack.groupPolicy` is `allowlist`, inbound is dropped unless channel IDs are explicitly listed.

Inspect:

```bash
openclaw config get channels.slack --json | jq .
```

If allowlist is used, add each channel and set mention behavior:

```bash
openclaw config set channels.slack.channels.<CHANNEL_ID>.allow true
openclaw config set channels.slack.channels.<CHANNEL_ID>.requireMention false
```

Restart:

```bash
openclaw gateway restart
```

## Verify Slack tokens and scope state

Check token health:

```bash
openclaw channels status --probe --json
curl -sSI -H "Authorization: Bearer <xoxb-token>" https://slack.com/api/auth.test | rg -i "x-oauth-scopes"
```

Confirm required bot scopes for channel + DM coverage include at least:
- `app_mentions:read`
- `channels:read`, `channels:history`
- `groups:read`, `groups:history`
- `im:read`, `im:history`, `im:write`
- `mpim:read`, `mpim:history`
- `chat:write`, `chat:write.public`
- `users:read`

After scope changes, reinstall app to workspace and restart gateway.

## Test matrix (must run in order)

1. Channel plain text in bound channel
2. Channel mention (`@Bot ...`)
3. DM to bot

For each test, check:

```bash
openclaw channels status --probe --json | jq '.channelAccounts.slack[0] | {lastInboundAt,lastOutboundAt,lastError}'
```

Expected: `lastInboundAt` updates after inbound messages.

## Separate Slack vs OpenClaw faults

If Slack still appears silent, validate raw Socket Mode independently.

1. Open websocket with `apps.connections.open` using `xapp` token
2. Confirm `hello`
3. Send a Slack message and verify `events_api` envelope arrives

Interpretation:
- Raw socket gets events, OpenClaw does not: OpenClaw config/runtime issue
- Raw socket gets no events: Slack app config/subscription issue

## DM-specific checks

If user cannot start DM manually, force visibility by sending a DM from CLI:

```bash
openclaw message send --channel slack --target <USER_ID> -m "DM diagnostic ping" --json
```

If `groupPolicy=allowlist`, add the DM channel ID to allowlist as well.

## Session/model pinning behavior

Session state can continue using an older model even after defaults change.
Use channel-local reset commands in chat to force a new model selection:

- `/new`
- `/new <provider/model>`
- `/reset`
- `/model status`

If needed, clear stale session records/transcripts for the affected channel and restart gateway.

## Common high-signal mistakes

- Re-adding Slack account removed `channels.slack.channels.*` while `groupPolicy=allowlist` stayed enabled
- Using noisy/irrelevant logs instead of the active service logs (always get active log path from `openclaw gateway status`)
- Debug helper processes unintentionally competing with/obscuring gateway behavior
- Assuming Slack token validity implies inbound event delivery
- Verifying config only; always verify runtime session model (`/model status` or session store/log evidence)
- Assuming `skills.allowBundled` alone makes a skill injectable; binaries must also be resolvable by the running gateway service PATH
- Assuming shell PATH equals LaunchAgent PATH; on macOS they often differ

## Production gaps to close

These are easy to miss during setup hardening:

- Gateway still running from NVM Node path:
  - `openclaw gateway status` may show `ProgramArguments` under `~/.nvm/.../node`.
  - Prefer system/Homebrew Node to avoid breakage on NVM cleanup or upgrades.
- Credentials directory permissions:
  - Ensure `~/.openclaw/credentials` is private.
  - Fix: `chmod 700 ~/.openclaw/credentials`
- Memory semantic recall:
  - If no embedding provider is configured, semantic memory search is effectively off.
  - Check: `openclaw memory status --deep`
  - Either configure provider auth or disable memory search explicitly.
- Placeholder channel bindings left enabled:
  - Remove or disable Discord placeholder bindings before production (`CHAN_*_PLACEHOLDER`).
  - Keep only active channels to reduce routing ambiguity.

## Skill eligibility findings (gog)

- `gog` can show as `ready` in CLI while still not being injected in agent prompt context if gateway PATH cannot resolve `gog`.
- For launchd services, verify PATH from runtime, not shell:

```bash
launchctl print gui/$(id -u)/ai.openclaw.gateway | rg "PATH =>"
```

- If missing, use config-managed env PATH + reinstall:

```bash
openclaw config set env.PATH "/Users/<user>/homebrew/bin:/Users/<user>/homebrew/sbin:/Users/<user>/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
openclaw gateway install --force --runtime node
openclaw gateway restart
```

- If a binary still fails in daemon context and you cannot change system prefixes, symlink into `~/.local/bin` (already on daemon PATH):

```bash
mkdir -p ~/.local/bin
ln -sf /Users/<user>/homebrew/bin/<tool> ~/.local/bin/<tool>
openclaw gateway restart
```

- Validate with:

```bash
openclaw skills check
openclaw agent --agent <id> --message "run gog ..." --json
```

## Slack thread continuity findings

- If a channel message starts in channel session and follow-ups happen in a Slack thread, context can split across two session keys.
- Prefer explicit Slack thread continuity config:

```bash
openclaw config set channels.slack.replyToMode all
openclaw config set channels.slack.thread.historyScope thread
openclaw config set channels.slack.thread.inheritParent true
openclaw config set channels.slack.thread.initialHistoryLimit 50
openclaw gateway restart
```

- If agents still fail to recover draft context after a thread hop, check `tools.sessions.visibility` (self can block recovery lookups).

Known edge case:
- Some thread follow-ups may still lose prior draft context depending on session key transitions and history loading.
- Treat critical actions (for example "send now") as requiring explicit confirmation text in the same message if continuity is uncertain.

## Git identity per agent

OpenClaw does not provide a dedicated per-agent git identity key.
Use git path-scoped config so repos under an agent workspace get that identity.

Example:

```bash
cat > ~/.openclaw/agents/anton/agent/gitconfig <<'EOF'
[user]
	name = Anton
	email = anton@outlit.ai
EOF

git config --global includeIf.gitdir:/Users/<user>/OpenClaw/workspaces/anton/.path \
  /Users/<user>/.openclaw/agents/anton/agent/gitconfig
```

Optional GitHub credential isolation per agent:
- Add credential helper in that scoped file with `GH_CONFIG_DIR=/Users/<user>/.openclaw/agents/<id>/agent/gh`.

## Post-change reload matrix

- Agent/model/binding/tools/skill-list config changed:
  - `openclaw gateway restart`
- LaunchAgent PATH/env changed:
  - `openclaw gateway uninstall`
  - `openclaw gateway install`
  - `openclaw gateway restart`
- Auth files or per-agent credential files changed:
  - `openclaw gateway restart`
  - then send a fresh message/test command to force runtime re-evaluation
- Daemon cannot resolve required CLI binaries:
  - Prefer `openclaw config set env.PATH ...` + `openclaw gateway install --force --runtime node`
  - Fallback: symlink specific binaries into `~/.local/bin` and restart gateway

## QMD memory verification

After switching to `memory.backend=qmd`, verify both config and runtime:

```bash
openclaw config get memory.backend memory.qmd.searchMode
openclaw memory status --deep
openclaw memory index --force
```

Expected:
- `Provider: qmd (requested: qmd)` for each agent
- per-agent qmd sqlite index path under `~/.openclaw/agents/<id>/qmd/xdg-cache/qmd/index.sqlite`

If logs contain `spawn qmd ENOENT`:
- Confirm `qmd` exists on daemon PATH (`~/.local/bin/qmd` or standard prefix)
- Restart gateway and rerun index
- Treat old ENOENT lines as historical unless new timestamps appear after the fix

## Fast recovery checklist

Run in this order:

```bash
openclaw channels status --probe
openclaw agents list --bindings
openclaw config get channels.slack --json | jq .
openclaw gateway restart
openclaw channels status --probe --json | jq '.channelAccounts.slack[0] | {lastInboundAt,lastOutboundAt,lastError}'
```
