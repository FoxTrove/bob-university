---
description: Save current progress by committing and pushing to remote
---

1. Check the current status of the repository.
   - `git status`

2. Stage all changes (new, modified, deleted).
   - `git add .`

3. Generate a conventional commit message based on the changes.
   - *Agent Action*: Analyze `git diff --staged` and create a message like "feat(scope): description".

4. Commit the changes.
   - `git commit -m "[Generated Message]"`

5. Push the changes to the current branch.
   // turbo
   - `git push`

6. If the push fails due to missing upstream, set it automatically.
   - `git push --set-upstream origin [current-branch]`
