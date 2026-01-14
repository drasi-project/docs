---
type: "docs"
title: "Configure Reactions"
linkTitle: "Configure Reactions"
weight: 40
no_list: true
notoc: true
hide_readingtime: true
description: "Set up actions triggered by data changes"
---

Reactions process query result changes and perform actions. Drasi Server supports several reaction types for different output needs.

<div class="card-grid">
  <a href="configure-log-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-terminal"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Log</h3>
        <p class="unified-card-summary">Output query results to console with templates</p>
      </div>
    </div>
  </a>
  <a href="configure-http-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-globe"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">HTTP</h3>
        <p class="unified-card-summary">Send webhooks and HTTP requests on changes</p>
      </div>
    </div>
  </a>
  <a href="configure-grpc-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">gRPC</h3>
        <p class="unified-card-summary">Stream results via gRPC</p>
      </div>
    </div>
  </a>
  <a href="configure-sse-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-broadcast-tower"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SSE</h3>
        <p class="unified-card-summary">Stream results via Server-Sent Events</p>
      </div>
    </div>
  </a>
  <a href="configure-platform-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-stream"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Publish to Redis Streams</p>
      </div>
    </div>
  </a>
  <a href="configure-profiler-reaction/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-chart-line"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Profiler</h3>
        <p class="unified-card-summary">Collect performance metrics</p>
      </div>
    </div>
  </a>
</div>
