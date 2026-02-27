---
type: "docs"
title: "Setup: Download Binary"
linkTitle: "Download Binary"
weight: 5
description: "Download a prebuilt Drasi Server binary for your platform"
---

This is the fastest way to get started with Drasi Server. The instructions below describe how to download a prebuilt Drasi Server binary that is right for your platform and how to get everything set up to run the tutorial.

## Prerequisites

- **curl** — Needed to download files and to interact with Drasi Server during the tutorial
- **Docker** and **Docker Compose** — Needed to run the PostgreSQL database used in the tutorial
- **Text Editor** — Needed to edit files during the tutorial

If you are not sure you have these prerequisites installed, or need help installing them, see the [troubleshooting section](#troubleshooting) at the end of this page for guidance.

## Step 1: Create Tutorial Directory

Open a terminal and in a suitable location on your machine, create a directory for the tutorial files, then change to that directory. For example:

```bash
mkdir drasi-server
cd drasi-server
```

## Step 2: Download Tutorial Files

There are a set files used during setup and the tutorial that you need to download. Use the following command to download the zip file containing the files, then unzip it:

{{< tabpane persist="header" >}}
{{< tab header="Mac / Linux" lang="bash" >}}
curl -fsSL https://github.com/drasi-project/drasi-server/releases/download/0.1.3/drasi-server-examples.zip -o drasi-server-examples.zip
unzip drasi-server-examples.zip -d .
{{< /tab >}}
{{< tab header="Windows" lang="powershell" >}}
curl -fsSL https://github.com/drasi-project/drasi-server/releases/download/0.1.3/drasi-server-examples.zip -o drasi-server-examples.zip
tar -xf drasi-server-examples.zip
{{< /tab >}}
{{< /tabpane >}}

## Step 3: Download Drasi Binaries

There are 2 binary files you need to download to proceed with the tutorial:

1. **drasi-server** - the main Drasi Server executable
2. **drasi-sse-cli** - a tool used during the tutorial to observe notifications sent by Drasi Server

The rest of the tutorial assumes these files are in the `./bin/drasi-server` directory.

To download the correct binaries for your platform run the following command:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
./examples/getting-started/scripts/download.sh
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
.\examples\getting-started\scripts\download.ps1
{{< /tab >}}
{{< /tabpane >}}

## Step 4: Create Docker network

Create a Docker network so that Drasi Server and the tutorial database container can communicate with each other:

```bash
docker network create drasi-network
```

## ✅ Setup Complete

You now have Drasi Server accessible at `./bin/drasi-server` from the repository root.

<p><a href="../#database" class="btn btn-success btn-lg">Continue with the Tutorial <i class="fas fa-arrow-right ms-2"></i></a></p>

## Troubleshooting

### Installing curl

The tutorial uses `curl` to download the Drasi Server and Drasi SSE CLI binaries, and to interact with Drasi Server during the tutorial. If you don't have `curl` installed you can install it using the instructions on the <a href="https://curl.se/download.html" target="_blank" rel="noopener noreferrer">curl download page</a>

### Installing Docker and Docker Compose

The tutorial uses Docker and Docker Compose to run a PostgreSQL database that is used as a Source in the tutorial. 

If you are not sure you have Docker installed or that it is running, you can verify by running:

```bash
docker --ps
```

If Docker is running, you'll see a table with these headings showing running containers (even if no containers are running):

```text
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

To verify you have Docker Compose installed, run:

```bash
docker compose version
``` 

If Docker Compose is installed, you should see output showing the version number, for example:

```text
Docker Compose version v2.10.2
``` 

If you don't have Docker and Docker Compose installed, the easiest way to get started depends on your platform:
  - **Mac/Windows**: Install <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">Docker Desktop</a> (includes Docker Compose)
  - **Linux**: Install <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener noreferrer">Docker Engine</a> and the <a href="https://docs.docker.com/compose/install/linux/" target="_blank" rel="noopener noreferrer">Docker Compose plugin</a>, or install <a href="https://docs.docker.com/desktop/setup/install/linux/" target="_blank" rel="noopener noreferrer">Docker Desktop</a> (includes Docker Compose)
  - Recommended resources: 4+ CPU cores, 8+ GB memory

 If have problems running or installing Docker, see the [Docker troubleshooting guide](https://docs.docker.com/config/daemon/troubleshoot/) for help.
