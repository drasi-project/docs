Building `drasi-server` requires several native C libraries. Install the dependencies for your platform:


#### macOS

Install Xcode Command Line Tools to get `clang` and `perl`.

Then install the remaining dependencies with Homebrew:

```bash
brew install protobuf
brew install jq
```

#### Debian / Ubuntu

`perl` is pre-installed. Install everything else with:

```bash
sudo apt-get install -y libssl-dev pkg-config clang libclang-dev libjq-dev libonig-dev protobuf-compiler 
```

#### Windows

Building natively on Windows requires the Visual Studio 2022 Build Tools (for the MSVC toolchain):

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e `
    --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Then install the pinned Rust MSVC toolchain:

```powershell
rustup toolchain install 1.88.0-x86_64-pc-windows-msvc
```