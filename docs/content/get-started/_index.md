---
type: "docs"
title: "Get started"
linkTitle: "Get started"
weight: 10
no_list: true
hide_readingtime: true
notoc: true
description: >
    Choose the Drasi deployment model that matches your use case and follow the right first steps.
---

<div class="hero-section hero-section--compact">
  <h1 class="hero-title">Choose the right Drasi path</h1>
  <p class="hero-subtitle">Start with the deployment model that matches your situation. Each path leads to the same core Drasi concepts, but the first steps differ depending on whether you want in-process integration, a standalone server, or Kubernetes-native operations. Not sure where to start? Drasi Server is the easiest way to get started.</p>
</div>

## Pick your deployment model

<div class="product-grid">
  <a href="/drasi-lib/getting-started/" class="product-card product-card--lib">
    <div class="product-card__icon">
      <i class="fab fa-rust"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">drasi-lib</h3>
      <p class="product-card__tagline">Add Drasi directly to a Rust application and start processing changes in-process.</p>
    </div>
  </a>
  <a href="/drasi-server/getting-started/" class="product-card product-card--server">    <span class="card-badge card-badge--featured">Easiest way to start</span>    <div class="product-card__icon">
      <i class="fab fa-docker"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">Drasi Server</h3>
      <p class="product-card__tagline">Run Drasi as a standalone service or container and configure sources and reactions around it.</p>
    </div>
  </a>
  <a href="/drasi-kubernetes/getting-started/" class="product-card product-card--kubernetes">
    <div class="product-card__icon">
      <i class="fas fa-dharmachakra"></i>
    </div>
    <div class="product-card__content">
      <h3 class="product-card__title">Drasi for Kubernetes</h3>
      <p class="product-card__tagline">Deploy Drasi on a cluster with scalable, Kubernetes-native operations and management.</p>
    </div>
  </a>
</div>

## Recommended starting points

<div class="card-grid card-grid--3">
  <a href="/concepts/overview/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon"><i class="fas fa-lightbulb"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Why Drasi?</h3>
        <p class="unified-card-summary">Understand the problem Drasi solves and how change-driven systems work.</p>
      </div>
    </div>
  </a>
  <a href="/reference/query-language/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-code"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Query language</h3>
        <p class="unified-card-summary">Learn the continuous query syntax used across Drasi deployments.</p>
      </div>
    </div>
  </a>
  <a href="/build-and-configure/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-screwdriver-wrench"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Build &amp; configure</h3>
        <p class="unified-card-summary">Install, wire sources and reactions, write queries, and operate the platform.</p>
      </div>
    </div>
  </a>
</div>
