---
type: "docs"
title: "Drasi Server"
linkTitle: "Drasi Server"
weight: 25
no_list: true
description: "Standalone Drasi server for process or container deployment"
---

<div class="hero-section hero-section--compact">
  <h1 class="hero-title">Run Drasi as a Standalone Server</h1>
  <p class="hero-subtitle">Drasi Server is a lightweight, single-process deployment that provides the full power of Drasi's data change processing functionality. Perfect for local development, Docker environments, and small-scale deployments.</p>

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

## How Drasi Server Works

<p class="section-intro">Define your Sources, Continuous Queries, and Reactions in a configuration file, run Drasi Server as a process or container, and start reacting to changes. Manage Drasi Server at Runtime through its Rest API.</p>

<div class="flow-diagram">
  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-file-code"></i>
    </div>
    <div class="flow-step__label">Configure</div>
    <div class="flow-step__description">Define sources, queries, and reactions</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-play"></i>
    </div>
    <div class="flow-step__label">Run Drasi Server</div>
    <div class="flow-step__description">Start as a process or container</div>
  </div>

  <div class="flow-arrow">
    <i class="fas fa-arrow-right"></i>
  </div>

  <div class="flow-step">
    <div class="flow-step__icon">
      <i class="fas fa-bolt"></i>
    </div>
    <div class="flow-step__label">React to Changes</div>
    <div class="flow-step__description">Trigger actions automatically</div>
  </div>
</div>

## When to Use Drasi Server

<p class="section-intro">Choose Drasi Server for development, testing, and small-scale production deployments of Drasi-powered change-driven solutions.</p>

<div class="card-grid card-grid--3">
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-laptop-code"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Local Development</h3>
      <p class="unified-card-summary">Run Drasi on your development machine for rapid iteration and testing.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fab fa-docker"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Docker Environments</h3>
      <p class="unified-card-summary">Integrate seamlessly with Docker Compose and container-based workflows.</p>
    </div>
  </div>
  <div class="unified-card unified-card--concepts">
    <div class="unified-card-icon"><i class="fas fa-feather-alt"></i></div>
    <div class="unified-card-content">
      <h3 class="unified-card-title">Small-Scale Deployments</h3>
      <p class="unified-card-summary">Full Drasi functionality using a single-process deployment.</p>
    </div>
  </div>
</div>

## Explore Drasi Server

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
  <a href="patterns/">
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
        <p class="unified-card-summary">API, CLI, and configuration documentation</p>
      </div>
    </div>
  </a>
</div>
