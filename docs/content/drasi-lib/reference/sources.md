---
type: "docs"
title: "Sources"
linkTitle: "Sources"
weight: 20
hide_readingtime: true
description: "Available Source plugins for drasi-lib"
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-lib/getting-started/"
  reference:
    - title: "Available Reactions"
      url: "/drasi-lib/reference/reactions/"
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
---

Sources ingest data from external systems or your application and emit graph elements (nodes and relationships) that feed into Continuous Queries. Each Source is a separate crate that you add to your `Cargo.toml` as needed. The full list of Sources is available on [GitHub](https://github.com/drasi-project/drasi-core/tree/main/components/sources).

## Available Sources

<div class="card-grid card-grid--2">
  <a href="https://crates.io/crates/drasi-source-application" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-code"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Application</h3>
        <p class="unified-card-summary">Push changes directly from your application code</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-grpc" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">High-throughput streaming via gRPC with bidirectional support</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-http" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Receive change events via HTTP webhooks</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-mock" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-flask"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Mock</h3>
        <p class="unified-card-summary">Generate test data for development and testing</p>
      </div>
    </div>
  </a>
  <!-- <a href="https://crates.io/crates/drasi-source-platform" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-server"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Consume from Redis Streams for Drasi Platform integration</p>
      </div>
    </div>
  </a> -->
  <a href="https://crates.io/crates/drasi-source-postgres" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">PostgreSQL</h3>
        <p class="unified-card-summary">Stream changes from PostgreSQL using logical replication</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-source-mssql" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SQL Server</h3>
        <p class="unified-card-summary">Stream changes from SQL Server using Change Data Capture (CDC)</p>
      </div>
    </div>
  </a>
</div>

## Building Custom Sources

If you need to integrate with a system not covered by the available Sources, implement the `Source` trait yourself, or have an AI agent do it for you:

<div class="card-grid card-grid--2">
  <a href="/drasi-lib/how-to-guides/creating-custom-sources-and-reactions/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-puzzle-piece"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Creating Custom Sources and Reactions</h3>
        <p class="unified-card-summary">The Source trait, a worked example, and how to wire it into DrasiLib</p>
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
