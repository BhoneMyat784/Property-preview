---
name: github-publish
description: Publish this property workspace to GitHub as public independent root, api, app, and mobile repositories, with the root tracking the sibling projects as Git submodules. Use for initial publishing and later coordinated pushes or submodule updates.
---

# GitHub publishing

## Repository contract

Resolve the workspace root from this skill's project location, not from a fixed machine path. Read the root `AGENTS.md` and each affected project's `AGENTS.md` before making changes.

- The root is its own public GitHub repository and keeps its combined preview and documentation.
- `api/`, `app/`, and `mobile/` are sibling projects inside the root directory. Each keeps its own Git history, independent public GitHub repository, and project instructions.
- The root records each project as a submodule: a `.gitmodules` entry plus a Git index entry with mode `160000` pinned to a published child commit. A directory link or README link alone is insufficient.
- Preserve the existing application stack and directory layout. Do not flatten child code into the root, replace child histories, or remove the root's preview implementation as part of publishing.

Creating or editing this skill does not publish anything. When invoked for publishing, apply the user's current authorization to the concrete repositories; automatic discovery alone is not permission to push or change visibility. An explicit request to publish all these repositories publicly covers their creation, public visibility, ordinary publishing commits, and pushes without repeated confirmation. Respect narrower requests such as preparation or inspection only.

## Discover the targets

Inspect the root and each child with `git -C` so operations run in the correct repository. Check repository top level, branch, HEAD, status, staged changes, remotes, existing submodule entries, and root ignore rules. Verify that each child is actually its own repository; Git commands inside a non-repository directory can otherwise resolve to the parent.

Use the GitHub CLI when available. Check authentication without printing credentials. Derive the GitHub owner and repository names from existing remotes or explicit user instructions. If missing or conflicting, prepare the local work and ask for the unresolved owner/name mapping before creating remote repositories; an authenticated personal account does not establish the intended organization. Confirm an existing remote's identity before reusing it.

The initial workspace may ignore `api/`, `app/`, and `mobile/` and have no remotes. Reinspect on every run instead of assuming that initial state persists. Preserve unrelated staged and uncommitted work; stage specific publishing files and only include product changes the user authorized for publication.

Before first public publication or making a private repository public, inspect the files and history that will become public for credentials and local runtime data such as `.env`, SQLite databases, uploads, and mail inbox contents. Keep intentional example configurations and seed assets. If actual sensitive material is found, stop the affected publication, identify its location without exposing its value, and resolve it with the user. Do not rewrite history automatically; ignoring a file does not remove it from history.

## Publish children, then the root

1. Resolve or create a separate public GitHub repository for each child. For creation, use `gh repo create` with the resolved owner/name, `--public`, and the appropriate local source. Do not add a generated remote README or other initialization that conflicts with existing history. Preserve valid remotes, and inspect collisions rather than overwriting them. If an existing target is private, change visibility only within the authorized publication scope.
2. Run checks relevant to the content being published according to each project's instructions. Use the full prescribed checks for a release or cross-cutting application change. Commit intended child changes in their own repositories and push the intended branches. Preserve existing branch names unless a rename is requested. Verify each child commit is reachable from a remote branch before publishing a root pointer to it.
3. Remove only root ignore entries that prevent tracking these submodule paths. For an unregistered child, use `git submodule add` from the root with its public clone URL and existing path, reusing the existing checkout. Inspect the result before continuing. If the path is already tracked as ordinary files, assess a scoped index-only conversion; preserve its working files and history. Never delete or reclone a child to bypass an add failure.
4. Put public HTTPS clone URLs without credentials in `.gitmodules` so readers can clone recursively without SSH credentials. On repeat runs, update existing entries instead of adding duplicates, and synchronize changed URLs. Each path must appear once and point to its corresponding independent repository. Gitlinks pin commits; do not use `submodule update --remote` to choose unreviewed newer commits.
5. Update the root README with all four repository links, the independent-project relationship, and a concrete `git clone --recurse-submodules` command. Include `git submodule update --init --recursive` for an existing clone. Explain that child changes are committed and pushed first, then the root pointer is committed and pushed. Update architectural documentation only where the new submodule relationship makes existing text inaccurate.
6. Review and commit the root's intended `.gitmodules`, gitlinks, ignore changes, and documentation. Create or reuse its own public GitHub repository and push after the referenced child commits are available remotely. Do not sweep unrelated staged files into this commit.

For later updates, publish only affected child changes, then update and publish the corresponding root pointers. Do not recreate repositories or repeat a completed initial conversion. Avoid force pushes, remote deletion, unrelated branch publication, or history rewriting unless separately requested.

If a remote mutation fails or its result is uncertain, inspect GitHub and local state before retrying. Retry only after establishing a recoverable cause and whether the operation already succeeded. Stop on unresolved ownership, permissions, repository collisions, non-fast-forward conflicts, or sensitive content; report completed and outstanding steps without destructive rollback.

## Verify and report

- Confirm all four GitHub repositories have the intended owner/name and `PUBLIC` visibility; do not infer visibility from a successful push.
- Inspect `git ls-files --stage -- api app mobile` in the root: each child must be a `160000` entry whose SHA matches the intended child commit. Check `.gitmodules` paths and URLs, plus `git submodule status` for missing initialization, mismatched commits, or conflicts.
- Verify the published root branch includes the intended root commit and each gitlink commit is accessible from its child remote. Dirty child files are not included by updating a gitlink; report anything intentionally left unpublished.
- For first publication or changes to submodule wiring, clone the public root HTTPS URL recursively into a new temporary directory with authentication disabled. Verify all three children check out at the recorded commits. This validates public access and cloneability independently of the working checkout's credentials and configuration. If network access blocks verification, state that limitation instead of claiming success.
- Report repository URLs, branches and commits published, verification results, and any remaining local changes or blockers. Do not claim all repositories were published if only part of the operation completed.
