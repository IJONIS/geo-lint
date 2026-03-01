#!/usr/bin/env bash
set -euo pipefail

# geo-lint Claude Code Skill Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/IJONIS/geo-lint/main/install.sh | bash

REPO_URL="https://github.com/IJONIS/geo-lint"
SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"

info()  { printf "\033[36m  %s\033[0m\n" "$1"; }
ok()    { printf "\033[32m  %s\033[0m\n" "$1"; }
warn()  { printf "\033[33m  %s\033[0m\n" "$1"; }
err()   { printf "\033[31m  %s\033[0m\n" "$1"; exit 1; }

main() {
  echo ""
  echo "  geo-lint -- Claude Code Skill Installer"
  echo "  ========================================"
  echo ""

  # ── Check Node.js ──────────────────────────────────────────────────
  if ! command -v node >/dev/null 2>&1; then
    err "Node.js is required but not found. Install Node.js >= 18 from https://nodejs.org"
  fi

  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    err "Node.js >= 18 required. Found: $(node -v)"
  fi
  ok "Node.js $(node -v) detected"

  # ── Check git ──────────────────────────────────────────────────────
  if ! command -v git >/dev/null 2>&1; then
    err "git is required but not found. Install git from https://git-scm.com"
  fi

  # ── Clean previous installation ────────────────────────────────────
  if [ -d "$SKILLS_DIR/geo-lint" ]; then
    warn "Previous geo-lint skill found -- removing"
    rm -rf "$SKILLS_DIR/geo-lint"
  fi
  if [ -d "$SKILLS_DIR/content-creator" ]; then
    warn "Previous content-creator skill found -- removing"
    rm -rf "$SKILLS_DIR/content-creator"
  fi
  if [ -f "$AGENTS_DIR/geo-lint-fixer.md" ]; then
    rm -f "$AGENTS_DIR/geo-lint-fixer.md"
  fi

  # ── Clone repo to temp dir ────────────────────────────────────────
  TEMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TEMP_DIR"' EXIT

  info "Downloading geo-lint skill files..."
  git clone --depth=1 --quiet "$REPO_URL.git" "$TEMP_DIR/geo-lint" 2>/dev/null \
    || err "Failed to download geo-lint. Check your internet connection."

  # ── Install skills ─────────────────────────────────────────────────
  mkdir -p "$SKILLS_DIR"

  [ -d "$TEMP_DIR/geo-lint/skills/geo-lint" ] \
    || err "geo-lint skill not found in download."
  cp -r "$TEMP_DIR/geo-lint/skills/geo-lint" "$SKILLS_DIR/"
  ok "Skill installed: /geo-lint"

  [ -d "$TEMP_DIR/geo-lint/skills/content-creator" ] \
    || err "content-creator skill not found in download."
  cp -r "$TEMP_DIR/geo-lint/skills/content-creator" "$SKILLS_DIR/"
  ok "Skill installed: /content-creator"

  # ── Install agent ──────────────────────────────────────────────────
  mkdir -p "$AGENTS_DIR"
  cp "$TEMP_DIR/geo-lint/agents/geo-lint-fixer.md" "$AGENTS_DIR/"
  ok "Agent installed: geo-lint-fixer"

  # ── Done ───────────────────────────────────────────────────────────
  echo ""
  ok "geo-lint skills installed successfully!"
  echo ""
  echo "  Restart Claude Code, then use:"
  echo ""
  echo "  Validation:"
  echo "    /geo-lint audit          Full sweep -- find and fix all violations"
  echo "    /geo-lint fix <slug>     Fix a single content file"
  echo "    /geo-lint rules          Show all 92 rules"
  echo "    /geo-lint init           Set up geo-lint.config.ts"
  echo "    /geo-lint report         Generate health summary"
  echo ""
  echo "  Content Creation:"
  echo "    /content-creator setup   Auto-discover project + configure brand voice"
  echo "    /content-creator create  Create content with research + validation"
  echo "    /content-creator voice   Analyze and adjust brand voice"
  echo "    /content-creator calendar  Plan monthly content calendar"
  echo "    /content-creator refresh   Update config when your project evolves"
  echo ""
  echo "  Docs: https://github.com/IJONIS/geo-lint"
  echo ""
}

main "$@"
