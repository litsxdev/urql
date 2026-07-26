const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { npmReleasePackages } = require('./release-packages.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');
const artifactsRoot = path.join(repoRoot, '.release-artifacts');
const npmArtifactsRoot = path.join(artifactsRoot, 'npm');

fs.rmSync(artifactsRoot, { recursive: true, force: true });
fs.mkdirSync(npmArtifactsRoot, { recursive: true });

const npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urql-npm-pack-cache-'));

for (const packageDir of npmReleasePackages) {
  const packageRoot = path.join(repoRoot, packageDir);
  const output = execFileSync(
    'npm',
    ['pack', '--pack-destination', npmArtifactsRoot],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: npmCacheDir,
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    }
  ).trim();

  console.log(`${packageDir}: ${output}`);
}

console.log(`release artifacts written to ${npmArtifactsRoot}`);
