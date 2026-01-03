# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CLAUDE.md guidance files for AI-assisted development
  - Root `/CLAUDE.md` - Project overview and cross-cutting rules
  - `/frontend/CLAUDE.md` - Layout coupling, component hierarchy, styling
  - `/backend/CLAUDE.md` - Module patterns, auth, Prisma safety
  - `/tests/CLAUDE.md` - Test patterns and layout invariants
- This CHANGELOG.md file

---

## What to Record

### Must Record (HIGH/CRITICAL risk)
- Schema changes (Prisma migrations)
- API contract changes (new endpoints, changed response shapes)
- Auth flow modifications
- Layout coupling changes (sidebar width, z-index)
- Breaking changes
- Security fixes

### Should Record (MEDIUM risk)
- New features
- Non-breaking API additions
- New components/pages
- Dependency upgrades (major versions)

### Skip (LOW risk)
- Typo fixes
- Comment updates
- Test-only changes
- Refactors with no behavior change
- Patch-level dependency updates

---

## Template for New Entries

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features to be removed in future versions

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes
```
