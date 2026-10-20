#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env.prod ] || { echo "Missing .env.prod (production build settings)"; exit 1; }
echo "Building lookit-client with .env.prod:"
sed 's/^/  /' .env.prod

docker buildx build \
  --platform linux/amd64 \
  -t yashchauhan008/lookit-client:latest \
  --push .
