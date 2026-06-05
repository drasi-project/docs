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

Sources ingest data from external systems or your application and emit graph elements (nodes and relationships) that feed into Continuous Queries. Each Source is a separate crate that you add to your `Cargo.toml` as needed.

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

If you need to integrate with a system not covered by the available Sources, you can build your own Source by following the Drasi Source Developer Guide:

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/tree/main/components/sources" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-tools"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Source Developer Guide</h3>
        <p class="unified-card-summary">Instructions and best practices for building custom Source plugins</p>
      </div>
    </div>
  </a>
</div>
