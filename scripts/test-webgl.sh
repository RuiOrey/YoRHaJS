#!/bin/bash
# Run WebGL visual tests with Firefox (the only browser that works on this machine)
# Usage: ./scripts/test-webgl.sh [headed|headless]

MODE="${1:-headless}"

echo "=== WebGL Visual Test ==="
echo "Mode: $MODE"
echo ""

if [ "$MODE" = "headed" ]; then
  echo "Opening browser window..."
  npx playwright test --project=firefox-headed tests/webgl-visual.spec.js
else
  echo "Running headless..."
  npx playwright test --project=firefox tests/webgl-visual.spec.js
fi

echo ""
echo "Screenshots saved to test-results/"
ls -la test-results/*.png 2>/dev/null
