# Git Branch and Parallel Workflow

## Branch layout

- `main`: stable demo/release branch.
- `integration`: feature assembly and end-to-end testing.
- `feature/foundation`: project lead, initial app shell, shared types, JSON-backed service, mock-data indicator.
- `feature/citywide`: project lead, Citywide and issue details after the foundation has merged to `integration`.
- `feature/near-me`: Near Me owner.
- `feature/archive`: Archive/meeting detail owner.
- `fix/<short-description>`: targeted fixes.

If an established branch layout already exists, keep it unless the project lead agrees to change it.

## Order of work

1. If `integration` does not exist yet, create it from the current stable branch without adding feature changes directly to `main`. The project lead creates `feature/foundation` from `integration` and merges the foundation back into `integration`: routes/app shell, shared types, local JSON fixture loading, service interface, shared mock-data label.
2. The lead creates `feature/citywide`; Eshan and Shalin create `feature/near-me` and `feature/archive` from the latest `integration`.
3. Each owner commits and pushes small, scoped changes and opens a PR to `integration`.
4. The lead reviews changes, runs the available checks, and merges one feature at a time.
5. Team fixes integration issues in `integration` or short-lived fix branches.
6. After P0 acceptance criteria and the demo smoke test pass, the lead merges `integration` to `main`.

## Worktrees

Use one worktree per concurrent line of work if more than one happens on the same machine/repository. Each worktree must have its own branch. Never have two lines of work modify one physical working directory simultaneously. Teammates working in separate clones do not need worktrees, but still need feature branches and regular pulls from `integration`.

## Pull request checklist

- Scope matches one task/owner.
- No unrelated formatting or mass rewrites.
- Shared contract/service changed only with approval and synchronized fixtures.
- Mock/curated provenance preserved.
- Null URLs and locations handled.
- Actual build/lint/test checks reported truthfully.
- Manual smoke test run on affected page.
- Changed files and known limitations summarized.
- No secrets or personal address data committed.

Do not batch all finished branches into `main` simultaneously. Merge and test incrementally on `integration`; it is much cheaper to fix one integration break at a time.
