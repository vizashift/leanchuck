#!/usr/bin/env bash
#
# Locks down the repo for public, PR-only contribution.
# Run once after `gh auth login`. Safe to re-run (idempotent).
#
# Usage:
#   ./scripts/setup-branch-protection.sh
#
set -euo pipefail

REPO="vizashift/leanchuck"

# Set to "true" to also prevent admins (you) from pushing directly to the
# protected branch. Leave "false" if you want to keep an escape hatch for
# hotfixes. Either way, non-collaborators can never push — they must fork + PR.
ENFORCE_ADMINS="false"

echo "==> Verifying gh auth..."
gh auth status >/dev/null

echo "==> Detecting default branch for $REPO..."
BRANCH="$(gh repo view "$REPO" --json defaultBranchRef --jq '.defaultBranchRef.name')"
echo "    default branch: $BRANCH"

echo "==> Applying branch protection to '$BRANCH'..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input - <<JSON
{
  "required_status_checks": null,
  "enforce_admins": $ENFORCE_ADMINS,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
echo "    protection applied."

echo "==> Requiring approval for fork PR workflows (external contributors)..."
if gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/actions/permissions/fork-pr-contributor-approval" \
  -f approval_policy="all_external_contributors" 2>/dev/null; then
  echo "    fork-PR approval policy set."
else
  echo "    (could not set via API — set it manually in:"
  echo "     Settings → Actions → General → 'Fork pull request workflows'"
  echo "     → 'Require approval for all external contributors')"
fi

echo "==> Done. Summary:"
echo "    - Direct pushes to '$BRANCH' are blocked; changes require a PR."
echo "    - PRs need 1 approval + Code Owner review."
echo "    - Force-pushes and branch deletion are disabled."
echo "    - Outside contributors must fork and open a PR."
