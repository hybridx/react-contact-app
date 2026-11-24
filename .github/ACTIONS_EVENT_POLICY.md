# Actions event policy: `pull_request_target` allowlist

Starting **December 2, 2026**, GitHub Actions blocks `pull_request_target`
events by default in public repositories unless the repository's Actions
event policy explicitly allows them. This file records the audit of this
repository's workflows (issue #47) and lists the workflows that must be
added to the event policy allowlist.

## Audit results

| Workflow | Trigger(s) | Category | Action |
| --- | --- | --- | --- |
| `.github/workflows/fullsend.yaml` | `issues`, `issue_comment`, `pull_request_target`, `pull_request_review` | C — metadata-only | Keep; allowlist (see below) |
| `.github/workflows/nodejs.yml` | `push` (develop) | n/a — no `pull_request_target` | None |
| `.github/workflows/prioritize.yml` | `workflow_dispatch` | n/a — no `pull_request_target` | None |

No Category A (unprivileged build/test) or Category B (privileged build of
fork code) workflows exist in this repository, so no migration to the
`pull_request` + `workflow_run` split pattern is required.

## Workflows requiring an Actions event policy allowlist

A maintainer must add the following workflow to the repository's Actions
event policy (Settings → Actions → General) using workflow file targeting:

- **`.github/workflows/fullsend.yaml`** — the fullsend shim workflow. It
  uses `pull_request_target` because it needs write permissions (issues,
  pull requests, contents, actions) to comment on, label, and dispatch
  agent work for pull-request events, which a fork PR's read-only
  `pull_request` token cannot provide. The shim itself never checks out
  or executes pull-request code — it only forwards the event payload to
  fullsend's reusable dispatch workflow — so it is not exposed to "pwn
  request" style attacks that check out untrusted fork code in a
  privileged context.

  This file is managed by fullsend and references
  `fullsend-ai/fullsend/.github/workflows/reusable-dispatch.yml`; any
  change to how it consumes `pull_request_target` events belongs
  upstream in the `fullsend-ai/fullsend` repository, not here.
