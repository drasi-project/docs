---
type: "docs"
title: "Source and Reaction Creation Agents"
linkTitle: "Source/Reaction Creation Agents"
weight: 60
hide_readingtime: true
description: >-
    GitHub Copilot custom agents, checked into the drasi-core repository, that plan
    and implement new Source and Reaction plugins for you.
related:
  howto:
    - title: "Creating Custom Sources and Reactions"
      url: "/drasi-lib/how-to-guides/creating-custom-sources-and-reactions/"
  reference:
    - title: "AI Agent Context"
      url: "/reference/context/"
    - title: "Available Sources"
      url: "/drasi-lib/reference/sources/"
    - title: "Available Reactions"
      url: "/drasi-lib/reference/reactions/"
---

Building a production-quality Source or Reaction means more than implementing a trait — it means getting checkpoint recovery, replay, testing, and documentation right too. The drasi-core repository defines four [GitHub Copilot custom agents](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents) under [`.github/agents`](https://github.com/drasi-project/drasi-core/tree/main/.github/agents) that hold new plugins to that same bar automatically: two for Sources, two for Reactions, split into a **planner** that researches and specifies the work, and an **executor** that implements, tests, and documents it.

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/tree/main/.github/agents" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">.github/agents on GitHub</h3>
        <p class="unified-card-summary">The four agent profiles, plus the underlying issue-creator/researcher agents</p>
      </div>
    </div>
  </a>
  <a href="/drasi-lib/how-to-guides/creating-custom-sources-and-reactions/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-puzzle-piece"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Do it by hand instead</h3>
        <p class="unified-card-summary">The Source and Reaction traits these agents implement, explained directly</p>
      </div>
    </div>
  </a>
</div>

## The four agents

| Agent | Role | Model |
|---|---|---|
| `source-planner` | Researches a target system and produces an approved implementation plan for a new Source | Claude Opus 4.6 |
| `source-plan-executor` | Implements, tests, and documents a Source from an approved plan | GPT-5.3-Codex |
| `reaction-planner` | Researches a target system and produces an approved implementation plan for a new Reaction | Claude Opus 4.6 |
| `reaction-plan-executor` | Implements, tests, and documents a Reaction from an approved plan | GPT-5.3-Codex |

Planning and execution are deliberately split across two different models: the planner's only job is research and specification — it never writes production code — and the executor's only job is to follow an approved plan exactly. Neither agent is meant to be used alone; the planner hands its output to the executor once you approve it.

## What the planner does

Given a target system (a database, an API, a protocol), the planner:

1. Reads the existing plugins under `/components/sources` (or `/components/reactions`) — particularly the `postgres` source and `application` reaction — to match established patterns.
2. Classifies the work so the right testing strategy gets used:
   - **Sources** are either an **External System** (a remote database or service, tested against a real Docker container via `testcontainers`) or **Protocol/Local** (a receiver like a file watcher or HTTP endpoint, tested with a client harness that simulates data arriving).
   - **Reactions** are either **System-Target** (a hostable system like a database or queue, tested the same way as External System sources) or **Protocol-Target** (an endpoint like SignalR or gRPC, tested with a harness that captures outgoing messages).
3. **Writes and runs a proof-of-concept** in `./temp/[name]-poc-verification/` before writing the plan — this step is mandatory specifically to stop the plan from assuming a library capability that turns out not to exist.
4. Checks whether an existing identity provider (`PasswordIdentityProvider`, the Azure provider, the AWS provider) already covers the target system's authentication before designing anything custom.
5. Works out replay and recovery up front — for a Source, how to encode `source_position`, whether `supports_replay()` should be true, how `resume_from` gets honored; for a Reaction, whether the target is idempotent, and which `ReactionRecoveryPolicy` fits.
6. Produces a structured markdown plan (overview, data mapping strategy, architecture, replay/recovery design, exact test specification, implementation phases, and a Definition of Done) and asks you to approve it.

The planner is explicitly barred from writing implementation code — its output is the plan, not the plugin.

## What the executor does

Once you hand the approved plan to the executor, it implements every phase, then holds itself to a fixed verification bar before it will call the work done:

- Real-time change detection fully implemented — no placeholders or `TODO`s in core paths.
- Unit tests **run and pass**.
- An integration test **runs and passes** — against a real Docker container for External System / System-Target work, or a real client harness for Protocol/Local / Protocol-Target work.
- A manual example under `/examples/lib/[name]-getting-started/` **starts and visibly detects changes**, with `setup.sh`, `quickstart.sh`, `diagnose.sh`, and `test-updates.sh` helper scripts.
- `cargo clippy --all-targets -- -D warnings` and `cargo fmt` both pass.
- READMEs for the source/reaction, the bootstrap provider, and the example are written.
- A second, independent sub-agent reviews the result before it's presented as finished.

The executor's own instructions put it bluntly: *"Compiles successfully" ≠ "Works correctly."* If any item on its checklist is unchecked, the implementation is treated as incomplete, not as done-with-followups.

## Using the agents

These are standard [GitHub Copilot custom agents](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents) — Drasi doesn't require any special tooling beyond Copilot itself. Once you have the `drasi-core` repository open with Copilot available, you can:

- Reference an agent by name in Copilot Chat (in a supporting IDE) to start a session scoped to that agent's instructions.
- Select a custom agent from the picker in GitHub Copilot CLI (`/agent`) or the Copilot coding agent panel on github.com.
- Assign a GitHub issue to Copilot's coding agent and choose the custom agent from the dropdown, for an asynchronous run that opens a draft pull request.

A typical run looks like: invoke `source-planner` (or `reaction-planner`) with a description of the system you want to integrate, review and approve the plan it produces, then hand that plan to `source-plan-executor` (or `reaction-plan-executor`) to implement it. Exact invocation steps vary slightly by client and evolve with GitHub Copilot itself — see GitHub's [custom agents documentation](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents) for the current mechanics.

If you'd rather understand and write the plugin yourself — or just want to know what the agents are producing under the hood — the traits they implement are the same ones covered in [Creating Custom Sources and Reactions](/drasi-lib/how-to-guides/creating-custom-sources-and-reactions/).
