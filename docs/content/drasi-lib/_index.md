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
  <p class="hero-subtitle">drasi-lib is a Rust crate that brings Drasi's powerful change processing functionality directly into your application. Monitor data changes and react to them in real-time without external infrastructure.</p>

  <div class="cta-group">
    <a href="getting-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started
    </a>
    <a href="/concepts/overview/" class="cta-button cta-button--secondary">
      <i class="fas fa-lightbulb"></i>
      Learn Concepts
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

## When to Use drasi-lib

<p class="section-intro">Choose drasi-lib for embedded, lightweight, and self-contained change-driven solutions.</p>

<div class="card-grid card-grid--3">
  <div class="unified-card unified-card--concepts unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-microchip"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Edge & Embedded</h3>
      <p class="unified-card-summary">Run change-driven solutions on edge devices or embedded systems without network dependencies.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-feather"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Lightweight</h3>
      <p class="unified-card-summary">No external services required. Everything runs in your application's process.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts unified-card--static">
    <div class="unified-card-icon"><i class="fas fa-sliders-h"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Fine-Grained Control</h3>
      <p class="unified-card-summary">Full programmatic control over Sources, Continuous Queries, and Reactions.</p>
    </div>
  </div>
</div>

## Documentation

<p class="section-intro">The drasi-lib crate is published to crates.io with full API documentation available on docs.rs.</p>

<div class="card-grid card-grid--2">
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
