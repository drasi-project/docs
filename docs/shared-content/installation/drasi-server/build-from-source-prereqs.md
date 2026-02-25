Building `drasi-server` requires several native C libraries. Install the dependencies for your platform:


### macOS

Xcode Command Line Tools provide `clang` and `perl`. Install the remaining dependencies with Homebrew:

```bash
brew install protobuf
```

### Debian / Ubuntu

`perl` is pre-installed. Install everything else with:

```bash
sudo apt-get install -y libssl-dev pkg-config clang libclang-dev libjq-dev libonig-dev protobuf-compiler 
```

### Windows

Building natively on Windows requires MSYS2, LLVM, Strawberry Perl, and protoc.

### 1. Install MSYS2

MSYS2 provides Unix-like build tools and C libraries needed for native dependencies (OpenSSL, RocksDB, etc.).

```powershell
winget install MSYS2.MSYS2
```

Then install the required packages:

```powershell
pacman -S --noconfirm `
    make `
    perl `
    mingw-w64-ucrt-x86_64-gcc `
    mingw-w64-ucrt-x86_64-pkg-config `
    mingw-w64-ucrt-x86_64-clang
```

### 2. Install LLVM

```powershell
winget install LLVM.LLVM
```

### 3. Install Strawberry Perl

> **Note:** MSYS2's `perl` must appear **before** Strawberry Perl on PATH.
> OpenSSL's build requires Unix-like paths that only MSYS2's perl provides.

```powershell
winget install StrawberryPerl.StrawberryPerl
```

### 4. Install Protocol Buffers Compiler

```powershell
winget install Google.Protobuf
```

If `protoc` is not on your PATH after installation:

```powershell
$env:PROTOC = "C:\path\to\protoc.exe"
```

### 5. Switch to the GNU Toolchain

This project's `rust-toolchain.toml` pins Rust 1.88.0 and defaults to the MSVC target.
Since we link against MSYS2 libraries, we need the GNU toolchain. Setting `$env:RUSTUP_TOOLCHAIN`
overrides `rust-toolchain.toml` (note: `rustup default` alone is **not** sufficient).

```powershell
rustup toolchain install 1.88.0-x86_64-pc-windows-gnu
$env:RUSTUP_TOOLCHAIN = "1.88.0-x86_64-pc-windows-gnu"
```

### 6. Set PATH

MSYS2 paths must come **before** Strawberry Perl so that OpenSSL uses MSYS2's Unix-like `perl`:

```powershell
$env:PATH = "C:\msys64\ucrt64\bin;C:\msys64\usr\bin;C:\Strawberry\perl\bin;" + $env:PATH
```

### 7. Set Tool Paths

```powershell
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
```