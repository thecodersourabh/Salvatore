import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), 'salvatore-security-audit-'));

function runNpm(args, label) {
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const commandArgs = process.platform === 'win32' ? ['/d', '/c', 'npm', ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: tempDir,
    encoding: 'utf8',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    console.error(`Security check could not ${label}: ${result.error.message}`);
    return false;
  }
  if (result.status !== 0) {
    console.error(`Security check could not ${label} (npm exited with ${result.status}).`);
    return false;
  }
  return true;
}

try {
  const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  writeFileSync(join(tempDir, 'package.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(tempDir, '.npmrc'), 'legacy-peer-deps=true\n');

  console.log('Resolving declared dependencies in a temporary directory for npm audit...');
  if (!runNpm([
    'install',
    '--package-lock-only',
    '--package-lock=true',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
  ], 'resolve declared dependencies')) {
    process.exitCode = 1;
  } else {
    console.log('Checking resolved dependencies for known vulnerabilities...');
    if (!runNpm(['audit', '--audit=true', '--audit-level=low'], 'complete npm audit')) {
      process.exitCode = 1;
    } else {
      console.log('Dependency security audit passed.');
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
