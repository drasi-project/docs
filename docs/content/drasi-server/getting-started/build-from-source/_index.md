---
type: "docs"
title: "Setup: Build from Source"
linkTitle: "Build from Source"
weight: 40
toc_hide: true
description: "Build Drasi Server from source code"
---

Building from source is the most complex approach for getting Drasi Server so you can work through the Getting Started tutorial, and it is strongly recommended to use one of the other approaches if you just want to start using Drasi Server quickly. This approach is ideal for future contributors or if you want to modify the code.

## Prerequisites

- **Git** — Needed to clone the Drasi Server code
- **Docker** and **Docker Compose** — Needed to run the PostgreSQL database used in the tutorial
- **Rust 1.88+** — Needed to build Drasi Server
- **Text Editor** — Needed to edit files during the tutorial
- **curl** — Used to interact with Drasi Server's REST API during the tutorial

If you are not sure you have these prerequisites installed, or need help installing them, see the [troubleshooting section](#troubleshooting) at the end of this page for guidance.

## Step 1: Setup Native Build Dependencies

Building Drasi Server requires several native C libraries. Install the dependencies for your platform:

### macOS

Install Xcode Command Line Tools to get `clang` and `perl`.

Then install the remaining dependencies with Homebrew:

```bash
brew install protobuf
brew install jq
```

### Debian / Ubuntu

`perl` is pre-installed. Install everything else with:

```bash
sudo apt-get install -y libssl-dev pkg-config clang libclang-dev libjq-dev libonig-dev protobuf-compiler 
```
  
### Windows

Building natively on Windows requires the Visual Studio 2022 Build Tools (for the MSVC toolchain):

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e `
    --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Then install the pinned Rust MSVC toolchain:

```powershell
rustup toolchain install 1.88.0-x86_64-pc-windows-msvc
```

## Step 2: Clone Drasi Server Repo

Clone the <a href="https://github.com/drasi-project/drasi-server" target="_blank" rel="noopener noreferrer">Drasi Server repository</a>. In a terminal, run:

```bash
git clone https://github.com/drasi-project/drasi-server.git
```

## Step 3: Build Drasi Server

Once the cloning is complete, change to the newly created `drasi-server` folder.

```bash
cd drasi-server
```

### Run the Build

Build and install Drasi Server:

```bash
cargo install --path . --root . --locked
```

The `cargo install` command takes several minutes to complete the first time you run it because it needs to download and compile all dependencies. Subsequent runs will be much faster since Cargo caches the compiled dependencies.

The `--root .` flag tells Cargo to put the newly built `drasi-server` binary in the `./bin` directory, which is where the rest of the tutorial assumes it will be.

### Verify the Build

Verify the `drasi-server` binary works:

```bash
./bin/drasi-server --version
```

You should see output showing the version number, for example:

```text
drasi-server 0.2.0
rustc: rustc 1.88.0 (6b00bc388 2025-06-23)
plugin-sdk: 0.8.4
```

## Step 4: Build the SSE CLI

The tutorial uses a companion CLI tool called `drasi-sse-cli` to observe Server-Sent Events (SSE) sent by Drasi Server in later steps. This is a separate Rust project in the `examples/sse-cli` folder of the repository.

To build the SSE CLI run:

```bash
cargo install --path examples/sse-cli --root . --locked
```

The build will put the `drasi-sse-cli` binary in the `./bin` directory with the `drasi-server` binary, where the tutorial expects it.

Verify the `drasi-sse-cli` binary works:

```bash
./bin/drasi-sse-cli --version
```

You should see output showing the version number, for example:

```text
drasi-sse-cli 0.1.0
```

## ✅ Setup Complete

You now have Drasi Server accessible at `./bin/drasi-server` from the repository root.

<p><a href="../#setup" class="btn btn-success btn-lg">Continue with the Tutorial <i class="fas fa-arrow-right ms-2"></i></a></p>

## Troubleshooting

### Installing Git

The tutorial uses `git` to clone the Drasi Server repository. If you don't have Git installed, you can install it from the <a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">Git download page</a>.

To verify Git is installed, run:

```bash
git --version
```

You should see output like `git version 2.x.x`. If you see "command not found", install Git from the link above.

### Installing Docker and Docker Compose

The tutorial uses Docker and Docker Compose to run a PostgreSQL database that is used as a Source in the tutorial. 

If you are not sure you have Docker installed or that it is running, you can verify by running:

```bash
docker ps
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

If you see an error like `Cannot connect to the Docker daemon`, Docker isn't running. Start Docker Desktop (Mac/Windows) or the Docker service (`sudo systemctl start docker` on Linux) and wait for it to fully initialize, then try again. If problems persist, see the [Docker troubleshooting guide](https://docs.docker.com/config/daemon/troubleshoot/) for additional help.

### Installing Rust

Drasi Server is written in Rust, so you need Rust 1.88 or later to build it. If you don't have Rust installed, you can install it via <a href="https://rustup.rs/" target="_blank" rel="noopener noreferrer">rustup</a>.

To verify Rust is installed, run:

```bash
rustc --version   # Should be 1.88.0 or later
cargo --version
```

If the Rust compiler and Cargo package manager are installed, you should see output like:

```text
rustc 1.88.0 (6b00bc388 2025-06-23)
cargo 1.88.0 (873a06493 2025-05-10)
```

### Installing curl

The tutorial uses `curl` to interact with Drasi Server during the tutorial. If you don't have `curl` installed you can install it using the instructions on the <a href="https://curl.se/download.html" target="_blank" rel="noopener noreferrer">curl download page</a>.