Download the appropriate binary for your platform, replacing `VERSION` with the desired version (e.g., `0.1.7`):

{{< tabpane persist="header" >}}
{{< tab header="macOS (Apple Silicon)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-aarch64-apple-darwin -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="macOS (Intel)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-x86_64-apple-darwin -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux (x64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-x86_64-unknown-linux-gnu -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux (ARM64)" lang="bash" >}}
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-aarch64-unknown-linux-gnu -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux musl (x64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-x86_64-unknown-linux-musl -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Linux musl (ARM64)" lang="bash" >}}
apk add --no-cache libstdc++ libgcc
mkdir -p bin
curl -fsSL https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-aarch64-unknown-linux-musl -o bin/drasi-server
chmod +x bin/drasi-server
{{< /tab >}}
{{< tab header="Windows (x64)" lang="powershell" >}}
New-Item -ItemType Directory -Force -Path bin
Invoke-WebRequest -Uri "https://github.com/ruokun-niu/drasi-server/releases/latest/download/drasi-server-VERSION-x86_64-pc-windows-msvc.exe" -OutFile "bin\drasi-server.exe"
{{< /tab >}}
{{< /tabpane >}}

### Verify the Download

Verify the binary works:

```bash
./bin/drasi-server --version
```

You should see output showing the version number, for example:

```text
drasi-server 0.1.0
```
