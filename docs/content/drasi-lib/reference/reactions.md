---
type: "docs"
title: "Reactions"
linkTitle: "Reactions"
weight: 30
hide_readingtime: true
description: "Available Reaction plugins for drasi-lib"
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-lib/getting-started/"
  reference:
    - title: "Available Sources"
      url: "/drasi-lib/reference/sources/"
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
---

Reactions respond to changes in Continuous Query results and trigger actions, such as sending webhooks, logging, updating databases, or calling back into your application. Each Reaction is a separate crate that you add to your `Cargo.toml` as needed. The full list of Reactions is available on [GitHub](https://github.com/drasi-project/drasi-core/tree/main/components/reactions).

## Available Reactions

<div class="card-grid card-grid--2">
  <a href="https://crates.io/crates/drasi-reaction-application" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-code"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Application</h3>
        <p class="unified-card-summary">Handle query result changes directly in your application code</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-grpc" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">Stream query results via gRPC to external services</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-http" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Send webhooks to external endpoints on query result changes</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-log" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-terminal"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Log</h3>
        <p class="unified-card-summary">Output query result changes to console with configurable templates</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-storedproc-mysql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">MySQL Stored Proc</h3>
        <p class="unified-card-summary">Execute MySQL stored procedures on query result changes</p>
      </div>
    </div>
  </a>
  <!-- <a href="https://crates.io/crates/drasi-reaction-platform" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-server"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Publish query results to Redis Streams for Drasi Platform integration</p>
      </div>
    </div>
  </a> -->
  <a href="https://crates.io/crates/drasi-reaction-storedproc-postgres" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">PostgreSQL Stored Proc</h3>
        <p class="unified-card-summary">Execute PostgreSQL stored procedures on query result changes</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-profiler" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-chart-line"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Profiler</h3>
        <p class="unified-card-summary">Collect performance metrics for query execution</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-storedproc-mssql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SQL Server Stored Proc</h3>
        <p class="unified-card-summary">Execute SQL Server stored procedures on query result changes</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-reaction-sse" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-broadcast-tower"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SSE</h3>
        <p class="unified-card-summary">Server-Sent Events for browser and client streaming</p>
      </div>
    </div>
  </a>
</div>


## Building Custom Reactions

If you need to integrate with a system not covered by the available Reactions, implement the `Reaction` trait yourself, or have an AI agent do it for you:

<div class="card-grid card-grid--2">
  <a href="/drasi-lib/how-to-guides/creating-custom-sources-and-reactions/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-puzzle-piece"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Creating Custom Sources and Reactions</h3>
        <p class="unified-card-summary">The Reaction trait, recovery policies, and a worked example</p>
      </div>
    </div>
  </a>
  <a href="/reference/source-and-reaction-creation-agents/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-robot"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Source and Reaction Creation Agents</h3>
        <p class="unified-card-summary">Let a Copilot agent plan, build, test, and document the plugin</p>
      </div>
    </div>
  </a>
</div>
