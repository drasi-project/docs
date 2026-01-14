---
type: "docs"
title: "Drasi"
linkTitle: "Home"
weight: 1
description: >
    Drasi makes it easy and efficient to detect and react to changes in databases
---

<div class="hero-section">
  <h1 class="hero-title">React Instantly and Intelligently to Data Changes</h1>
  <p class="hero-subtitle">Drasi is a Data Change Processing platform that makes it easy build change-driven solutions that detect complex changes across your data sources and react to them instantly.</p>

  <div class="cta-group">
    <a href="/drasi-server/getting-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started in 10 Minutes
    </a>
    <a href="/concepts/overview/" class="cta-button cta-button--secondary">
      <i class="fas fa-play-circle"></i>
      Why Drasi?
    </a>
  </div>
</div>

## How Drasi Works

<p class="section-intro">Drasi watches your data sources for changes, evaluates them against your queries in real-time, and triggers reactions when conditions are met. No polling, no complex event processing infrastructure needed.</p>

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-database"></i>
    </div>
    <div class="flow-step__label">Sources</div>
    <div class="flow-step__description">Connect to your data sources</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-filter"></i>
    </div>
    <div class="flow-step__label">Continuous Queries</div>
    <div class="flow-step__description">Define what changes matter</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-bolt"></i>
    </div>
    <div class="flow-step__label">Reactions</div>
    <div class="flow-step__description">Take action automatically</div>
  </div>
</div>

## Explore Drasi

<p class="section-intro">Drasi is available in three forms to match your deployment needs and use case.</p>

<div class="product-grid">
  <a href="/drasi-lib/" class="product-card product-card--lib">
    <div class="product-card__icon">
      <i class="fab fa-rust"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">drasi-lib</h3>
      <p class="product-card__tagline">In-process change detection for Rust applications</p>
    </div>
  </a>

  <a href="/drasi-server/" class="product-card product-card--server">
    <div class="product-card__icon">
      <i class="fab fa-docker"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">Drasi Server</h3>
      <p class="product-card__tagline">Run Drasi as a standalone process or in a container</p>
    </div>
  </a>

  <a href="/drasi-kubernetes/" class="product-card product-card--kubernetes">
    <div class="product-card__icon">
      <i class="fas fa-dharmachakra"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">Drasi for Kubernetes</h3>
      <p class="product-card__tagline">Run Drasi at scale on a Kubernetes cluster</p>
    </div>
  </a>
</div>

## Explore the Documentation

<div class="card-grid card-grid--3">
  <a href="/concepts/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Concepts</h3>
        <p class="unified-card-summary">Understand the architecture and ideas behind Drasi. Learn how components work together to process data changes effectively.</p>
      </div>
    </div>
  </a>
  <a href="/learning-paths/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon">
        <i class="fas fa-route"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Learning Paths</h3>
        <p class="unified-card-summary">Structured learning paths for different roles: developers, DevOps/SRE, and architects.</p>
      </div>
    </div>
  </a>
  <a href="/reference/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Reference</h3>
        <p class="unified-card-summary">Query language, schemas, glossary, patterns, and sample data.</p>
      </div>
    </div>
  </a>
</div>