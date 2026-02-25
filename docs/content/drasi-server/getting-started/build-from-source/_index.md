---
type: "docs"
title: "Setup: Build from Source"
linkTitle: "Build from Source"
weight: 40
description: "Build Drasi Server from source code"
---

Build Drasi Server from source. This approach is ideal for contributors or if you want to modify the code.

## Prerequisites

- **Git** — Needed to clone the Drasi Server code (<a href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">Install Git</a>)
- **Docker** and **Docker Compose** — Needed to run the PostgreSQL database used in the tutorial. The easiest way to get started depends on your platform:
  - **Mac/Windows**: Install <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">Docker Desktop</a> (includes Docker Compose)
  - **Linux**: Install <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener noreferrer">Docker Engine</a> and the <a href="https://docs.docker.com/compose/install/linux/" target="_blank" rel="noopener noreferrer">Docker Compose plugin</a>, or install <a href="https://docs.docker.com/desktop/setup/install/linux/" target="_blank" rel="noopener noreferrer">Docker Desktop</a> (includes Docker Compose)
  - Recommended resources: 4+ CPU cores, 8+ GB memory
- **Rust 1.88+** — For building Drasi Server <a href="https://rustup.rs/" target="_blank" rel="noopener noreferrer">(Install via rustup)</a>
- **Text Editor** — Needed to edit files during the tutorial (e.g. <a href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer">Visual Studio Code</a>)
- **curl** — Used in later tutorial steps <a href="https://curl.se/download.html" target="_blank" rel="noopener noreferrer">(Install curl)</a>
- **Native build dependencies** — Platform-specific C libraries required to compile Drasi Server (see [Install Native Build Dependencies](#install-native-build-dependencies) below)

#### Verify Git is Installed

```bash
git --version
```

You should see output like `git version 2.x.x`. If you see "command not found", install Git from the link above.

#### Verify Docker is Running

```bash
docker ps
```

If Docker is running, you'll see a table with these headings showing running containers (even if no containers are running):

```text
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

If you see an error like `Cannot connect to the Docker daemon`, Docker isn't running. Start Docker Desktop (Mac/Windows) or the Docker service (`sudo systemctl start docker` on Linux) and wait for it to fully initialize, then try again. If problems persist, see the [Docker troubleshooting guide](https://docs.docker.com/config/daemon/troubleshoot/) for additional help.

#### Verify Rust is Installed

```bash
rustc --version   # Should be 1.88.0 or later
cargo --version
```

If the Rust compiler and Cargo package manager are installed, you should see output like:

```text
rustc 1.88.0 (6b00bc388 2025-06-23)
cargo 1.88.0 (873a06493 2025-05-10)
```

#### Install Native Build Dependencies

{{< read file="/shared-content/installation/drasi-server/build-from-source-prereqs.md" >}}

With the prerequisites verified, you're ready to clone the repository and build Drasi Server from source.

## Step 1: Clone Drasi Server Repo

Clone the <a href="https://github.com/drasi-project/drasi-server" target="_blank" rel="noopener noreferrer">Drasi Server repository</a>. In a terminal, run:

```bash
git clone https://github.com/drasi-project/drasi-server.git
```

## Step 2: Build Drasi Server

Once the cloning is complete, change to the newly created `drasi-server` folder.

```bash
cd drasi-server
```

### Build Configuration: jq Middleware

The default `Cargo.toml` enables the `middleware-jq` feature on the `drasi-lib` dependency, which requires the **libjq** C library to be available at build time. If you don't have libjq installed, the build will fail with a jq-related error.

You have two options:

**Option A: Install libjq and set `JQ_LIB_DIR`**

{{< tabpane persist="header" >}}
{{< tab header="macOS" lang="bash" >}}
brew install jq
{{< /tab >}}
{{< tab header="Debian/Ubuntu" lang="bash" >}}
sudo apt-get update && sudo apt-get install -y \
  pkg-config \
  clang \
  libclang-dev \
  libjq-dev \
  libonig-dev
{{< /tab >}}
{{< tab header="Windows" lang="powershell" >}}
# Install libjq via MSYS2
$env:PATH = "C:\msys64\ucrt64\bin;C:\msys64\usr\bin;" + $env:PATH

pacman -S --noconfirm `
    mingw-w64-ucrt-x86_64-jq `
    mingw-w64-ucrt-x86_64-oniguruma

# Set the library path — tell jq-sys where to find libjq
$env:JQ_LIB_DIR = "C:\msys64\ucrt64\lib"
{{< /tab >}}
{{< /tabpane >}}

**Option B: Disable the jq middleware**

If you don't need the jq middleware, remove `"middleware-jq"` from the `drasi-lib` features list in `Cargo.toml`:

```toml
drasi-lib = { version = "0.3.8", features = [
  # "middleware-jq",    # Remove or comment out this line
  "middleware-decoder",
  "middleware-map",
  "middleware-parse-json",
  "middleware-promote",
  "middleware-relabel",
  "middleware-unwind",
] }
```

### Run the Build

Once the jq configuration is resolved, build and install:

```bash
cargo install --path . --root . --locked
```

The `cargo install` command takes several minutes to complete the first time you run it because it needs to download and compile all dependencies. Subsequent runs will be much faster since Cargo caches the compiled dependencies.

The `--root .` flag tells Cargo to install the Drasi Server binary to `./bin/drasi-server` in the current directory, which is where the rest of the tutorial assumes it will be.

## Step 3: Verify the Build

Verify the binary works:

```bash
./bin/drasi-server --version
```

You should see output showing the version number, for example:

```text
drasi-server 0.1.0
```

---

## Step 4: Set Environment Variables

The tutorial uses environment variables for various port numbers so the same commands work across all setup environments. Run the following to set the required environment variables:

{{< tabpane persist="header" >}}
{{< tab header="bash / zsh" lang="bash" >}}
export SERVER_PORT=8080
export SSE_PORT=8081
export POSTGRES_HOST_PORT=5432
{{< /tab >}}
{{< tab header="PowerShell" lang="powershell" >}}
$env:SERVER_PORT = 8080
$env:SSE_PORT = 8081
$env:POSTGRES_HOST_PORT = 5432
{{< /tab >}}
{{< /tabpane >}}

## Step 5: Create Docker network

Create a Docker network so that Drasi Server and the tutorial database container can communicate with each other:

```bash
docker network create drasi-network
```
---

## ✅ Environment Setup Complete

You now have Drasi Server accessible at `./bin/drasi-server` from the repository root.

<p><a href="../#database" class="btn btn-success btn-lg">Continue with the Tutorial <i class="fas fa-arrow-right ms-2"></i></a></p
