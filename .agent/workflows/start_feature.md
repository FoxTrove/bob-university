---
description: Start a new feature branch properly synced with origin
---

1. Fetch the latest changes from the remote to ensure we are up to date.
   - `git fetch origin`

2. Check if we are currently on a clean working tree. If not, stash or commit changes (ask the user).
   - `git status`

3. Ask the user for the name of the new feature (e.g., "user-profile-v2").

4. Create and switch to the new branch based on origin/main (or the relevant integration branch).
   - `git checkout -b feature/[feature-name] origin/main`

5. Push the new branch upstream immediately to establish tracking.
   - `git push -u origin feature/[feature-name]`

6. Notify the user that the branch is ready.
