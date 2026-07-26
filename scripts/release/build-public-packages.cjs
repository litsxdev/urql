const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { npmReleasePackages } = require('./release-packages.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');

function readManifest(packageDir) {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, packageDir, 'package.json'), 'utf8')
  );
}

for (const packageDir of npmReleasePackages) {
  const manifest = readManifest(packageDir);
  if (!manifest.scripts?.build) {
    continue;
  }

  console.log(`building ${manifest.name}`);
  execFileSync('yarn', ['workspace', manifest.name, 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
