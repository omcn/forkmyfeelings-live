#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------
# build-ios.sh
# Builds the Next.js app as a static export and syncs it
# into the Capacitor iOS project, then opens Xcode.
# -----------------------------------------------------------

# 1. Build the Next.js app.
#    With `output: 'export'` in next.config.js this produces
#    a fully static site in the "out" directory.
echo ">> Building Next.js static export..."
npx next build

# 2. Sync web assets + native plugins into the iOS project.
#    This copies the "out" directory into the iOS app bundle
#    and updates any native plugin code that has changed.
echo ">> Syncing Capacitor iOS project..."
npx cap sync ios

# 3. Open the Xcode workspace so you can run/archive the app.
echo ">> Opening Xcode..."
npx cap open ios
