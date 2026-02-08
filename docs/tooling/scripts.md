# Scripts

## new-slice.sh
Create a new FSD slice with optional subfolders and a public `index.ts`.

```bash
scripts/new-slice.sh <layer> <slice> [--with-ui] [--with-model] [--with-api] [--with-lib] [--with-server]
```

Examples:
```bash
scripts/new-slice.sh features resume --with-ui --with-model --with-api
scripts/new-slice.sh widgets splash-screen --with-ui
```

## new-shared-ui.sh
Create a shared UI component folder with a basic component and index export.

```bash
scripts/new-shared-ui.sh <kebab-name> [PascalName]
```

Examples:
```bash
scripts/new-shared-ui.sh bottom-sheet
scripts/new-shared-ui.sh auth-gate AuthGate
```

