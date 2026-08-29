---
type: "docs"
title: "Drasi"
linkTitle: "Home"
weight: 1
description: >
    Drasi makes it easy and efficient to build change-driven solutions
---

<div class="hero-section hero-section--compact">
  <h1 class="hero-title">Build Change-driven Solutions with Drasi</h1>
  <p class="hero-subtitle">Drasi is a Data Change Processing platform that makes it easy to build change-driven solutions that detect complex changes across your data sources and react to them instantly.</p>

  <div class="cta-group">
    <a href="/get-started/" class="cta-button cta-button--primary">
      <i class="fas fa-rocket"></i>
      Get Started
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

{{< video src="video/drasi-explainer-30s.mp4" title="How Drasi works" >}}

## Which Drasi is right for you?

<p class="section-intro">Choose the deployment model that matches your use case, then follow the same Drasi concepts and patterns across the platform.</p>

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

## Explore the documentation

<div class="card-grid card-grid--3">
  <a href="/get-started/">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon">
        <i class="fas fa-rocket"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Get started</h3>
        <p class="unified-card-summary">Choose a deployment model and follow the right first steps.</p>
      </div>
    </div>
  </a>
  <a href="/build-and-configure/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon">
        <i class="fas fa-screwdriver-wrench"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Build &amp; configure</h3>
        <p class="unified-card-summary">Install, wire sources and reactions, write queries, and operate the platform.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Why Drasi</h3>
        <p class="unified-card-summary">Understand the architecture and ideas behind Drasi before you build on top of it.</p>
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

## Get involved

<div class="card-grid card-grid--3">
  <a href="https://aka.ms/drasidiscord" target="_blank" rel="noopener noreferrer">
    <div class="unified-card unified-card--community">
      <div class="unified-card-icon"><i class="fab fa-discord"></i></div>
      <div class="unified-card-content"><h3 class="unified-card-title">Discord</h3><p class="unified-card-summary">Ask questions and talk with the community.</p></div>
    </div>
  </a>
  <a href="https://github.com/drasi-project/docs/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
    <div class="unified-card unified-card--community">
      <div class="unified-card-icon"><i class="fas fa-hands-helping"></i></div>
      <div class="unified-card-content"><h3 class="unified-card-title">Contribute</h3><p class="unified-card-summary">Open an issue or help improve the docs and platform.</p></div>
    </div>
  </a>
  <a href="https://github.com/drasi-project" target="_blank" rel="noopener noreferrer">
    <div class="unified-card unified-card--community">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content"><h3 class="unified-card-title">GitHub</h3><p class="unified-card-summary">Browse the source, issues, and docs repositories.</p></div>
    </div>
  </a>
</div>