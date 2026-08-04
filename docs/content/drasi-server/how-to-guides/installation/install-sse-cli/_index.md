---
type: "docs"
title: "Install the SSE CLI"
linkTitle: "SSE CLI"
weight: 50
description: "Install the drasi-sse-cli companion tool"
related:
  howto:
    - title: "Download Binary"
      url: "/drasi-server/how-to-guides/installation/download-binary/"
    - title: "Build from Source"
      url: "/drasi-server/how-to-guides/installation/build-from-source/"
  tutorials:
    - title: "Getting Started"
      url: "/drasi-server/tutorials/getting-started/"
---

The `drasi-sse-cli` is a companion command-line tool for {{< term "Drasi Server" >}} that connects to a Server-Sent Events (SSE) endpoint and prints the events it receives. It is useful for observing the output of an SSE Reaction — for example, while working through the [Getting Started tutorial](/drasi-server/tutorials/getting-started/).

You can either download a pre-built binary or build it from source.

## Option 1: Download a Pre-built Binary

{{< read file="/shared-content/installation/drasi-server/download-sse-cli-binary.md" >}}

## Option 2: Build from Source

The `drasi-sse-cli` lives in the `examples/sse-cli` folder of the Drasi Server repository. Building it requires the same [prerequisites](/drasi-server/how-to-guides/installation/build-from-source/#prerequisites) as building Drasi Server itself.

Clone the repository (if you haven't already):

```bash
git clone https://github.com/drasi-project/drasi-server.git
cd drasi-server
```

Build and install the SSE CLI into a local `./bin` directory:

```bash {#build-sse-cli}
cargo install --path examples/sse-cli --root . --locked
```

The `--root .` flag tells Cargo to place the compiled `drasi-sse-cli` binary in the `./bin` directory.

### Verify the Build

```bash {#verify-sse-cli}
./bin/drasi-sse-cli --version
```

You should see output showing the version number, for example:

```text
drasi-sse-cli 0.1.0
```
