---
description: Run the project's real tests (unit/e2e or a specific suite) and summarize pass/fail
allowed-tools: Bash(pnpm agenticos:*)
argument-hint: "[unit|e2e|rules-engine|db|utils|web]"
---
Run the requested test suite (default: unit) and present the result verbatim.

!`pnpm agenticos run-tests $ARGUMENTS`
