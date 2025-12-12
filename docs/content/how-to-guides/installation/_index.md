---
type: "docs"
title: "Install Drasi"
linkTitle: "Install Drasi"
weight: 10
layout: "install_platform_list"
description: >
    Learn how to install and deploy Drasi
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/getting-started/"
  concepts:
    - title: "Deployment Modes"
      url: "/concepts/deployment-modes/"
    - title: "Why Drasi?"
      url: "/concepts/overview/"
  howto:
    - title: "Using Drasi Server"
      url: "/how-to-guides/installation/drasi-server/"
    - title: "Using drasi-lib"
      url: "/how-to-guides/installation/drasi-lib/"
    - title: "Configure Sources"
      url: "/how-to-guides/configure-sources/"
    - title: "Configure Reactions"
      url: "/how-to-guides/configure-reactions/"
  reference:
    - title: "CLI Reference"
      url: "/reference/command-line-interface/"
---

## Choose Your Deployment Mode

Drasi offers three deployment modes to fit your needs:

<div class="card-grid">
  <a href="/how-to-guides/installation/drasi-lib/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon">
        <i class="fas fa-book"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Drasi Library (drasi-lib)</h3>
        <p class="unified-card-summary">Embed Drasi in your Rust applications. Perfect for embedded systems and applications that need minimal dependencies.</p>
        <p><strong>Status:</strong> Coming Soon</p>
      </div>
    </div>
  </a>
  
  <a href="/how-to-guides/installation/drasi-server/">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon">
        <i class="fas fa-server"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Drasi Server</h3>
        <p class="unified-card-summary">Run Drasi as a standalone server. Ideal for development and simple deployments without Kubernetes.</p>
        <p><strong>Status:</strong> Coming Soon</p>
      </div>
    </div>
  </a>
  
  <a href="#drasi-platform-kubernetes">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon">
        <i class="fas fa-cloud"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Drasi Platform (Kubernetes)</h3>
        <p class="unified-card-summary">Deploy on Kubernetes for production. Provides scalability, high availability, and enterprise features.</p>
        <p><strong>Status:</strong> Available Now</p>
      </div>
    </div>
  </a>
</div>

Not sure which deployment mode is right for you? See [Deployment Modes](/concepts/deployment-modes/) for a detailed comparison.

## Drasi Platform (Kubernetes)

The following guides help you install Drasi Platform on various Kubernetes environments:
