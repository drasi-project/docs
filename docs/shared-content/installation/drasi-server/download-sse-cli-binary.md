Download the appropriate binary for your platform:

{{< tabpane persist="header" >}}
{{< tab header="macOS (Apple Silicon)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-aarch64-apple-darwin -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="macOS (Intel)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-x86_64-apple-darwin -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="Linux (x64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-x86_64-linux-gnu -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="Linux (ARM64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-aarch64-linux-gnu -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="Linux musl (x64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-x86_64-linux-musl -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="Linux musl (ARM64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-aarch64-linux-musl -o bin/drasi-sse-cli
chmod +x bin/drasi-sse-cli
{{< /tab >}}
{{< tab header="Windows (x64)" lang="powershell" >}}
New-Item -ItemType Directory -Force -Path bin
Invoke-WebRequest -Uri "https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-sse-cli-x86_64-windows.exe" -OutFile "bin\drasi-server.exe"
{{< /tab >}}
{{< /tabpane >}}

### Verify the Download

Verify the binary works:

```bash
./bin/drasi-sse-cli --version
```

You should see output showing the version number, for example:

```text
drasi-sse-cli 0.1.0
```
