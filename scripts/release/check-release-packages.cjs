const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { npmReleasePackages } = require('./release-packages.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');

function fail(message) {
  console.error(`release check failed: ${message}`);
  process.exitCode = 1;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function normalizeExportTargets(value, results = new Set()) {
  if (!value) return results;
  if (typeof value === 'string') {
    results.add(value);
    return results;
  }
  if (Array.isArray(value)) {
    for (const entry of value) normalizeExportTargets(entry, results);
    return results;
  }
  if (typeof value === 'object') {
    for (const entry of Object.values(value)) normalizeExportTargets(entry, results);
  }
  return results;
}

function assertManifestFields(packageDir, manifest) {
  const requiredFields = ['name', 'version', 'license', 'homepage', 'bugs', 'repository', 'files'];
  for (const field of requiredFields) {
    if (!(field in manifest)) {
      fail(`${packageDir} is missing ${field}`);
    }
  }
}

function assertEntrypoints(packageDir, packageRoot, manifest) {
  for (const field of ['main', 'types']) {
    if (manifest[field] && !fs.existsSync(path.join(packageRoot, manifest[field]))) {
      fail(`${packageDir} ${field} target does not exist: ${manifest[field]}`);
    }
  }

  if (manifest.exports) {
    for (const target of normalizeExportTargets(manifest.exports)) {
      if (typeof target !== 'string' || target.includes('*')) continue;
      if (!fs.existsSync(path.join(packageRoot, target))) {
        fail(`${packageDir} exports target does not exist: ${target}`);
      }
    }
  }
}

function assertFilesEntries(packageDir, packageRoot, manifest) {
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    fail(`${packageDir} must declare a non-empty files list`);
    return;
  }

  for (const entry of manifest.files) {
    if (!fs.existsSync(path.join(packageRoot, entry))) {
      fail(`${packageDir} files entry does not exist: ${entry}`);
    }
  }
}

function assertPackOutput(packageDir, packageRoot) {
  const npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urql-npm-pack-cache-'));
  const output = execFileSync('npm', ['pack', '--json', '--dry-run'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const pack = JSON.parse(output)[0];
  if (!Array.isArray(pack.files) || pack.files.length === 0) {
    fail(`${packageDir} npm pack dry-run returned no files`);
  }
}

for (const packageDir of npmReleasePackages) {
  const packageRoot = path.join(repoRoot, packageDir);
  const manifest = readJson(path.join(packageDir, 'package.json'));

  if (manifest.private === true) {
    fail(`${packageDir} is still private`);
  }

  assertManifestFields(packageDir, manifest);
  assertFilesEntries(packageDir, packageRoot, manifest);
  assertEntrypoints(packageDir, packageRoot, manifest);
  assertPackOutput(packageDir, packageRoot);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('release package checks passed');
