#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: scripts/new-slice.sh <layer> <slice> [--with-ui] [--with-model] [--with-api] [--with-lib] [--with-server]" >&2
  exit 1
fi

layer="$1"
slice="$2"
shift 2

case "$layer" in
  widgets|features|entities|shared) ;;
  *)
    echo "Error: layer must be one of widgets, features, entities, shared." >&2
    exit 1
    ;;
esac

if [[ ! "$slice" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: slice must be kebab-case (e.g. resume-editor)." >&2
  exit 1
fi

root="src/${layer}/${slice}"
if [[ -e "$root" ]]; then
  echo "Error: ${root} already exists." >&2
  exit 1
fi

mkdir -p "$root"
touch "${root}/index.ts"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-ui) mkdir -p "${root}/ui" ;;
    --with-model) mkdir -p "${root}/model" ;;
    --with-api) mkdir -p "${root}/api" ;;
    --with-lib) mkdir -p "${root}/lib" ;;
    --with-server) mkdir -p "${root}/server" ;;
    *)
      echo "Error: unknown option $1" >&2
      exit 1
      ;;
  esac
  shift
done

echo "Created ${root} with index.ts"
