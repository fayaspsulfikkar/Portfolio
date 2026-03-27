# Contributing Guide

Thanks for your interest in contributing.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

## Branch Naming

Use clear branch names:

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`

## Commit Messages

Use concise commit messages in imperative tone:

- `feat: add mobile nav indicator`
- `fix: correct self-log external link`
- `docs: update setup section`

## Pull Requests

Before opening a PR, make sure:

- The app builds successfully with `npm run build`
- Your change is focused and scoped
- You updated docs if behavior changed

Use the PR template and include:

- What changed
- Why it changed
- Screenshots for UI changes

## Code Style

- Keep changes minimal and targeted
- Preserve existing style and structure
- Avoid unrelated refactors in feature/fix PRs
