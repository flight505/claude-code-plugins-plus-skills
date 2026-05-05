#!/usr/bin/env bash
exec "$(dirname "$0")/../../_shared/doc-builder.py" "$(dirname "$0")/../docs-config.yaml"
