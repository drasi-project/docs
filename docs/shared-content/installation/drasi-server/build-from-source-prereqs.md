Building `drasi-server` requires the Rust toolchain and several native C libraries.


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

Building natively on Windows requires LLVM, Strawberry Perl, protoc, and optionally MSYS2 for jq.

#### 1. LLVM (clang / libclang)
```powershell
winget install LLVM.LLVM
```

Set the environment variable (if not automatically added to PATH):

```powershell
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
```

#### 2. Perl (Strawberry Perl)
```powershell
winget install StrawberryPerl.StrawberryPerl
```

#### 3. Protocol Buffers Compiler (protoc)
```powershell
winget install Google.Protobuf
```

If `protoc` is not on your PATH after installation, set the environment variable:

```powershell
$env:PROTOC = "C:\path\to\protoc.exe"
```
