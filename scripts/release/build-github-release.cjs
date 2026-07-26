const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { npmReleasePackages } = require('./release-packages.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');
const requestedRefArg = process.argv.find((arg) => arg.startsWith('--ref='));
const releaseRef = requestedRefArg ? requestedRefArg.slice('--ref='.length) : 'HEAD';
const previousRef = `${releaseRef}^`;

function readJsonAtGitRef(ref, filePath) {
  const content = execFileSync('git', ['show', `${ref}:${filePath}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(content);
}

function readCurrentJson(filePath) {
  if (releaseRef === 'HEAD') {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, filePath), 'utf8'));
  }
  return readJsonAtGitRef(releaseRef, filePath);
}

function getChangedPackages() {
  const changes = [];

  for (const packageDir of npmReleasePackages) {
    const packageJsonPath = `${packageDir}/package.json`;
    const currentPackage = readCurrentJson(packageJsonPath);
    const previousPackage = readJsonAtGitRef(previousRef, packageJsonPath);

    if (currentPackage.version === previousPackage.version) {
      continue;
    }

    changes.push({
      name: currentPackage.name,
      version: currentPackage.version,
      packageDir,
      tagName: `${currentPackage.name}@${currentPackage.version}`,
    });
  }

  return changes;
}

function getReleaseCommitSha() {
  return execFileSync('git', ['rev-parse', releaseRef], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function getReleaseCommitDate() {
  return execFileSync('git', ['show', '-s', '--format=%cs', releaseRef], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function buildReleaseBody(changes) {
  const lines = [];
  lines.push('## Published packages');
  lines.push('');
  for (const change of changes) {
    lines.push(`- \`${change.name}@${change.version}\``);
  }
  return lines.join('\n').trim();
}

const changes = getChangedPackages();
const releaseCommitSha = getReleaseCommitSha();
const releaseCommitDate = getReleaseCommitDate();
const shortSha = releaseCommitSha.slice(0, 7);

const releaseData = {
  tagName: `release-${shortSha}`,
  targetCommitish: releaseCommitSha,
  name: `LitSX URQL release ${releaseCommitDate}`,
  releaseDate: releaseCommitDate,
  body: buildReleaseBody(changes),
  commitSha: releaseCommitSha,
  packages: changes.map(({ name, version, packageDir, tagName }) => ({
    name,
    version,
    packageDir,
    tagName,
  })),
};

process.stdout.write(`${JSON.stringify(releaseData, null, 2)}\n`);
