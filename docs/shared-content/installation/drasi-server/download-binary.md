Download the appropriate binary for your platform:

{{< tabpane persist="header" >}}
{{< tab header="macOS (Apple Silicon)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-aarch64-apple-darwin -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="macOS (Intel)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-x86_64-apple-darwin -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux (x64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-x86_64-linux-gnu -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux (ARM64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-aarch64-linux-gnu -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux musl (x64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-x86_64-linux-musl -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux musl (ARM64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-aarch64-linux-musl -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Windows (x64)" lang="powershell" >}}
New-Item -ItemType Directory -Force -Path bin
Invoke-WebRequest -Uri "https://github.com/drasi-project/drasi-server/releases/latest/download/drasi-server-x86_64-windows.exe" -OutFile "bin\drasi-server.exe"
{{< /tab >}}
{{< /tabpane >}}

### Verify the Download

Verify the binary works:

```bash
./bin/drasi-server --version
```

You should see output showing the version number. The exact version depends on which release of Drasi Server you have installed, so the number below is only an example. The latest release is always available from the [Drasi Server releases page](https://github.com/drasi-project/drasi-server/releases).

```text
drasi-server 0.2.1
rustc: rustc 1.88.0 (6b00bc388 2025-06-23)
plugin-sdk: 0.9.1
```
