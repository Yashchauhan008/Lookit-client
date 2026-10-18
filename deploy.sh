#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

docker buildx build \
  --platform linux/amd64 \
  -t yashchauhan008/lookit-client:latest \
  --push .
