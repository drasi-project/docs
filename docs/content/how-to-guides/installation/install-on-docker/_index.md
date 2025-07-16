---
type: "docs"
title: "Install on Docker"
linkTitle: "Install on Docker"
weight: 40
description: >
    Learn how to install Drasi to a Docker container for local development and testing
---

Installing Drasi into a Docker container is the fastest way to get started.  It will also allow you to connect to databases running on your local machine, by using the `host.docker.internal` host name.

## Prerequisites

On the computer where you will install Drasi, you need to install [Docker](https://www.docker.com/products/docker-desktop/)


## Get the Drasi CLI
You will install Drasi using the [Drasi CLI](/reference/command-line-interface/). 

You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="macOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="powershell" >}}
iwr -useb "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.ps1" | iex
{{< /tab >}}
{{< tab header="Linux" lang="shell" >}}
wget -q "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh" -O - | /bin/bash
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download a specific version of the CLI from the [drasi-platform releases](https://github.com/drasi-project/drasi-platform/releases) page on GitHub. The file to download for your platform is:
- **macOS arm64** - drasi-darwin-arm64
- **macOS x64** - drasi-darwin-x64
- **Windows x64** - drasi-windows-x64.exe
- **Linux x64** - drasi-linux-x64
- **Linux arm64** - drasi-linux-arm64

Once downloaded, rename the file to `drasi` (macOS and Linux) or `drasi.exe` (Windows) and add it to your path.
{{% /tab %}}
{{% tab header="Build from Source" text=true %}}
The Drasi CLI source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.
{{% /tab %}}
{{< /tabpane >}}

## Install Drasi as a Docker container
To install Drasi as a Docker container using all default settings, simply run the command:

```text
drasi init --docker
```

This will install the version of Drasi that matches the version of the Drasi CLI that you are using. The Drasi container images will be pulled from the main Drasi container registry located on **ghcr.io**.

The `drasi init` command gives you control over certain aspects of the install process and the configuration of the Drasi environment through these flags and argument:

- `--dapr-runtime-version <version>`: Specifies the Dapr runtime version to install.
- `--dapr-sidecar-version <version>`: Specifies the Dapr sidecar (daprd) version to install.
- `--docker <name (optional)>` (optional): If set, a Docker container will be created and a self-contained instance of drasi will be installed into it. You do not need a Kubernetes cluster or the kubectl tooling if using this option. You can optionally provide a name for the instance, the default will be `docker`.
- `--local`: If set, the Drasi CLI will use locally available images to install Drasi instead of pulling them from a remote container registry. If used in conjunction with the `--docker` flag, it will also scan your local Docker cache for all images with the `drasi-project/` prefix and automatically load them into the self contained Drasi instance.
- `--registry <registry>`: Address of the container registry to pull Drasi images from. The default value is "ghcr.io".
- `--version <tag>`: Container image version tag to use when pulling Drasi images. The default value is the version tag of the Drasi CLI, which is available through the [drasi version](/reference/command-line-interface#drasi-version) command.

For example, to install Drasi **0.2.0**, you would run the following command:

```text
drasi init --version 0.2.0 --docker
```

The following shows the output you would expect from a successful installation of Drasi 0.1.3:

```
Installing Drasi with version 0.2.0 from registry ghcr.io
✓ Container 37951820a0d4a810cc3abd6ad9ef4ede4e075ad18f5708814da9cfe0cc23fb36 created
✓ Container 37951820a0d4a810cc3abd6ad9ef4ede4e075ad18f5708814da9cfe0cc23fb36 started
ℹ Dapr not installed
✓ Dapr installed successfully
✓ Infrastructure deployed
  ✓ app=rg-redis is online
  ✓ app=rg-mongo is online
✓ Control plane is online
  ✓ drasi/infra=api is online
  ✓ drasi/infra=resource-provider is online
✓ Query container created
  ✓ Apply: QueryContainer/default: complete
  ✓ Wait QueryContainer/default online
✓ Default source providers created
  ✓ Apply: SourceProvider/PostgreSQL: complete
  ✓ Apply: SourceProvider/SQLServer: complete
  ✓ Apply: SourceProvider/CosmosGremlin: complete
✓ Default reaction providers created
  ✓ Apply: ReactionProvider/Debug: complete
  ✓ Apply: ReactionProvider/Debezium: complete
  ✓ Apply: ReactionProvider/EventGrid: complete
  ✓ Apply: ReactionProvider/Gremlin: complete
  ✓ Apply: ReactionProvider/Result: complete
  ✓ Apply: ReactionProvider/SignalR: complete
  ✓ Apply: ReactionProvider/StorageQueue: complete
  ✓ Apply: ReactionProvider/StoredProc: complete
```

If `drasi init` completes without error, the Drasi environment is ready for use and you can start to create [Sources](/how-to-guides/configure-sources/), [Continuous Queries](/how-to-guides/write-continuous-queries/), and [Reactions](/how-to-guides/configure-reactions/).


## Deleting the Drasi container
To delete a Drasi environment that is installed in a Docker container, run the command:

```
drasi env delete docker
```

This command will remove the `docker` Drasi environment from the collection in your local user profile and prompt you to delete the container as well.

```
This will delete the Docker container, are you sure you want to continue? (y/N): y
Deleting Docker container docker...
Environment docker deleted
```
