---
type: "docs"
title: "Setup: GitHub Codespace"
linkTitle: "GitHub Codespace"
weight: 10
description: "Run Drasi Server in a cloud-based GitHub Codespace"
---

This is the easiest way to get started with Drasi Server. Run everything in the cloud with GitHub Codespaces. No local installation required — just a browser and a GitHub account.

## Prerequisites

- A **GitHub account** (free tier works fine)
- A **web browser**

That's it! Docker, Rust, and all dependencies are pre-installed in the Codespace.

## Step 1: Launch the Codespace

Click the button below to create a new Codespace:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/drasi-server)

When prompted to select a **Dev Container Configuration**, choose **Drasi Server - Getting Started Tutorial**.

Or manually:

1. Go to [github.com/drasi-project/drasi-server](https://github.com/drasi-project/drasi-server)
2. Click the green **Code** button
3. Select the **Codespaces** tab
4. Click the **...** menu and select **New with options...**
5. Under **Dev container configuration**, select **Drasi Server - Getting Started Tutorial**
6. Click **Create codespace**

## Step 2: Wait for Setup

The Codespace takes a few minutes to initialize. During this time the setup script will:

1. Download Drasi Server and put the executable in the `./bin/drasi-server` folder.
2. Install a PostgreSQL client for use during the tutorial.
3. Install `curl`, which is used in later tutorial steps.

Watch the terminal for: **✅ Drasi Server Getting Started tutorial environment is ready!**

This indicates the container is ready to use.

> **Tip**: The first build takes several minutes. Subsequent Codespace sessions are faster if you don't delete the Codespace.

## Step 3: Verify the Setup

Verify that Drasi Server is accessible:

```bash
./bin/drasi-server --version
```

You should see output showing the version number, for example:

```text
drasi-server 0.1.0
```

## ✅ Setup Complete

You now have Drasi Server accessible at `./bin/drasi-server` from the repository root.

<p><a href="../#database" class="btn btn-success btn-lg">Continue with the Tutorial <i class="fas fa-arrow-right ms-2"></i></a></p>

## Codespace Tips

### Port Forwarding

The Codespace automatically forwards ports. Check the **Ports** tab to access:

- Port 8180 (Drasi Server API)
- Port 8181 (SSE stream)
- Port 5532 (PostgreSQL)

If you can't connect, right-click the port and select **Port Visibility → Public**.

### Stop the Codespace

To save your free hours:

1. Click **Codespaces** in the bottom-left corner
2. Select **Stop Current Codespace**

Or manage all Codespaces at [github.com/codespaces](https://github.com/codespaces).

### Delete When Done

To free storage quota, delete the Codespace from [github.com/codespaces](https://github.com/codespaces).
