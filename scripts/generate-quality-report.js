#!/usr/bin/env node
/**
 * generate-quality-report.js
 *
 * Build-time script that runs Vitest, TypeScript, and ESLint,
 * then writes a JSON report to public/code-quality-report.json.
 * Vite copies public/ into dist/ during build, so the report is
 * accessible at /code-quality-report.json on the deployed site.
 *
 * Exit code is always 0 -- the report captures failures without
 * blocking the build. The actual test gate is `npm run test`.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'public', 'code-quality-report.json');

function run(cmd, opts = {}) {
  try {
    const result = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
      ...opts,
    });
    return { stdout: result, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status ?? 1,
    };
  }
}

// ---------------------------------------------------------------------------
// 1. Vitest (JSON reporter)
// ---------------------------------------------------------------------------
function collectTestResults() {
  console.log('[quality-report] Running vitest --reporter=json ...');
  const { stdout, stderr, exitCode } = run('npx vitest run --reporter=json 2>&1');

  // Vitest JSON goes to stdout; try to parse the last JSON block
  const jsonMatch = (stdout + (stderr || '')).match(/\{[\s\S]*"testResults"[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('[quality-report] Could not parse vitest JSON output');
    return {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration_ms: 0,
      success: false,
      files: [],
    };
  }

  try {
    const json = JSON.parse(jsonMatch[0]);
    const files = (json.testResults || []).map((f) => {
      const name = f.name
        .replace(/\\/g, '/')
        .replace(/^.*?src\//, 'src/');
      const passed = (f.assertionResults || []).filter((r) => r.status === 'passed').length;
      const failed = (f.assertionResults || []).filter((r) => r.status === 'failed').length;
      const skipped = (f.assertionResults || []).filter((r) => r.status === 'pending' || r.status === 'skipped').length;
      return {
        file: name,
        tests: passed + failed + skipped,
        passed,
        failed,
        skipped,
        duration_ms: f.endTime - f.startTime,
      };
    });

    const totalPassed = files.reduce((s, f) => s + f.passed, 0);
    const totalFailed = files.reduce((s, f) => s + f.failed, 0);
    const totalSkipped = files.reduce((s, f) => s + f.skipped, 0);

    return {
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      total: totalPassed + totalFailed + totalSkipped,
      duration_ms: json.startTime ? Date.now() - json.startTime : files.reduce((s, f) => s + f.duration_ms, 0),
      success: totalFailed === 0,
      files,
    };
  } catch (e) {
    console.warn('[quality-report] Failed to parse vitest JSON:', e.message);
    return { passed: 0, failed: 0, skipped: 0, total: 0, duration_ms: 0, success: false, files: [] };
  }
}

// ---------------------------------------------------------------------------
// 2. TypeScript (tsc --noEmit)
// ---------------------------------------------------------------------------
function collectTypeScriptErrors() {
  console.log('[quality-report] Running tsc --noEmit ...');
  const { stdout, exitCode } = run('npx tsc --noEmit 2>&1');

  if (exitCode === 0) {
    return { errors: 0, files_with_errors: 0, details: [] };
  }

  const lines = stdout.split('\n').filter((l) => /\.tsx?/.test(l) && /error TS\d+/.test(l));
  const fileSet = new Set();
  const details = [];

  for (const line of lines) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error (TS\d+):\s*(.+)/);
    if (match) {
      const file = match[1].replace(/\\/g, '/').replace(/^.*?src\//, 'src/');
      fileSet.add(file);
      details.push({
        file,
        line: parseInt(match[2], 10),
        code: match[4],
        message: match[5].trim(),
      });
    }
  }

  return {
    errors: details.length,
    files_with_errors: fileSet.size,
    details: details.slice(0, 50), // Cap at 50 to keep JSON small
  };
}

// ---------------------------------------------------------------------------
// 3. ESLint (JSON format)
// ---------------------------------------------------------------------------
function collectLintResults() {
  console.log('[quality-report] Running eslint --format json ...');
  const { stdout, exitCode } = run('npx eslint . --format json --max-warnings 9999 2>&1');

  // ESLint JSON is an array
  const jsonMatch = stdout.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('[quality-report] Could not parse eslint JSON output');
    return { errors: 0, warnings: 0, fixable: 0, files_with_issues: 0, details: [] };
  }

  try {
    const json = JSON.parse(jsonMatch[0]);
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalFixable = 0;
    let filesWithIssues = 0;
    const details = [];

    for (const file of json) {
      if (file.errorCount === 0 && file.warningCount === 0) continue;
      filesWithIssues++;
      totalErrors += file.errorCount;
      totalWarnings += file.warningCount;
      totalFixable += file.fixableErrorCount + file.fixableWarningCount;

      const name = file.filePath
        .replace(/\\/g, '/')
        .replace(/^.*?src\//, 'src/');

      details.push({
        file: name,
        errors: file.errorCount,
        warnings: file.warningCount,
        fixable: file.fixableErrorCount + file.fixableWarningCount,
      });
    }

    return {
      errors: totalErrors,
      warnings: totalWarnings,
      fixable: totalFixable,
      files_with_issues: filesWithIssues,
      details: details.slice(0, 50),
    };
  } catch (e) {
    console.warn('[quality-report] Failed to parse eslint JSON:', e.message);
    return { errors: 0, warnings: 0, fixable: 0, files_with_issues: 0, details: [] };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('[quality-report] Generating code quality report...');

const tests = collectTestResults();
const typescript = collectTypeScriptErrors();
const lint = collectLintResults();

const report = {
  generated_at: new Date().toISOString(),
  git_sha: (() => {
    try { return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim(); }
    catch { return 'unknown'; }
  })(),
  git_branch: (() => {
    try { return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim(); }
    catch { return 'unknown'; }
  })(),
  tests,
  typescript,
  lint,
};

// Ensure public/ exists
if (!existsSync(resolve(ROOT, 'public'))) {
  mkdirSync(resolve(ROOT, 'public'), { recursive: true });
}

writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
console.log(`[quality-report] Report written to ${OUTPUT}`);
console.log(`[quality-report] Tests: ${tests.passed}/${tests.total} passed | TS errors: ${typescript.errors} | Lint: ${lint.errors} errors, ${lint.warnings} warnings`);
