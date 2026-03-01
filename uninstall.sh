#!/usr/bin/env bash
set -euo pipefail

# geo-lint Claude Code Skill Uninstaller
# Usage: curl -fsSL https://raw.githubusercontent.com/IJONIS/geo-lint/main/uninstall.sh | bash

SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"

ok()   { printf "\033[32m  %s\033[0m\n" "$1"; }
warn() { printf "\033[33m  %s\033[0m\n" "$1"; }

main() {
  echo ""
  echo "  geo-lint -- Claude Code Skill Uninstaller"
  echo "  =========================================="
  echo ""

  REMOVED=false

  if [ -d "$SKILLS_DIR/geo-lint" ]; then
    rm -rf "$SKILLS_DIR/geo-lint"
    ok "Removed skill: $SKILLS_DIR/geo-lint"
    REMOVED=true
  fi

  if [ -d "$SKILLS_DIR/content-creator" ]; then
    rm -rf "$SKILLS_DIR/content-creator"
    ok "Removed skill: $SKILLS_DIR/content-creator"
    REMOVED=true
  fi

  if [ -f "$AGENTS_DIR/geo-lint-fixer.md" ]; then
    rm -f "$AGENTS_DIR/geo-lint-fixer.md"
    ok "Removed agent: $AGENTS_DIR/geo-lint-fixer.md"
    REMOVED=true
  fi

  if [ "$REMOVED" = false ]; then
    warn "No geo-lint installation found"
  fi

  echo ""
  ok "geo-lint skills removed. Restart Claude Code to apply."
  echo ""
  echo "  Note: Project-level content configs (.claude/skills/content-config/)"
  echo "  are not removed. Delete those manually if no longer needed."
  echo ""
}

main "$@"
