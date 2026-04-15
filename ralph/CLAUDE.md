# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. You are invoked in a loop by an external script — **each invocation handles exactly ONE user story**. Do not implement more than one story per response, even if others remain incomplete.

## Your Task

1. Read the PRD at `tracks/prd.json` (relative to the same directory as this file)
2. Read the progress log at `tracks/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from development.
4. Pick the **single highest priority** user story where `passes: false` — implement only this one
5. Implement that user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. If checks pass, stage ALL changes using the git add command.
8. Update the PRD to set `passes: true` for the completed story
9. Append your progress to `tracks/progress.txt`
10. Check whether all stories now have `passes: true` (see Stop Condition below) — then stop

## Progress Report Format

APPEND to tracks/progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of tracks/progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

## Quality Requirements

- ALL changes must pass your project's quality checks (typecheck, lint, test)
- Do NOT stage broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Stop Condition

After completing step 11, re-read the PRD and check story statuses:

- **If ALL stories have `passes: true`** → reply with `<promise>COMPLETE</promise>` and stop.
- **If any stories still have `passes: false`** → stop here. Do NOT implement the next story. The external loop will invoke you again in a fresh context.

Either way, your response ends after this check. Never proceed to a second story in the same response.

## Important

- One story per invocation — the external loop handles iteration
- Keep CI green
- Read the Codebase Patterns section in tracks/progress.txt before starting
