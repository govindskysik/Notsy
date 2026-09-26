// Static checks for moves/renames; no database or AI credentials required.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const failures = [];

function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'uploads'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : /\.(js|jsx)$/.test(file) ? [file] : [];
  });
}

for (const directory of ['Frontend/src', 'Backend']) {
  for (const file of sources(path.join(root, directory))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/(?:from\s*|import\s*|require\(\s*)['"](\.[^'"]+)['"]/g)) {
      const base = path.resolve(path.dirname(file), match[1]);
      if (![base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js'), path.join(base, 'index.jsx')]
        .some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) {
        failures.push(`${path.relative(root, file)}: missing import ${match[1]}`);
      }
    }
    if (directory === 'Backend') {
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      if (result.status !== 0) failures.push(result.stderr || `Syntax check failed: ${file}`);
    }
  }
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const match of readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
  if (!/^https?:/.test(match[1]) && !fs.existsSync(path.join(root, match[1]))) {
    failures.push(`README screenshot missing: ${match[1]}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Local imports, backend syntax, and README screenshots passed.');
}
