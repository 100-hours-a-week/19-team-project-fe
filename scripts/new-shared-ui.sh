#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/new-shared-ui.sh <kebab-name> [PascalName]" >&2
  exit 1
fi

kebab="$1"
pascal="${2:-}"

if [[ ! "$kebab" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: name must be kebab-case (e.g. bottom-sheet)." >&2
  exit 1
fi

if [[ -z "$pascal" ]]; then
  pascal="$(echo "$kebab" | awk -F- '{ for (i=1; i<=NF; i++) { $i=toupper(substr($i,1,1)) substr($i,2) } }1' OFS="")"
fi

root="src/shared/ui/${kebab}"
if [[ -e "$root" ]]; then
  echo "Error: ${root} already exists." >&2
  exit 1
fi

mkdir -p "$root"

cat > "${root}/${pascal}.tsx" <<EOF
import type { HTMLAttributes } from 'react';

export type ${pascal}Props = HTMLAttributes<HTMLDivElement>;

export default function ${pascal}(props: ${pascal}Props) {
  return <div {...props} />;
}
EOF

cat > "${root}/index.ts" <<EOF
export { default as ${pascal} } from './${pascal}';
export type { ${pascal}Props } from './${pascal}';
EOF

echo "Created ${root}/${pascal}.tsx and ${root}/index.ts"
