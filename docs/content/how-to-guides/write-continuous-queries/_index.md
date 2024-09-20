---
type: "docs"
title: "Write Continuous Queries"
linkTitle: "Write Continuous Queries"
weight: 50
description: >
    Write and debug Continuous Queries
---

The VS Code extension enables you to rapidly test the validity of your continuous queries by providing a one click `Run` button that will bootstap, execute and display the results/errors of queries within your VS Code workspace.

## Installing

Download the VS Code extension from https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-0.0.3.vsix (Ensure that you are logged in to Github). 
Open the VS Code command palette and run the `Extensions: Install from VSIX` command and select the `drasi-0.0.3.vsix` from your download location.

## Usage

Once the extension is installed, the `Drasi Explorer` view should be visible in the Activity Bar.  This will scan your workspace for YAML files that contain continuous queries and enable you to execute them once off against your Drasi instance.  You will need to manually deploy any source(s) the your queries depend upon.

![Drasi Explorer](drasi-explorer.png)