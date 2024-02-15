---
type: "docs"
title: "Dev Container"
linkTitle: "Dev Container"
weight: 50
description: >
    Setup a demo environment using VS Code Dev Containers
---

This page describes how to quickly setup an environment for the `Getting Started` tutorial using VS Code Dev Container.

This environment will have:
- The Drasi CLI installed
- `kubectl` installed
- A Kubernetes (k3s) cluster configured
- A postgres pod deployed in the `drasi-system` namespace.


### Prerequisites
- VS Code
- `git` CLI

### Setting up the Dev Container
1. We will perform a spare-checkout to retrieve the dev container files. Execute the following commands in a terminal:
```bash
mkdir drasi-dev-container
cd drasi-dev-container
git init
git remote add -f origin https://azure-octo@dev.azure.com/azure-octo/Incubations/_git/ReactiveGraph
git sparse-checkout init
git sparse-checkout set "tutorial/getting-started/" # Specifies the folder
git pull origin develop
```
2. Open the folder in VS Code through the following command:
```bash
cd tutorial/getting-started
code .
```
3. Type `Contrl + Shift + P`
4. Type 'Dev container'
5. Select 'Dev Containers: Rebuild and Reopen in Container'
6. The environment should be ready in a short period of time. Execute the following command to deploy Drasi:
```bash
drasi init --version preview.1
```