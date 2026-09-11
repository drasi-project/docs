#!/usr/bin/env bash
#
# Verify that every Git LFS tracked asset (for example the homepage explainer
# video in docs/assets/video) has been materialized in the working tree.
#
# When a repository is cloned without Git LFS, tracked files are left on disk as
# small text pointer files. Hugo happily copies those pointers into the
# generated site, which produces a page that references an unplayable "video".
# Running this check before Hugo makes that failure loud instead of silent.
#
# Usage: scripts/verify-lfs-assets.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v git >/dev/null 2>&1; then
  echo "verify-lfs-assets: git is not installed." >&2
  exit 1
fi

if ! git lfs version >/dev/null 2>&1; then
  echo "verify-lfs-assets: Git LFS is not installed." >&2
  echo "Install it from https://git-lfs.com and run 'git lfs install && git lfs pull'." >&2
  exit 1
fi

# 'git lfs ls-files' marks each entry with '*' when the real object is checked
# out and '-' when only the pointer file is present.
pointers="$(git lfs ls-files | awk '$2 == "-" { sub(/^[^ ]+ [^ ]+ /, ""); print }')"

if [ -n "$pointers" ]; then
  echo "verify-lfs-assets: the following Git LFS assets are still pointer files:" >&2
  echo "$pointers" | sed 's/^/  - /' >&2
  echo >&2
  echo "Fetch the real content before building the site:" >&2
  echo "  git lfs install" >&2
  echo "  git lfs pull" >&2
  exit 1
fi

echo "verify-lfs-assets: all Git LFS assets are checked out."
