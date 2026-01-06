---
title: "drasi-lib"
linkTitle: "drasi-lib"
weight: 20
type: "docs"
no_list: true
description: "Embed Drasi's change detection in your Rust applications"
---

<div class="hero-section">
  <h1 class="hero-title">Embed Change Detection in Your Rust Applications</h1>
  <p class="hero-subtitle">drasi-lib is a Rust crate that brings Drasi's powerful continuous query engine directly into your application. Monitor data changes and react to them in real-time without external infrastructure.</p>

  <div class="cta-group">
    <a href="getting-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started
    </a>
    <a href="/concepts/continuous-queries/" class="cta-button cta-button--secondary">
      <i class="fas fa-lightbulb"></i>
      Learn Concepts
    </a>
  </div>
</div>

## How drasi-lib Works

<p class="section-intro">Add drasi-lib to your Cargo project, define your continuous queries, and handle changes programmatically. Everything runs in-process with no external dependencies.</p>

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-cube"></i>
    </div>
    <div class="flow-step__label">Add Crate</div>
    <div class="flow-step__description">Include drasi-lib in Cargo.toml</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-filter"></i>
    </div>
    <div class="flow-step__label">Define Queries</div>
    <div class="flow-step__description">Write continuous queries in Cypher</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-code"></i>
    </div>
    <div class="flow-step__label">Handle Changes</div>
    <div class="flow-step__description">React to results in your code</div>
  </div>
</div>

## When to Use drasi-lib

<p class="section-intro">Choose drasi-lib for embedded, lightweight, and self-contained reactive data applications.</p>

<div class="card-grid card-grid--3">
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-microchip"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Edge & Embedded</h3>
      <p class="unified-card-summary">Run change detection on edge devices or embedded systems without network dependencies.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-feather"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Lightweight</h3>
      <p class="unified-card-summary">No external services required. Everything runs in your application's process.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-sliders-h"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Fine-Grained Control</h3>
      <p class="unified-card-summary">Full programmatic control over sources, queries, and how you handle changes.</p>
    </div>
  </div>
</div>

## Explore drasi-lib

<div class="card-grid">
  <a href="tutorials/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fas fa-graduation-cap"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Tutorials</h3>
        <p class="unified-card-summary">Learn through hands-on examples</p>
      </div>
    </div>
  </a>
  <a href="how-to-guides/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-tools"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">How-to Guides</h3>
        <p class="unified-card-summary">Step-by-step instructions for common tasks</p>
      </div>
    </div>
  </a>
  <a href="/patterns/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon"><i class="fas fa-puzzle-piece"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Patterns</h3>
        <p class="unified-card-summary">Best practices for building change-driven applications</p>
      </div>
    </div>
  </a>
  <a href="reference/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-book"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Reference</h3>
        <p class="unified-card-summary">API documentation and specifications</p>
      </div>
    </div>
  </a>
</div>
