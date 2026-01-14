---
type: "docs"
title: "Configure Sources"
linkTitle: "Configure Sources"
weight: 20
no_list: true
notoc: true
hide_readingtime: true
description: "Connect Drasi Server to databases, APIs, and data streams"
---

Sources connect Drasi Server to your data systems and stream changes to queries. Drasi Server supports several source types for different data systems and use cases.

<div class="card-grid">
  <a href="configure-postgresql-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">PostgreSQL</h3>
        <p class="unified-card-summary">Stream changes from PostgreSQL using logical replication (WAL)</p>
      </div>
    </div>
  </a>
  <a href="configure-http-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Receive events via HTTP endpoints</p>
      </div>
    </div>
  </a>
  <a href="configure-grpc-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">Receive events via gRPC streaming</p>
      </div>
    </div>
  </a>
  <a href="configure-mock-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-flask"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Mock</h3>
        <p class="unified-card-summary">Generate test data for development</p>
      </div>
    </div>
  </a>
  <a href="configure-platform-source/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-stream"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Consume from Redis Streams for Drasi Platform integration</p>
      </div>
    </div>
  </a>
</div>
