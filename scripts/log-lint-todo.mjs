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

const issues = [];
const lines = output.split('\n');
const issueRegex = /^(.+?):(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([-\w/]+)$/;

for (const line of lines) {
  const match = line.match(issueRegex);
  if (!match) continue;
  issues.push({
    file: match[1],
    line: match[2],
    column: match[3],
    level: match[4],
    message: match[5],
    rule: match[6],
  });
}

const ruleTemplates = {
  'eslint-comments/unused-disable': {
    title: '불필요한 eslint-disable 경고',
    cause: '실제로 해당 규칙 위반이 없는데 주석이 남아 있음',
    fix: '해당 eslint-disable 주석 제거',
  },
  'react-hooks/set-state-in-effect': {
    title: 'Effect 내부 setState 경고',
    cause: 'effect 본문에서 동기적으로 setState를 호출함',
    fix: '상태 전이를 이벤트/콜백으로 분리하거나 effect 밖에서 처리',
  },
  'react-hooks/exhaustive-deps': {
    title: 'Hook 의존성 누락 경고',
    cause: 'useMemo/useEffect 의존성 배열에 참조 값이 누락됨',
    fix: '의존성 추가 또는 메모/이펙트 제거',
  },
};

const groupedByRule = issues.reduce((acc, issue) => {
  acc[issue.rule] = acc[issue.rule] ?? [];
  acc[issue.rule].push(issue);
  return acc;
}, {});

const interpretBlocks = Object.entries(groupedByRule)
  .map(([rule, items]) => {
    const template = ruleTemplates[rule];
    const title = template?.title ?? `Lint 경고 (${rule})`;
    const symptom = items
      .map((item) => `- \`${item.message}\``)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join('\n');
    const locations = items
      .map((item) => `- \`${item.file}:${item.line}:${item.column}\``)
      .join('\n');
    const cause = template?.cause ?? '규칙 위반이 감지됨';
    const fix = template?.fix ?? '해당 규칙에 맞게 코드 수정';

    return [
      `### ${title} (${date})`,
      '',
      '#### 증상',
      '',
      symptom || `- \`${rule}\` 경고 발생`,
      '',
      '#### 발생 위치',
      '',
      locations || '- (미확인)',
      '',
      '#### 원인',
      '',
      `- ${cause}`,
      '',
      '#### 해결',
      '',
      `- ${fix}`,
      '',
    ].join('\n');
  })
  .join('\n');

const rawLogBlock = `\n### ${date} Raw Log\n\n- Logged at: ${time}\n\n\`\`\`\n${output}\n\`\`\`\n`;

const logHeader = `\n### ${date}\n\n- Logged at: ${time}\n\n\`\`\`\n${output}\n\`\`\`\n`;

if (!existsSync(docPath)) {
  appendFileSync(docPath, `# ESLint 트러블슈팅\n\n## Lint Log${logHeader}`);
  process.exit(0);
}

const current = readFileSync(docPath, 'utf8');
const hasSection = current.includes('## Lint Log');
const content = hasSection
  ? `\n${interpretBlocks}${rawLogBlock}`
  : `\n## Lint Log\n\n${interpretBlocks}${rawLogBlock}`;

appendFileSync(docPath, content);
