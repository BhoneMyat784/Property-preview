# Claude project guidance

Read and follow [AGENTS.md](AGENTS.md) before changing this repository.

`AGENTS.md` is the authoritative source for stable technology choices, repository boundaries, server/client boundaries, and engineering rules. Keep those rules intact unless the user explicitly approves a change.

Use [SPEC.md](SPEC.md) for the current, changeable product feature specification and roadmap. Use [README.md](README.md) for user-facing setup and workflows. Keep project-specific user guidance in the README files under each logical subproject.

Do not rebuild the project or replace its stack to solve a feature request. Update the relevant feature specification first when behavior or scope changes, then make the smallest implementation change that satisfies the approved specification.
