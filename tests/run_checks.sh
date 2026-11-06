#!/usr/bin/env bash
set -euo pipefail
# Run from repository root; no network required.
find public -name '*.js' ! -name 'firebase-multiplayer.js' -print0 | xargs -0 -n 1 node --check
node --check --input-type=module < public/games/retro-arcade/firebase-multiplayer.js
python3 -m compileall -q .github/scripts admin/media-studio
python3 tests/check_catalog_integrity.py
python3 tests/check_html_and_sitemap.py
python3 tests/check_no_secrets.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.mjs
