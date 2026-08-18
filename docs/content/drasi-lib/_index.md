---
type: "docs"
title: "drasi-lib"
linkTitle: "drasi-lib"
weight: 20
no_list: true
hide_readingtime: true
description: "Build Change-driven Rust solutions"
---

<div class="hero-section hero-section--compact">
  <h1 class="hero-title">Build Change-driven Rust Solutions</h1>
  <p class="hero-subtitle">drasi-lib is a Rust crate that brings Drasi's powerful change processing functionality directly into your application. Monitor data changes and react to them in real-time without external infrastructure.</p>

  <div class="cta-group">
    <a href="getting-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started
    </a>
    <a href="/concepts/overview/" class="cta-button cta-button--secondary">
      <i class="fas fa-lightbulb"></i>
      Why Drasi?
    </a>
  </div>
</div>

## How drasi-lib Works

<p class="section-intro">Add drasi-lib to your Rust project, create Sources, Continuous Queries, and Reactions in code, and handle changes programmatically. Everything runs in-process with no external infrastructure.</p>

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-box"></i>
    </div>
    <div class="flow-step__label">Add Crate</div>
    <div class="flow-step__description">Include drasi-lib in Cargo.toml</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-code"></i>
    </div>
    <div class="flow-step__label">Write Code</div>
    <div class="flow-step__description">Create Sources, Queries, and Reactions</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-bolt"></i>
    </div>
    <div class="flow-step__label">Handle Changes</div>
    <div class="flow-step__description">React to results in your code</div>
  </div>
</div>

Your application can ingest changes from external sources (like PostgreSQL or gRPC streams), from internal application state via App Sources, or both. Continuous queries process these changes and produce results that flow to Reactions—which can call external systems, update internal state via App Reactions, or both. The API layer gives your application direct access to query results and runtime control.

![drasi-lib architecture showing Sources, Queries, and Reactions running inside a Rust application](drasi-lib-architecture.png)

## When to Use drasi-lib

drasi-lib is ideal when you are developing a Rust application or service and need **efficient and precise change detection** without deploying separate infrastructure:

- **Event-driven microservices** — React to database changes without polling; get before/after states for every change
- **Real-time monitoring** — Trigger alerts when aggregations cross thresholds or conditions persist
- **In-app reactive logic** — Use application sources and reactions to drive and respond to state changes within your application, replacing complex event wiring with declarative queries
- **Edge and embedded systems** — Run change detection locally with minimal footprint
- **Custom data pipelines** — Embed reactive queries in ETL processes or stream processors

## Documentation Resources

<p class="section-intro">The drasi-lib crate is published to crates.io with full API documentation available on docs.rs.</p>

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/lib/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">GitHub README</h3>
        <p class="unified-card-summary">Source repository documentation with getting started guide and examples</p>
      </div>
    </div>
  </a>
  <a href="https://crates.io/crates/drasi-lib" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">crates.io</h3>
        <p class="unified-card-summary">Package information, version history, and installation instructions</p>
      </div>
    </div>
  </a>
  <a href="https://docs.rs/drasi-lib" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-book"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">docs.rs</h3>
        <p class="unified-card-summary">Complete API documentation, examples, and usage guides</p>
      </div>
    </div>
  </a>
</div>

## Other Languages

<p class="section-intro">drasi-lib is also available for Node.js and Python, each with its own documentation site.</p>

<div class="card-grid card-grid--2">
  <a href="https://drasi-project.github.io/drasi-nodejs/" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-node-js"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Node.js (<code>@drasi/lib</code>)</h3>
        <p class="unified-card-summary">Embed the Drasi continuous-query engine in a Node.js application</p>
      </div>
    </div>
  </a>
  <a href="https://drasi-project.github.io/drasi-python/" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fab fa-python"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Python (<code>drasi-lib</code>)</h3>
        <p class="unified-card-summary">Embed the Drasi continuous-query engine in a Python application</p>
      </div>
    </div>
  </a>
</div>
