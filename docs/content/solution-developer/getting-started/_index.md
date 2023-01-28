---
type: "docs"
title: "Getting Started"
linkTitle: "Getting Started"
weight: 10
description: >
    Building Solutions with Drasi
---

To use Drasi as part of a solution you must do the following three things:

1. Define [Sources](/solution-developer/sources) for each of the source databases or systems from which you want to detect and react to change.
1. Define [Continuous Queries](/solution-developer/continuous-queries) for each of the queries you want to run across those sources.
1. Define [Reactions](/solution-developer/reactions) to handle the output from each of your Continuous Queries and integrate the results into your broader solution.

Each of these steps is straightforward, requiring no code; full details are provided in the linked sections. 

However, as with many new technologies, the challenge to getting started with Drasi can be less about how to use it, and more about understanding **why** and **when** to use it. And learning how to use Drasi **most effectively** involves understanding where Drasi replaces and simplifies the way you detect and react to change today, as well as how Drasi enables new ways to think about query-driven solutions that would not be possible today with significant development efforts. 

The following sections will help you master Drasi quickly so you can start using it to build more responsive solutions that detect and react to change:
- The [Background](/solution-developer/background) section explores in more detail the problems Drasi was created to solve. This will be useful if you are looking for more context and trying to relate the benefits of Drasi to other alternatives for building solutions that detect and react to change.
- The [Solution Patterns](/solution-developer/solution-patterns) section describes how to use Drasi most effectively in your solutions. It describes multiple ways to think about and apply the functionality provided by Continuous Queries and Reactions. Some are improved alternatives to existing patterns, while others are unique to Drasi. 
- The [Troubleshooting](/solution-developer/troubleshooting) section provides guidance on how to investigate problems if they occur when you are creating the Sources, Continuous Queries, and Reactions that you will use as part of your solution
- The Drasi repo includes multiple [Sample Applications](/solution-developer/sample-apps/) that are fully functional solutions that demonstrate the use of Drasi in realistic scenarios. These sample apps contain working implementations of the patterns described in the [Solution Pattern](/solution-developer/solution-patterns) section.

To develop solutions that use Drasi, you will also need a Drasi deployment for dev/test. The [Deploying Drasi](/administrator/platform-deployment) section of the [Administration Guides](/administrator) describe how to deploy Drasi, providing a number of options for both local and cloud deployments. 