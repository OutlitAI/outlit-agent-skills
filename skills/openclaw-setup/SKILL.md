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
- `openclaw gateway uninstall && openclaw gateway install && openclaw gateway restart` for LaunchAgent-level env/path changes (for example PATH fixes for `gh`, `gog`, or other CLIs).

Always verify runtime env after reload:

```bash
launchctl print gui/$(id -u)/ai.openclaw.gateway | rg "PATH =>"
```

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

## Skill eligibility findings (gog)

- `gog` can show as `ready` in CLI while still not being injected in agent prompt context if gateway PATH cannot resolve `gog`.
- For launchd services, verify PATH from runtime, not shell:

```bash
launchctl print gui/$(id -u)/ai.openclaw.gateway | rg "PATH =>"
```

- If missing, prepend Homebrew user prefix and reload service:

```bash
/usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:PATH /Users/<user>/homebrew/bin:<existing_path>" ~/Library/LaunchAgents/ai.openclaw.gateway.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.gateway.plist || true
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.gateway.plist
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
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

## Fast recovery checklist

Run in this order:

```bash
openclaw channels status --probe
openclaw agents list --bindings
openclaw config get channels.slack --json | jq .
openclaw gateway restart
openclaw channels status --probe --json | jq '.channelAccounts.slack[0] | {lastInboundAt,lastOutboundAt,lastError}'
```
