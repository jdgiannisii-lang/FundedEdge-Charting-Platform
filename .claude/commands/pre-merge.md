---
description: Full pre-merge gate for a PR — conflicts + checks + reviews (+ optional local tests) → GO/NO-GO
allowed-tools: Bash(pnpm agenticos:*)
argument-hint: "<pr-number> [--tests]"
---
Run the pre-merge gate and present the GO/NO-GO verdict verbatim.

!`pnpm agenticos pre-merge $ARGUMENTS`
