#!/usr/bin/env bash
# PreToolUse(Read) hook: block reading the project's .env secrets.
# Denies .env and any .env.* (e.g. .env.local); allows .env.example and
# everything else. Reads the hook payload (JSON) from stdin.

f=$(jq -r '.tool_input.file_path // empty')

case "$(basename "$f")" in
  .env.example)
    : # allowed — it's the documented template, no secrets
    ;;
  .env | .env.*)
    printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":".env secrets are blocked from being read (project policy). Use yarn check or .env.example instead."}}'
    ;;
esac
