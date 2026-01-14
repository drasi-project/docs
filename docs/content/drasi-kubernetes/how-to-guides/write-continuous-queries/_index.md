---
type: "docs"
title: "Write Continuous Queries"
linkTitle: "Write Continuous Queries"
weight: 50
toc_hide: true
description: >
    Write and debug Continuous Queries
related:
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Middleware"
      url: "/concepts/middleware/"
  howto:
    - title: "Configure Sources"
      url: "/drasi-kubernetes/how-to-guides/configure-sources/"
    - title: "Configure Reactions"
      url: "/drasi-kubernetes/how-to-guides/configure-reactions/"
  reference:
    - title: "Query Language Reference"
      url: "/reference/query-language/"
    - title: "Drasi Custom Functions"
      url: "/reference/query-language/drasi-custom-functions/"
    - title: "VS Code Extension"
      url: "/reference/vscode-extension/"
---

The VS Code extension enables you to rapidly test the validity of your {{< term "Continuous Query" "continuous queries" >}} by providing a one click `Run` button that will {{< term "Bootstrap" "bootstrap" >}}, execute and display the results/errors of queries within your VS Code workspace.

## Installing

Download the VS Code extension from https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-0.0.3.vsix (Ensure that you are logged in to Github). 
Open the VS Code command palette and run the `Extensions: Install from VSIX` command and select the `drasi-0.0.3.vsix` from your download location.

## Usage

Once the extension is installed, the `Drasi Explorer` view should be visible in the Activity Bar.  This will scan your workspace for YAML files that contain continuous queries and enable you to execute them once off against your Drasi instance.  You will need to manually deploy any {{< term "Source" "source(s)" >}} that your queries depend upon.

![Drasi Explorer](drasi-explorer.png)