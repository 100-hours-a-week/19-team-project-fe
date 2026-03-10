import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SHARED_UI_DIR = path.join(ROOT, 'src', 'shared', 'ui');

async function readDirSafe(target) {
  try {
    return await readdir(target, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function collectStoryMetrics(sliceDir) {
  const entries = await readDirSafe(sliceDir);

  const componentFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.tsx'))
    .filter((name) => !name.includes('.stories.'))
    .filter((name) => name !== 'index.tsx');

  const storyFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.stories\.(ts|tsx|js|jsx|mdx)$/.test(name));

  const storySummaries = [];
  for (const storyFile of storyFiles) {
    const storyPath = path.join(sliceDir, storyFile);
    const source = await readFile(storyPath, 'utf8');
    const storyExports = (source.match(/export\s+const\s+/g) ?? []).length;
    const playBlocks = (source.match(/\bplay\s*:/g) ?? []).length;

    storySummaries.push({
      storyFile,
      storyExports,
      playBlocks,
    });
  }

  return {
    slice: path.basename(sliceDir),
    componentFiles,
    storyFiles,
    storySummaries,
  };
}

async function main() {
  const sliceEntries = await readDirSafe(SHARED_UI_DIR);
  const sliceDirs = [];

  for (const entry of sliceEntries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(SHARED_UI_DIR, entry.name);
    const info = await stat(fullPath);
    if (info.isDirectory()) sliceDirs.push(fullPath);
  }

  const metrics = [];
  for (const sliceDir of sliceDirs) {
    metrics.push(await collectStoryMetrics(sliceDir));
  }

  const totalSlices = metrics.length;
  const slicesWithStories = metrics.filter((m) => m.storyFiles.length > 0).length;
  const totalStoryFiles = metrics.reduce((sum, m) => sum + m.storyFiles.length, 0);
  const totalStoryExports = metrics.reduce(
    (sum, m) => sum + m.storySummaries.reduce((s, item) => s + item.storyExports, 0),
    0,
  );
  const totalPlayBlocks = metrics.reduce(
    (sum, m) => sum + m.storySummaries.reduce((s, item) => s + item.playBlocks, 0),
    0,
  );

  const missingStorySlices = metrics
    .filter((m) => m.componentFiles.length > 0 && m.storyFiles.length === 0)
    .map((m) => m.slice);

  const slicesWithoutPlay = metrics
    .filter((m) => m.storyFiles.length > 0)
    .filter((m) => m.storySummaries.every((item) => item.playBlocks === 0))
    .map((m) => m.slice);

  console.log('Storybook Audit (shared/ui)');
  console.log(`- slices: ${totalSlices}`);
  console.log(`- slices with stories: ${slicesWithStories}/${totalSlices}`);
  console.log(`- story files: ${totalStoryFiles}`);
  console.log(`- story exports: ${totalStoryExports}`);
  console.log(`- interaction play blocks: ${totalPlayBlocks}`);

  if (missingStorySlices.length > 0) {
    console.log(`- missing stories: ${missingStorySlices.join(', ')}`);
  }

  if (slicesWithoutPlay.length > 0) {
    console.log(`- no play coverage: ${slicesWithoutPlay.join(', ')}`);
  }

  const failed = missingStorySlices.length > 0 || slicesWithoutPlay.length > 0;
  if (failed) {
    process.exitCode = 1;
    console.log('Result: FAILED');
    return;
  }

  console.log('Result: PASSED');
}

await main();
