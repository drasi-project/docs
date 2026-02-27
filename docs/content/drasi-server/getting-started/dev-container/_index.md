---
type: "docs"
title: "Setup: Dev Container"
linkTitle: "Dev Container"
weight: 20
description: "Run Drasi Server in a VS Code Dev Container"
---

Use VS Code Dev Containers for a consistent development environment with all dependencies pre-installed.

## Prerequisites

- **Git** — Needed to clone the Drasi Server code
- **Docker** — Needed to run the Drasi Server Dev Container and the PostgreSQL database used in the tutorial
- **VS Code** — Needed to run the Drasi Server Dev Container and edit files during the tutorial
- **VS Code Dev Containers extension** — Needed to run the Drasi Server Dev Container

If you are not sure you have these prerequisites installed, or need help installing them, see the [troubleshooting section](#troubleshooting) at the end of this page for guidance.

## Step 1: Clone Drasi Server Repo

Clone the <a href="https://github.com/drasi-project/drasi-server" target="_blank" rel="noopener noreferrer">Drasi Server repository</a>. In a terminal, run:

```bash
git clone https://github.com/drasi-project/drasi-server.git
```

## Step 2: Open Drasi Server in a VS Code Dev Container

Once the cloning is complete, change to the newly created `drasi-server` folder and open it in VS Code:

```bash
cd drasi-server
code .
```

> **Tip:** If you are using VS Code Insiders, use `code-insiders .` instead of `code .` to open the folder.

When VS Code opens, look for a notification that says: **Folder contains a Dev Container configuration file. Reopen folder to develop in a container.**

Click **Reopen in Container**.

VS Code will display a list of available Dev Container configurations. Select **Drasi Server - Getting Started Tutorial** from the list.

> **Note**: If you don't see the notification described, press `F1` and type "Dev Containers: Reopen in Container". Then press enter to run the command then select "Drasi Server - Getting Started Tutorial" from the list of configurations.

The container takes several minutes to build on first run. During this time the setup script will:

1. Download Drasi Server and put the executable in the `./bin/drasi-server` folder.
2. Install a PostgreSQL client for use during the tutorial.
3. Install `curl`, which is used in later tutorial steps.

Watch the terminal for: **✅ Drasi Server Getting Started tutorial environment is ready!**

This indicates the container is ready to use.

## Step 3: Verify the Setup

Verify that Drasi Server is accessible by running the following command in the terminal:

```bash
./bin/drasi-server --version
```

You should see output showing the version number, for example:

```text
drasi-server 0.1.0
```

If you see a "file not found" error, the build may not have completed. Check the terminal output for errors and try rebuilding the container.

## ✅ Setup Complete

You now have Drasi Server accessible at `./bin/drasi-server` from the repository root.

<p><a href="../#database" class="btn btn-success btn-lg">Continue with the Tutorial <i class="fas fa-arrow-right ms-2"></i></a></p>

## Troubleshooting

### Installing Git

The tutorial uses `git` to clone the Drasi Server repository. If you don't have Git installed, you can install it from the <a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">Git download page</a>.

To verify Git is installed, run:

```bash
git --version
```

You should see output like `git version 2.x.x`. If you see "command not found", install Git from the link above.

### Installing Docker

The tutorial uses Docker to run the Drasi Server Dev Container and the PostgreSQL database.

If you are not sure you have Docker installed or that it is running, you can verify by running:

```bash
docker ps
```

If Docker is running, you'll see a table with these headings showing running containers (even if no containers are running):

```text
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

If you don't have Docker installed, the easiest way to get started depends on your platform:
  - **Mac/Windows**: Install <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">Docker Desktop</a>
  - **Linux**: Install <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener noreferrer">Docker Engine</a> (recommended) or <a href="https://docs.docker.com/desktop/setup/install/linux/" target="_blank" rel="noopener noreferrer">Docker Desktop</a>
  - Recommended resources: 4+ CPU cores, 8+ GB memory

If you see an error like `Cannot connect to the Docker daemon`, Docker isn't running. Start Docker Desktop (Mac/Windows) or the Docker service (`sudo systemctl start docker` on Linux) and wait for it to fully initialize, then try again. If problems persist, see the [Docker troubleshooting guide](https://docs.docker.com/config/daemon/troubleshoot/) for additional help.

### Installing VS Code

The tutorial uses VS Code to run the Drasi Server Dev Container and edit files. If you don't have VS Code installed, you can install it from the <a href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer">Visual Studio Code download page</a>.

### Installing VS Code Dev Containers Extension

The tutorial uses the VS Code Dev Containers extension to run the Drasi Server Dev Container. You can install it from the <a href="https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers" target="_blank" rel="noopener noreferrer">VS Code Marketplace</a>.

### Dev Container Tips

#### Port Forwarding

The Dev Container automatically forwards ports to your local machine. Check the **Ports** tab in VS Code to access:

- Port 8180 (Drasi Server API)
- Port 8181 (SSE stream)
- Port 5532 (PostgreSQL)

#### Rebuild the Container

If you change `.devcontainer/getting-started/devcontainer.json`:

1. Press `F1`
2. Select "Dev Containers: Rebuild Container"

#### Exit the Dev Container

To return to local development:

1. Press `F1`
2. Select "Dev Containers: Reopen Folder Locally"
