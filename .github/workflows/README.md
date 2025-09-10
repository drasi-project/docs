# Documentation Update Automation

This directory contains automation for keeping documentation in sync with the main drasi-platform repository.

## Auto-generate Documentation Issues

When a PR is merged in the `drasi-project/drasi-platform` repository, an issue is automatically created in this docs repository to prompt documentation updates.

### How it works

1. **Trigger**: The workflow is triggered via GitHub's `repository_dispatch` event
2. **Event Type**: `platform-pr-merged`
3. **Action**: Creates a new issue with details about the merged PR

### Setup Instructions for drasi-platform Repository

To enable automatic issue creation, add the following workflow to the `drasi-project/drasi-platform` repository at `.github/workflows/notify-docs-on-merge.yaml`:

```yaml
name: Notify docs repo on PR merge

on:
  pull_request:
    types: [closed]

jobs:
  notify-docs:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Trigger docs issue creation
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.DOCS_REPO_TOKEN }}
          script: |
            await github.rest.repos.createDispatchEvent({
              owner: 'drasi-project',
              repo: 'docs',
              event_type: 'platform-pr-merged',
              client_payload: {
                pr_number: context.payload.pull_request.number,
                pr_title: context.payload.pull_request.title,
                pr_author: context.payload.pull_request.user.login,
                merged_by: context.payload.pull_request.merged_by.login,
                merged_at: context.payload.pull_request.merged_at,
                pr_url: context.payload.pull_request.html_url,
                pr_description: context.payload.pull_request.body || 'No description provided',
                changed_files: 'See PR for changed files'
              }
            });
```

### Required Secrets

The `drasi-platform` repository needs a secret called `DOCS_REPO_TOKEN` with a GitHub personal access token that has the following permissions:
- `repo` scope (to trigger repository dispatch events)
- Access to the `drasi-project/docs` repository

### Testing

To test the workflow manually, you can trigger it using the GitHub CLI:

```bash
gh api repos/drasi-project/docs/dispatches \
  --field event_type=platform-pr-merged \
  --field client_payload='{"pr_number":"123","pr_title":"Test PR","pr_author":"testuser","merged_by":"merger","merged_at":"2023-01-01T00:00:00Z","pr_url":"https://github.com/drasi-project/drasi-platform/pull/123","pr_description":"Test description","changed_files":"file1.go, file2.md"}'
```

### Generated Issue Format

The automatically created issues will include:
- PR details (number, title, author, merge info)
- Direct link to the merged PR
- Checklist for documentation tasks
- Labels: `documentation`, `auto-generated`, `platform-update`

#### Example Generated Issue

**Title:** `📝 Update documentation for merged PR #123`

**Body:**
```markdown
## Documentation Update Required

A pull request has been merged in the [drasi-platform repository](https://github.com/drasi-project/drasi-platform/pull/123) that may require documentation updates.

**Merged PR Details:**
- **PR Number:** #123
- **Title:** Add new reactive query feature
- **Author:** @developer
- **Merged by:** @maintainer
- **Merge Date:** 2024-01-15T10:30:00Z
- **PR URL:** https://github.com/drasi-project/drasi-platform/pull/123

**Action Required:**
Please review the merged changes and update the documentation as needed:

- [ ] Review the changes in the merged PR
- [ ] Identify documentation that needs to be updated or created
- [ ] Update relevant documentation pages
- [ ] Test any code examples or instructions
- [ ] Close this issue when documentation is complete

**Files that may need documentation updates:**
src/reactive/query.go, docs/api.md

**PR Description:**
This PR adds support for reactive queries with real-time updates...

---
*This issue was automatically created when PR #123 was merged in the drasi-platform repository.*
```

**Labels:** `documentation`, `auto-generated`, `platform-update`