---
name: pre-checkin-security
description: Review staged code changes and run static, dependency, and localhost-only dynamic security scans.
---

# Pre-check-in security review

Use this skill before committing or checking in code. Review the actual staged changes and their relevant callers/configuration; do not claim a clean review based only on a build or dependency scan.

## Required checks

1. Inspect the staged diff with `git diff --cached` and identify the changed inputs, trust boundaries, data flows, and authorization decisions.
2. Check applicable risks, including:
   - Authentication, authorization, and access-control bypasses.
   - Injection into SQL, shell commands, URLs, or HTML; unsafe rendering and cross-site scripting.
   - Missing validation of untrusted input and unsafe file or network handling.
   - Secrets, personal data, or sensitive tokens exposed in code, logs, or configuration.
   - Insecure storage, transport, redirects, or permissive security settings.
3. Run `npm run security:check` before check-in. It runs the static source scan (SVA/SAST) and resolves the declared npm dependencies into a temporary lockfile for the software composition analysis (SCA); it does not modify the project manifest or lockfile.
4. On pull requests, run the OWASP ZAP baseline dynamic scan (DVA/DAST) against the locally built frontend at `http://127.0.0.1:4173/Salvatore/`. It performs spidering and passive checks, not active exploit testing. Review its uploaded report; `-I` keeps WARN-only results from failing the job but does not hide them from the report. Do not point it at a remote or production target. Preview-server header alerts must not be presented as production findings or silently suppressed. The production site is GitHub Pages, which cannot set arbitrary response headers; do not add preview-only headers as a substitute. Production header enforcement would require a CDN/reverse proxy or a host that supports response-header configuration. This scan does not cover API/backend services that are not hosted by this repository.
5. Report each confirmed issue with severity, affected file and lines, evidence, impact, and a minimal remediation. Distinguish confirmed vulnerabilities from review concerns and state any scan or scope limitation.
6. Do not mark the review clean if a scanner fails, cannot reach its required registry, the staged diff was not reviewed, or the DVA target is unavailable. Explain the blocker and do not bypass the pre-commit hook.

## Check-in gate

The repository's `.githooks/pre-commit` runs SVA and SCA before a commit. If hooks are not enabled in a clone, enable them with:

```sh
git config core.hooksPath .githooks
```

SCA uses the current declared version ranges because this repository does not commit a lockfile; it is not a report of an exact installed dependency tree. DVA runs in the pull-request workflow against only the local frontend preview.
