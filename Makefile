# Makefile for the Drasi documentation site.
#
# The Drasi Server tutorials are authored in the
# github.com/drasi-project/learning-drasi-server repository and consumed here as
# a Hugo module (NOT a git submodule). These targets simplify pulling the latest
# tutorial content and previewing local changes before a new module tag exists.

# Directory that holds config.toml / go.mod (where Hugo runs).
HUGO_DIR := docs

# The Hugo module that provides the tutorial content.
TUTORIALS_MODULE := github.com/drasi-project/learning-drasi-server

# Version to pin when running `make update-tutorials`. Defaults to the latest
# published tag; override for a specific release, e.g.
#   make update-tutorials VERSION=v0.1.1
VERSION ?= latest

# Local checkout of the tutorials repo, used by `make preview-tutorials` to
# render uncommitted/untagged tutorial changes via a Hugo module replacement.
TUTORIALS_LOCAL ?= ../learning-drasi-server

.PHONY: help update-tutorials tidy serve preview-tutorials preview-docs build

help: ## Show this help.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

update-tutorials: ## Pin the tutorials module to VERSION (default: latest tag) and tidy go.mod/go.sum.
	cd $(HUGO_DIR) && hugo mod get $(TUTORIALS_MODULE)@$(VERSION)
	cd $(HUGO_DIR) && hugo mod tidy
	@echo "Updated $(TUTORIALS_MODULE) to $(VERSION). Review and commit docs/go.mod and docs/go.sum."

tidy: ## Tidy Hugo module requirements (go.mod / go.sum).
	cd $(HUGO_DIR) && hugo mod tidy

serve: ## Run the local Hugo server against the pinned module version.
	cd $(HUGO_DIR) && hugo server --disableFastRender

preview-tutorials: ## Run the local Hugo server using a local checkout of the tutorials repo (TUTORIALS_LOCAL).
	cd $(HUGO_DIR) && HUGO_MODULE_REPLACEMENTS="$(TUTORIALS_MODULE) -> $(abspath $(TUTORIALS_LOCAL))" hugo server --disableFastRender

preview-docs: preview-tutorials ## Alias of preview-tutorials.

build: ## Build the static site into docs/public.
	cd $(HUGO_DIR) && hugo
