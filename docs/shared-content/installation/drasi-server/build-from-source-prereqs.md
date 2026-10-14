Building `drasi-server` requires several native C libraries. Install the dependencies for your platform:


#### macOS

Install Xcode Command Line Tools to get `clang` and `perl`.

Then install the remaining dependencies with Homebrew:

```bash {#macos-native-deps}
brew install protobuf jq oniguruma
```

The build links against Homebrew's `libjq` and `libonig`, but these are not on the compiler's default search path (on Apple Silicon, Homebrew installs under `/opt/homebrew`), so the build fails with `Unable to find libjq` or `ld: library 'onig' not found` unless you point the toolchain at them. Set the following in the same terminal you build from (add them to your shell profile to make them permanent):

```bash {#macos-jq-lib-dir}
export JQ_LIB_DIR="$(brew --prefix jq)/lib"
export LIBRARY_PATH="$(brew --prefix jq)/lib:$(brew --prefix oniguruma)/lib:${LIBRARY_PATH:-}"
```

#### Debian / Ubuntu

`perl` is pre-installed. Install everything else with:

```bash {#linux-native-deps}
sudo apt-get install -y libssl-dev pkg-config clang libclang-dev libjq-dev libonig-dev protobuf-compiler 
```

The `libjq-dev` package does not ship a pkg-config file, so the `jq-sys` crate cannot locate `libjq` automatically and the build fails with `Unable to find libjq` unless you tell it where the library is. Set `JQ_LIB_DIR` to your architecture's multiarch library directory in the same terminal you build from (add it to your shell profile to make it permanent):

```bash {#linux-jq-lib-dir}
export JQ_LIB_DIR="/usr/lib/$(uname -m)-linux-gnu"
```

#### Windows

Building natively on Windows requires the Visual Studio 2022 Build Tools (for the MSVC toolchain):

```powershell {#windows-native-deps}
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget `
    --accept-source-agreements --accept-package-agreements --disable-interactivity `
    --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Then install the pinned Rust MSVC toolchain:

```powershell
rustup toolchain install 1.95.0-x86_64-pc-windows-msvc
```