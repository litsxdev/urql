const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { npmReleasePackages } = require('./release-packages.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');

function readJsonAtGitRef(ref, filePath) {
  const content = execFileSync('git', ['show', `${ref}:${filePath}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(content);
}

function readCurrentJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, filePath), 'utf8'));
}

function tagExists(tagName) {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tagName}`], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function getVersionChanges() {
  const changes = [];

  for (const packageDir of npmReleasePackages) {
    const packageJsonPath = `${packageDir}/package.json`;
    const currentPackage = readCurrentJson(packageJsonPath);
    const previousPackage = readJsonAtGitRef('HEAD^', packageJsonPath);

    if (currentPackage.version === previousPackage.version) {
      continue;
    }

    changes.push({
      name: currentPackage.name,
      version: currentPackage.version,
    });
  }

  return changes;
}

const changes = getVersionChanges();

for (const { name, version } of changes) {
  const tagName = `${name}@${version}`;
  if (tagExists(tagName)) {
    continue;
  }

  execFileSync('git', ['tag', '-a', tagName, '-m', tagName], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  console.log(tagName);
}
