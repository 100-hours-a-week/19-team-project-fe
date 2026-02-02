/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const appDir = path.join(srcDir, 'app');
const outDir = path.join(rootDir, 'docs', 'analysis');

const scriptTarget = ts.ScriptTarget.Latest;

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isDir(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkFiles(dirPath, predicate) {
  const results = [];
  if (!isDir(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function createSourceFile(filePath) {
  const content = readFile(filePath);
  const kind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(filePath, content, scriptTarget, true, kind);
}

function resolveImport(fromFile, specifier) {
  if (!specifier) return null;
  let basePath = null;
  if (specifier.startsWith('@/')) {
    basePath = path.join(srcDir, specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const candidates = [];
  if (isFile(basePath)) candidates.push(basePath);
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    candidates.push(`${basePath}${ext}`);
  }
  if (isDir(basePath)) {
    for (const ext of extensions) {
      candidates.push(path.join(basePath, `index${ext}`));
    }
  }
  for (const candidate of candidates) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function getRouteFromPageFile(filePath) {
  const rel = path.relative(appDir, filePath);
  const withoutPage = rel.replace(/page\.tsx$/, '').replace(/page\.ts$/, '');
  const segments = withoutPage.split(path.sep).filter(Boolean);
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function isApiFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/src/features/') &&
    normalized.includes('/api/') &&
    normalized.endsWith('.ts')
  ) || (
    normalized.includes('/src/entities/') &&
    normalized.includes('/api/') &&
    normalized.endsWith('.ts')
  );
}

function collectApiExports(apiFilePath) {
  const source = createSourceFile(apiFilePath);
  const exports = new Set();

  source.forEachChild((node) => {
    if (ts.isFunctionDeclaration(node)) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && node.name) {
        exports.add(node.name.text);
      }
    }
    if (ts.isVariableStatement(node)) {
      const hasExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!hasExport) return;
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const init = decl.initializer;
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
            exports.add(decl.name.text);
          }
        }
      }
    }
  });

  return exports;
}

const apiFiles = walkFiles(srcDir, (filePath) => isApiFile(filePath));
const apiExportsByFile = new Map();
for (const apiFile of apiFiles) {
  apiExportsByFile.set(apiFile, collectApiExports(apiFile));
}

const exportResolutionCache = new Map();

function resolveExportToApi(moduleFile, exportName, seen = new Set()) {
  if (!moduleFile || !exportName) return null;
  const cacheKey = `${moduleFile}::${exportName}`;
  if (exportResolutionCache.has(cacheKey)) return exportResolutionCache.get(cacheKey);

  if (seen.has(cacheKey)) return null;
  seen.add(cacheKey);

  if (apiExportsByFile.has(moduleFile)) {
    const exports = apiExportsByFile.get(moduleFile);
    if (exports && exports.has(exportName)) {
      exportResolutionCache.set(cacheKey, moduleFile);
      return moduleFile;
    }
  }

  const source = createSourceFile(moduleFile);
  let found = null;

  source.forEachChild((node) => {
    if (found) return;
    if (!ts.isExportDeclaration(node)) return;
    const moduleSpecifier = node.moduleSpecifier && node.moduleSpecifier.text;
    if (!moduleSpecifier) return;
    const resolvedTarget = resolveImport(moduleFile, moduleSpecifier);
    if (!resolvedTarget) return;

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const exported = element.name.text;
        const original = (element.propertyName || element.name).text;
        if (exported !== exportName) continue;
        const target = resolveExportToApi(resolvedTarget, original, seen);
        if (target) {
          found = target;
          return;
        }
      }
    } else {
      // export * from './module'
      const target = resolveExportToApi(resolvedTarget, exportName, seen);
      if (target) {
        found = target;
      }
    }
  });

  exportResolutionCache.set(cacheKey, found);
  return found;
}

const widgetExportCache = new Map();

function resolveWidgetExport(moduleFile, exportName, seen = new Set()) {
  if (!moduleFile || !exportName) return null;
  const cacheKey = `${moduleFile}::${exportName}`;
  if (widgetExportCache.has(cacheKey)) return widgetExportCache.get(cacheKey);

  if (seen.has(cacheKey)) return null;
  seen.add(cacheKey);

  const source = createSourceFile(moduleFile);
  let found = null;

  source.forEachChild((node) => {
    if (found) return;
    if (!ts.isExportDeclaration(node)) return;
    const moduleSpecifier = node.moduleSpecifier && node.moduleSpecifier.text;
    if (!moduleSpecifier) return;
    const resolvedTarget = resolveImport(moduleFile, moduleSpecifier);
    if (!resolvedTarget) return;

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const exported = element.name.text;
        const original = (element.propertyName || element.name).text;
        if (exported !== exportName) continue;
        const target = resolveWidgetExport(resolvedTarget, original, seen) || resolvedTarget;
        found = target;
        return;
      }
    } else {
      const target = resolveWidgetExport(resolvedTarget, exportName, seen) || resolvedTarget;
      found = target;
    }
  });

  widgetExportCache.set(cacheKey, found || moduleFile);
  return found || moduleFile;
}

function analyzeFileForApiCalls(filePath) {
  const source = createSourceFile(filePath);
  const apiLocals = new Set();

  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const moduleSpecifier = stmt.moduleSpecifier && stmt.moduleSpecifier.text;
    if (!moduleSpecifier) continue;
    const resolvedModule = resolveImport(filePath, moduleSpecifier);
    if (!resolvedModule) continue;

    const clause = stmt.importClause;
    if (!clause || !clause.namedBindings) continue;
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        const importName = (element.propertyName || element.name).text;
        const localName = element.name.text;
        if (resolveExportToApi(resolvedModule, importName)) {
          apiLocals.add(localName);
        }
      }
    }
  }

  const calls = new Set();

  function visit(node) {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        if (apiLocals.has(name)) {
          calls.add(name);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return calls;
}

function resolveWidgetImports(pageFilePath) {
  const source = createSourceFile(pageFilePath);
  const widgets = [];

  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const moduleSpecifier = stmt.moduleSpecifier && stmt.moduleSpecifier.text;
    if (!moduleSpecifier) continue;
    const resolvedModule = resolveImport(pageFilePath, moduleSpecifier);
    if (!resolvedModule) continue;
    if (!resolvedModule.replace(/\\/g, '/').includes('/src/widgets/')) continue;

    const clause = stmt.importClause;
    if (!clause || !clause.namedBindings) continue;
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        const importName = (element.propertyName || element.name).text;
        const resolvedWidget = resolveWidgetExport(resolvedModule, importName);
        widgets.push({ name: importName, file: resolvedWidget });
      }
    }
  }

  return widgets;
}

function analyzePages() {
  const pageFiles = walkFiles(appDir, (filePath) => filePath.endsWith('page.tsx'));
  const results = [];

  for (const pageFile of pageFiles) {
    const route = getRouteFromPageFile(pageFile);
    const pageCalls = analyzeFileForApiCalls(pageFile);
    const widgets = resolveWidgetImports(pageFile);
    const widgetResults = [];
    const apiCalls = new Set([...pageCalls]);

    for (const widget of widgets) {
      const calls = analyzeFileForApiCalls(widget.file);
      for (const call of calls) apiCalls.add(call);
      widgetResults.push({
        name: widget.name,
        file: widget.file,
        calls: Array.from(calls).sort(),
      });
    }

    results.push({
      route,
      pageFile,
      widgets: widgetResults,
      apiCalls: Array.from(apiCalls).sort(),
    });
  }

  return results.sort((a, b) => a.route.localeCompare(b.route));
}

function toMarkdownTable(results) {
  const header = '| Page | Widgets | API Calls | Count |';
  const sep = '|---|---|---:|---:|';
  const rows = results.map((item) => {
    const widgetNames = item.widgets.map((w) => w.name).join(', ') || '-';
    const apiCalls = item.apiCalls.join(', ') || '-';
    return `| ${item.route} | ${widgetNames} | ${apiCalls} | ${item.apiCalls.length} |`;
  });
  return [header, sep, ...rows].join('\n');
}

function toCsv(results) {
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['page', 'widgets', 'api_calls', 'count'],
    ...results.map((item) => [
      item.route,
      item.widgets.map((w) => w.name).join(', '),
      item.apiCalls.join(', '),
      String(item.apiCalls.length),
    ]),
  ];
  return rows.map((row) => row.map(escape).join(',')).join('\n');
}

function toMermaid(results) {
  const lines = ['graph TD'];
  for (const item of results) {
    const pageNode = `page_${item.route.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`  ${pageNode}["${item.route}"]`);
    for (const widget of item.widgets) {
      const widgetNode = `widget_${widget.name.replace(/[^a-zA-Z0-9]/g, '_')}_${pageNode}`;
      const widgetLabel = path.relative(rootDir, widget.file).replace(/\\/g, '/');
      lines.push(`  ${widgetNode}["${widgetLabel}"]`);
      lines.push(`  ${pageNode} --> ${widgetNode}`);
      for (const call of widget.calls) {
        const apiNode = `api_${call.replace(/[^a-zA-Z0-9]/g, '_')}`;
        lines.push(`  ${apiNode}["${call}()"]`);
        lines.push(`  ${widgetNode} --> ${apiNode}`);
      }
    }
    for (const call of item.apiCalls) {
      const apiNode = `api_${call.replace(/[^a-zA-Z0-9]/g, '_')}`;
      lines.push(`  ${apiNode}["${call}()"]`);
    }
  }
  return lines.join('\n');
}

function main() {
  const results = analyzePages();
  ensureDir(outDir);

  const mdPath = path.join(outDir, 'bff-aggregation-analysis.md');
  const csvPath = path.join(outDir, 'bff-aggregation-analysis.csv');
  const mermaidPath = path.join(outDir, 'bff-aggregation-graph.mmd');

  const mdContent = [
    '# BFF Aggregation Candidates (AST)',
    '',
    toMarkdownTable(results),
    '',
  ].join('\n');

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  fs.writeFileSync(csvPath, toCsv(results), 'utf8');
  fs.writeFileSync(mermaidPath, toMermaid(results), 'utf8');

  console.log(`Wrote: ${path.relative(rootDir, mdPath)}`);
  console.log(`Wrote: ${path.relative(rootDir, csvPath)}`);
  console.log(`Wrote: ${path.relative(rootDir, mermaidPath)}`);
}

main();
