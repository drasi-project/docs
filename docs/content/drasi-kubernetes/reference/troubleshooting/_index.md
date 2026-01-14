---
type: "docs"
title: "Troubleshooting"
linkTitle: "Troubleshooting"
weight: 60
description: >
    Troubleshooting Drasi Issues
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  tutorials:
    - title: "Getting Started with Drasi for Kubernetes"
      url: "/drasi-kubernetes/getting-started/"
  howto:
    - title: "Install Drasi on Kubernetes"
      url: "/drasi-kubernetes/how-to-guides/installation/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

## Debug Reactor
**Coming Soon...**

## Known Issues

### Source / Continuous Query Race Condition
**Issue**: If you create a {{< term "Source" >}} and create a {{< term "Continuous Query" >}} that uses that Source before the Source has had a chance to connected to the source system correctly, the Continuous Query will be in a broken state because it could not {{< term "Bootstrap" "bootstrap" >}}, and there is currently no bootstrap retry mechanism.

**Resolution**: Delete the Continuous Query and re-create it.