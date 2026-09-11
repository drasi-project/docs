---
type: "docs"
title: "Build & configure"
linkTitle: "Build & configure"
weight: 20
no_list: true
hide_readingtime: true
notoc: true
description: >
    Task-oriented setup and configuration guidance for installation, sources, reactions, queries, and operations.
---

<div class="hero-section hero-section--compact">
  <h1 class="hero-title">Build and configure Drasi</h1>
  <p class="hero-subtitle">Pick the job you need to do. Each section groups the matching Drasi Server and Kubernetes how-to guides so you can stay on the task instead of choosing a product tree first.</p>
</div>

<p class="section-intro">Use these four task groups to install Drasi, connect sources and reactions, write continuous queries, and operate a running environment. The underlying pages are unchanged — only the grouping is new.</p>

## Install

<p class="section-intro">Get Drasi running as a standalone process, container, or Kubernetes deployment.</p>

<div class="card-grid card-grid--2">
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Server</h3>
      <ul>
        <li><a href="/drasi-server/how-to-guides/installation/">Installation overview</a></li>
        <li><a href="/drasi-server/how-to-guides/installation/download-binary/">Download the binary</a></li>
        <li><a href="/drasi-server/how-to-guides/installation/install-with-docker/">Run with Docker</a></li>
        <li><a href="/drasi-server/how-to-guides/installation/build-from-source/">Build from source</a></li>
      </ul>
    </div>
  </div>
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-dharmachakra"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi for Kubernetes</h3>
      <ul>
        <li><a href="/drasi-kubernetes/how-to-guides/installation/">Install on Kubernetes</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/testing/">Set up a test environment</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/install-sample-applications/">Install sample applications</a></li>
      </ul>
    </div>
  </div>
</div>

## Configure

<p class="section-intro">Connect sources, configure reactions, and set the supporting runtime pieces such as secrets, identity, and bootstrap data.</p>

<div class="card-grid card-grid--2">
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Server</h3>
      <ul>
        <li><a href="/drasi-server/how-to-guides/configuration/">Configuration overview</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-drasi-server/">Configure the server</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-sources/">Configure sources</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-reactions/">Configure reactions</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-bootstrap-providers/">Configure bootstrap providers</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-secret-stores/">Configure secret stores</a></li>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-identity-providers/">Configure identity providers</a></li>
      </ul>
    </div>
  </div>
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-dharmachakra"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi for Kubernetes</h3>
      <ul>
        <li><a href="/drasi-kubernetes/how-to-guides/configure-sources/">Configure sources</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/configure-reactions/">Configure reactions</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/configure-query-containers/">Configure query containers</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/extend-drasi/">Extend Drasi</a></li>
      </ul>
    </div>
  </div>
</div>

## Query

<p class="section-intro">Write, debug, and run continuous queries after sources and reactions are in place.</p>

<div class="card-grid card-grid--2">
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Server</h3>
      <ul>
        <li><a href="/drasi-server/how-to-guides/configuration/configure-queries/">Configure queries</a></li>
        <li><a href="/reference/query-language/">Query language reference</a></li>
      </ul>
    </div>
  </div>
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-dharmachakra"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi for Kubernetes</h3>
      <ul>
        <li><a href="/drasi-kubernetes/how-to-guides/configure-query-containers/">Configure query containers</a></li>
        <li><a href="/reference/query-language/">Query language reference</a></li>
      </ul>
    </div>
  </div>
</div>

## Operate

<p class="section-intro">Monitor, scale, test, and maintain a running Drasi environment.</p>

<div class="card-grid card-grid--2">
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi Server</h3>
      <ul>
        <li><a href="/drasi-server/reference/cli/">CLI reference</a></li>
        <li><a href="/drasi-server/reference/rest-api/">REST API reference</a></li>
        <li><a href="/drasi-server/reference/configuration/">Configuration reference</a></li>
      </ul>
    </div>
  </div>
  <div class="unified-card unified-card--howto unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-dharmachakra"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Drasi for Kubernetes</h3>
      <ul>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/">Manage Drasi</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/observability/">Observability</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/monitoring/">Monitoring</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/scaling/">Scaling</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/troubleshooting/">Troubleshooting</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/operations/maintenance/">Maintenance</a></li>
        <li><a href="/drasi-kubernetes/how-to-guides/testing/">Testing</a></li>
      </ul>
    </div>
  </div>
</div>

## Related content

<div class="card-grid card-grid--3">
  <a href="/get-started/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-rocket"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Get started</h3>
        <p class="unified-card-summary">Choose a deployment model before you start configuring it.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon"><i class="fas fa-lightbulb"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Concepts</h3>
        <p class="unified-card-summary">Understand the architecture and design ideas behind the platform.</p>
      </div>
    </div>
  </a>
  <a href="/reference/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-book"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Reference</h3>
        <p class="unified-card-summary">Look up query language, CLI, config, and API details while you implement.</p>
      </div>
    </div>
  </a>
</div>
