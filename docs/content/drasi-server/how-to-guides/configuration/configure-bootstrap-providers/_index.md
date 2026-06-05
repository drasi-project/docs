---
type: "docs"
title: "Configure Bootstrap Providers"
linkTitle: "Configure Bootstrap Providers"
weight: 30
no_list: true
notoc: true
hide_readingtime: true
description: "Load initial data before streaming begins"
---

{{< term "Bootstrap" >}} providers load initial data into {{< term "Continuous Query" "queries" >}} before streaming begins.

## Available bootstrap providers

<div class="card-grid">
  <a href="configure-noop-bootstrap-provider/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-ban"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">NoOp</h3>
        <p class="unified-card-summary">Disable bootstrap and only process streaming changes</p>
      </div>
    </div>
  </a>
  <!-- <a href="configure-platform-bootstrap-provider/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-network-wired"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Platform</h3>
        <p class="unified-card-summary">Bootstrap from a remote Drasi Query API over HTTP</p>
      </div>
    </div>
  </a> -->
  <a href="configure-postgres-bootstrap-provider/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">PostgreSQL</h3>
        <p class="unified-card-summary">Bootstrap from a PostgreSQL snapshot (PostgreSQL sources only)</p>
      </div>
    </div>
  </a>
  <a href="configure-mssql-bootstrap-provider/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-database"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">SQL Server</h3>
        <p class="unified-card-summary">Bootstrap from a SQL Server snapshot (SQL Server sources only)</p>
      </div>
    </div>
  </a>
  <a href="configure-scriptfile-bootstrap-provider/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-file-alt"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">ScriptFile</h3>
        <p class="unified-card-summary">Bootstrap from JSONL (JSON Lines) files</p>
      </div>
    </div>
  </a>
</div>
