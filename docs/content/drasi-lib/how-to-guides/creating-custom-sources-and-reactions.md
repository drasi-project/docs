---
type: "docs"
title: "Creating Custom Sources and Reactions"
linkTitle: "Creating Custom Sources and Reactions"
weight: 10
hide_readingtime: true
description: >-
    Implement the Source and Reaction traits to connect drasi-lib to a system
    that doesn't have a built-in plugin.
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Reactions"
      url: "/concepts/reactions/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  reference:
    - title: "Available Sources"
      url: "/drasi-lib/reference/sources/"
    - title: "Available Reactions"
      url: "/drasi-lib/reference/reactions/"
    - title: "Source and Reaction Creation Agents"
      url: "/reference/source-and-reaction-creation-agents/"
---

drasi-lib ships with plugins for common systems — PostgreSQL, HTTP, gRPC, MSSQL, and more (see [Available Sources](/drasi-lib/reference/sources/) and [Available Reactions](/drasi-lib/reference/reactions/)). When your application needs to watch or react to a system that isn't on that list, you implement two small async traits — `Source` and `Reaction` — and drasi-lib handles query evaluation, dispatch, and recovery for you.

This guide walks through both traits with working examples. If you'd rather have an AI agent generate a production-ready plugin — including tests and docs — see [Source and Reaction Creation Agents](/reference/source-and-reaction-creation-agents/) instead. That workflow uses the same traits described here.

## Before you start

Check whether an existing plugin already covers your use case:

<div class="card-grid card-grid--2">
  <a href="/drasi-lib/reference/sources/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Available Sources</h3>
        <p class="unified-card-summary">postgres, http, grpc, mock, mssql, platform, application</p>
      </div>
    </div>
  </a>
  <a href="/drasi-lib/reference/reactions/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-bolt"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Available Reactions</h3>
        <p class="unified-card-summary">http, grpc, sse, log, platform, profiler, stored-proc (postgres/mysql/mssql), application</p>
      </div>
    </div>
  </a>
</div>

Both `Source` and `Reaction` are plugins in the same sense as these built-ins — your implementation is registered with `DrasiLib::builder()` exactly the way a built-in plugin would be.

## Creating a custom Source

A Source connects to a system, models its data as a property graph, and dispatches change events. It implements the `Source` trait:

```rust
use drasi_lib::{Source, SourceBase, SourceBaseParams, ComponentStatus};
use drasi_lib::context::SourceRuntimeContext;
use drasi_lib::channels::SubscriptionResponse;
use async_trait::async_trait;

pub struct MySource {
    base: SourceBase,
    // your config fields
}

#[async_trait]
impl Source for MySource {
    fn id(&self) -> &str { &self.base.get_id() }
    fn type_name(&self) -> &str { "my-source" }
    fn properties(&self) -> HashMap<String, serde_json::Value> { HashMap::new() }
    fn auto_start(&self) -> bool { self.base.get_auto_start() }

    async fn initialize(&self, context: SourceRuntimeContext) {
        self.base.initialize(context).await;
    }

    async fn start(&self) -> Result<()> {
        self.base.set_status(ComponentStatus::Running, None).await;
        // spawn your data ingestion task
        Ok(())
    }

    async fn stop(&self) -> Result<()> {
        self.base.stop_common().await;
        Ok(())
    }

    async fn status(&self) -> ComponentStatus {
        self.base.get_status().await
    }

    async fn subscribe(&self, settings: SourceSubscriptionSettings) -> Result<SubscriptionResponse> {
        self.base.subscribe_with_bootstrap(&settings, "MySource").await
    }

    fn as_any(&self) -> &dyn std::any::Any { self }
}
```

`SourceBase` does the bookkeeping — status tracking, checkpoint sequencing, bootstrap coordination — so your implementation only needs to fill in *how* you connect and *how* you detect changes.

A few details matter once you go beyond this skeleton:

- **Dispatch events through the base, not directly.** Call `self.base.dispatch_event(event)` (or `dispatch_events_batch`) rather than writing to a channel yourself. `SourceBase` stamps monotonic sequence numbers and maintains the `sequence → position` mapping that recovery depends on.
- **Call `apply_subscription_settings` at the start of `subscribe()`.** Either call `self.base.apply_subscription_settings(&settings)` directly, or use `subscribe_with_bootstrap()` as shown above, which calls it for you. Skipping this breaks sequence continuity across restarts.
- **Decide whether your source supports replay.** `supports_replay()` defaults to `true`. If the system you're wrapping has a replayable log (a WAL, a CDC stream, a durable event store), leave it and encode each event's native position — an LSN, an offset — as `Option<Bytes>` on `source_position`. If your source is push-only and volatile (a metrics collector, a plain webhook receiver), override `supports_replay()` to return `false` and you can skip position handling entirely.

## Creating a custom Reaction

A Reaction receives query results and takes action — call a webhook, write to a database, push to a dashboard. It implements the `Reaction` trait:

```rust
use drasi_lib::{Reaction, ReactionBase, ReactionBaseParams, ComponentStatus};
use drasi_lib::context::ReactionRuntimeContext;
use async_trait::async_trait;

pub struct MyReaction {
    base: ReactionBase,
}

#[async_trait]
impl Reaction for MyReaction {
    fn id(&self) -> &str { self.base.get_id() }
    fn type_name(&self) -> &str { "my-reaction" }
    fn properties(&self) -> HashMap<String, serde_json::Value> { HashMap::new() }
    fn query_ids(&self) -> Vec<String> { self.base.get_queries().clone() }
    fn auto_start(&self) -> bool { self.base.get_auto_start() }

    async fn initialize(&self, context: ReactionRuntimeContext) {
        self.base.initialize(context).await;
    }

    async fn start(&self) -> Result<()> {
        self.base.set_status(ComponentStatus::Running, None).await;
        // spawn your result processing task — use base.enqueue_query_result()
        Ok(())
    }

    async fn stop(&self) -> Result<()> {
        self.base.stop_common().await;
        Ok(())
    }

    async fn status(&self) -> ComponentStatus {
        self.base.get_status().await
    }

    fn as_any(&self) -> &dyn std::any::Any { self }
}
```

Results arrive as `QueryResult` values containing `ResultDiff` items:

```rust
pub enum ResultDiff {
    Add { data: serde_json::Value },
    Delete { data: serde_json::Value },
    Update {
        data: serde_json::Value,      // current row
        before: serde_json::Value,    // previous values
        after: serde_json::Value,     // new values
        grouping_keys: Option<Vec<String>>,
    },
}
```

### Reaction recovery

Reactions can stop and restart without losing results. Each query keeps a bounded **outbox** of recent results (configurable with `.with_outbox_capacity(n)` on the query builder, default 1000); reactions persist a checkpoint after each delivered result; on restart, the runtime replays anything missed. If the checkpoint has fallen further behind than the outbox retains, that's a gap, and the **recovery policy** decides what happens next:

| Policy | Behavior on gap | Use case |
|--------|----------------|----------|
| `Strict` (default) | Fail with error — reaction stops | Correctness-critical (financial, audit) |
| `AutoReset` | Wipe checkpoint, re-bootstrap from full snapshot | Materialized views, caches |
| `AutoSkipGap` | Skip missing entries, resume from latest | Best-effort delivery (alerts, logs) |

Set a policy per-instance via `ReactionBaseParams::new(...).with_recovery_policy(...)`, or as your plugin's default by implementing a few methods on `Reaction`:

```rust
impl Reaction for MyReaction {
    // ...

    fn is_durable(&self) -> bool {
        true  // requires a durable StateStoreProvider
    }

    fn needs_snapshot_on_fresh_start(&self) -> bool {
        true  // triggers bootstrap() on first start with no checkpoint
    }

    fn default_recovery_policy(&self) -> ReactionRecoveryPolicy {
        ReactionRecoveryPolicy::AutoReset
    }

    async fn bootstrap(&self, ctx: BootstrapContext) -> Result<()> {
        // Called on fresh start (if needs_snapshot_on_fresh_start=true)
        // and on AutoReset recovery after a gap.
        let snapshot = ctx.fetch_snapshot().await?;
        while let Some(row) = snapshot.next().await {
            // Process each row...
        }
        Ok(())
    }
}
```

The runtime validates a few combinations at startup — `is_durable=true` without a durable state store, or `AutoReset` without `needs_snapshot_on_fresh_start`, both fail fast rather than silently misbehaving. If your target system is idempotent (safe to receive the same result twice), you can lean toward `AutoSkipGap` or `AutoReset`; if it isn't (e.g. it increments a counter on every delivery), stick with `Strict` or add deduplication in your reaction.

## Wire it into a running instance

Custom sources and reactions register with the builder exactly like built-in ones:

```rust
let core = DrasiLib::builder()
    .with_source(MySource::new(/* ... */))
    .with_reaction(MyReaction::new(/* ... */))
    .with_query(
        Query::cypher("my-query")
            .query("MATCH (n:Thing) WHERE n.value > 100 RETURN n")
            .from_source("my-source-id")
            .build()
    )
    .build()
    .await?;

core.start().await?;
```

Sources and reactions are owned by `DrasiLib` once passed to `with_source()` / `with_reaction()` — you configure them, hand them over, and the runtime manages their lifecycle from there.

## Going further

- **Dynamic loading:** the trait implementations above are enough for drasi-lib, where your plugin compiles directly into your binary. Drasi Server additionally supports loading plugins as `.so`/`.dylib`/`.dll` shared libraries at runtime — that requires an extra descriptor and an `export_plugin!` registration and is documented separately in the drasi-core repository's plugin architecture notes.
- **Let an agent do the implementation, testing, and docs:** the same two traits are what the `source-planner` / `source-plan-executor` and `reaction-planner` / `reaction-plan-executor` agents produce when you describe a target system in plain language. See [Source and Reaction Creation Agents](/reference/source-and-reaction-creation-agents/).
- **Study a real example:** the `postgres` source (full replay support) and `application` reaction are the most complete references in `components/sources` and `components/reactions` of the [drasi-core repository](https://github.com/drasi-project/drasi-core).
