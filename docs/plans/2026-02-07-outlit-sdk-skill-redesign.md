# Outlit SDK Skill Redesign

## Problem

The current skill is a ~65KB reference dump with templates, scripts, and duplicated docs that drift from the official docs at `docs.outlit.ai`. It follows 8 linear steps with no branching, makes assumptions instead of asking the user, and doesn't cover Rust, desktop, mobile, or existing analytics migrations.

## Solution

Replace the reference dump with a **decision-tree-driven integration guide** that detects what it can, asks only what it must, links to official docs for implementation details, and makes recommendations with clear reasoning.

## Architecture

### Single File

```
skills/outlit-sdk/
└── SKILL.md
```

Everything else is deleted: `references/`, `assets/`, `scripts/`. The AI fetches docs from `docs.outlit.ai` as needed.

### SKILL.md Sections

1. Frontmatter (trigger description covering Rust, desktop, mobile)
2. Overview (what Outlit is, what this skill does)
3. Branching check (already installed vs fresh install)
4. Phase 1: Quick Connect
5. Phase 2: Full Integration (7 decisions)
6. Detection instructions (what to grep/glob for)
7. Doc URL map
8. Recommendations reference (default stances)
9. Key gotchas

## Two-Phase Flow

### Phase 1: Quick Connect (~2 min, zero user decisions)

Goal: get events flowing so the user sees "Connected" on their Outlit onboarding screen.

1. Detect framework and package manager (auto)
2. Install the SDK (`@outlit/browser` or `@outlit/node`)
3. Add minimal provider/init with just `publicKey`
4. User runs dev server
5. User checks onboarding screen for "Connected" badge

No auth, no consent, no custom events. Just prove the connection works.

### Phase 2: Full Integration (7 decisions)

Walk through each decision in order. Each either auto-resolves from detection or requires a user prompt.

### Branching Check (Already Installed)

If `@outlit/browser` or `@outlit/node` is already in `package.json`, skip Phase 1 and ask what they need: add events, add auth integration, add consent, add server-side tracking, debug an issue, etc.

## Detection Phase

The AI uses grep/glob directly — no scripts.

| Signal | How to detect | Used for |
|--------|--------------|----------|
| Framework | `package.json` deps (next, vue, react, svelte, @angular, astro, express, fastify) | Choosing docs page |
| Package manager | Lock file (package-lock, yarn.lock, pnpm-lock, bun.lockb) | Install command |
| TypeScript | `tsconfig.json` | Pattern selection |
| Auth provider | Deps (clerk, next-auth, @supabase/auth, @auth0, firebase) + usage | Identity strategy |
| Billing provider | Deps (stripe, @paddle/paddle-js, chargebee) | Billing recommendation |
| Existing analytics | Deps (posthog-js, @amplitude/analytics-browser, mixpanel-browser, @segment/analytics-next) | Analytics strategy |
| Analytics abstraction | Grep for `analytics.ts`, `tracking.ts`, `lib/analytics` importing multiple libs | Wrapper vs alongside |
| Existing Outlit | `@outlit/browser` or `@outlit/node` in deps | Skip Phase 1 |
| EU/consent signals | Cookie banner libs (cookiebot, onetrust), CMP code | Consent recommendation |
| App type | Deps (tauri, electron, react-native) vs pure web | SDK package selection |

## Decision Tree

### Decision 1: App Type & SDK Package
- Auto-resolved from detection
- Browser app -> `@outlit/browser`
- Server/API -> `@outlit/node`
- Desktop: Electron -> `@outlit/browser`, Tauri -> `outlit` Rust crate
- React Native -> `@outlit/browser` with `fingerprint` mode
- Hybrid (e.g. Next.js with API routes) -> both packages

### Decision 2: Consent Stance
- Existing CMP/cookie banner detected -> `autoTrack: false`, integrate with their CMP
- EU signals but no CMP -> `autoTrack: false`, mention they need a consent solution
- No EU signals -> `autoTrack: true` (simpler path)
- Always explain the tradeoff: `autoTrack: true` uses cookies immediately; `autoTrack: false` waits for `enableTracking()`

### Decision 3: Auth & Identity
- Auto-resolved from detection
- React/Vue provider -> pass `user` prop with email + userId, no manual `identify()`
- Vanilla JS / script tag -> call `identify({ email, userId })` client-side after auth
- Server-only (Node/Rust) -> call `identify()` server-side for event attribution
- **Key emphasis:** Client-side identify is critical — it links the anonymous cookie to a real user

### Decision 4: Existing Analytics Strategy
- Existing analytics abstraction found -> add Outlit as another provider in it
- Scattered direct calls found -> surface the count, ask: create wrapper or add alongside?
- No existing analytics -> add Outlit directly

### Decision 5: Activation Event
- Scan codebase for value-moment patterns (first resource created, first project completed, first invite sent, core feature first used)
- If found -> suggest it: "It looks like [X] could be your activation event"
- If onboarding flow found but no clear value moment -> mention onboarding as fallback but push for the real "aha" moment
- If nothing obvious -> ask: "What action means a user has gotten real value?"

### Decision 6: Billing Integration
- Stripe detected -> recommend Stripe webhook integration (auto-handles `customer.paid()` / `customer.trialing()` / `customer.churned()`)
- Other billing provider -> guide manual lifecycle calls in existing webhook handlers
- No billing detected -> skip, mention it's available later

### Decision 7: Event Tracking
- Pageviews assumed (on by default)
- Suggest events based on codebase (form submissions, key actions, feature usage)
- Ask user to confirm or add to the list before implementing

## Doc URL Map

| Topic | URL |
|-------|-----|
| React | `https://docs.outlit.ai/tracking/browser/react` |
| Next.js | `https://docs.outlit.ai/tracking/browser/nextjs` |
| Vue 3 | `https://docs.outlit.ai/tracking/browser/vue` |
| Nuxt | `https://docs.outlit.ai/tracking/browser/nuxt` |
| SvelteKit | `https://docs.outlit.ai/tracking/browser/sveltekit` |
| Angular | `https://docs.outlit.ai/tracking/browser/angular` |
| Astro | `https://docs.outlit.ai/tracking/browser/astro` |
| Script tag | `https://docs.outlit.ai/tracking/browser/script` |
| Rust/Tauri | `https://docs.outlit.ai/tracking/server/rust` |
| Node.js | `https://docs.outlit.ai/tracking/server/nodejs` |
| Identity resolution | `https://docs.outlit.ai/concepts/identity-resolution` |
| Consent/anonymous | `https://docs.outlit.ai/concepts/anonymous-tracking` |
| Customer journey | `https://docs.outlit.ai/concepts/customer-journey` |

## Recommendations Reference

These are the default stances the AI should take. Explain reasoning but don't force — user overrides always win.

- **Consent:** Default to `autoTrack: true` unless EU signals present. Don't build a cookie banner unless asked.
- **Billing:** Recommend Stripe webhook integration over manual lifecycle events when Stripe is detected.
- **Activation:** Push for the real value-exchange moment, not just "completed onboarding." Onboarding is the fallback.
- **Identity:** Client-side `identify()` right after auth flow is critical. Server-side identify is for attribution, not linking.
- **Analytics migration:** Detect first, ask second. If they have an abstraction, extend it. Don't scatter duplicate calls.
- **Minimal changes:** Touch as few files as possible. Add Outlit alongside existing code, don't reorganize their project.

## Key Gotchas

- Always `await outlit.flush()` before serverless function exits
- Client-side `identify()` must happen after auth — race conditions with async auth providers (Clerk, Auth0) can cause silent drops
- Use `snake_case` for event names
- Include both `email` and `userId` for identity resolution
- Framework env var prefixes matter: `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`

## Implementation Plan

1. Delete `references/`, `assets/`, `scripts/`
2. Rewrite `SKILL.md` following this design
3. Update frontmatter description to cover new trigger words (Rust, desktop, mobile, consent, analytics migration)
4. Update `CLAUDE.md` to reflect new skill description
5. Verify doc URLs are reachable
