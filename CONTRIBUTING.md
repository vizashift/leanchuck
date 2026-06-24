# Contributing to @leanchuck/core

Thanks for your interest in contributing! This project is open to outside
contributions via **fork and pull request**. Direct pushes to this repository
are restricted — everyone (including maintainers) lands changes through PRs.

## Workflow

1. **Fork** the repository to your own account and clone your fork.
2. **Create a branch** for your change:
   ```bash
   git checkout -b feat/short-description
   ```
3. **Install and build**:
   ```bash
   npm install
   npm run build
   ```
4. **Make your change.** Keep it focused — one logical change per PR.
5. **Validate locally** before opening a PR:
   ```bash
   npm run typecheck
   npm test
   npm run format:check
   ```
6. **Open a pull request** against the default branch of this repo from your
   fork's branch. Fill out the PR template so reviewers have context.

## Standards

- **Tests**: add or update tests for any behavior change (`vitest`).
- **Types**: the public API is fully typed; `npm run typecheck` must pass.
- **Formatting**: run `npm run format` (Prettier) before committing.
- **Commits**: write clear, present-tense messages (e.g. `add buffer option to pareto`).

## Reporting bugs / requesting features

Open an issue: https://github.com/vizashift/leanchuck/issues

## License

By contributing, you agree that your contributions will be licensed under the
MIT License that covers this project.
