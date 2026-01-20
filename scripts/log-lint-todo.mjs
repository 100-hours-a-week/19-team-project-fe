import { spawnSync } from 'child_process';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const docPath = resolve(process.cwd(), 'docs/troubleshooting/eslint.md');
const lint = spawnSync('pnpm', ['lint'], {
  encoding: 'utf8',
  shell: true,
});

const output = `${lint.stdout ?? ''}${lint.stderr ?? ''}`.trim();

if (output) {
  process.stdout.write(`${output}\n`);
}

if (lint.status === 0 || !output) {
  process.exit(0);
}

const now = new Date();
const date = now.toISOString().slice(0, 10);
const time = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';

const logHeader = `\n### ${date}\n\n- Logged at: ${time}\n\n\`\`\`\n${output}\n\`\`\`\n`;

if (!existsSync(docPath)) {
  appendFileSync(docPath, `# ESLint 트러블슈팅\n\n## Lint Log${logHeader}`);
  process.exit(0);
}

const current = readFileSync(docPath, 'utf8');
const hasSection = current.includes('## Lint Log');
const content = hasSection ? logHeader : `\n## Lint Log${logHeader}`;

appendFileSync(docPath, content);
