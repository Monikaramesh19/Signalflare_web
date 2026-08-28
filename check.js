const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
const files = walk('client/src');
files.forEach(f => {
  if (!f.endsWith('.tsx') && !f.endsWith('.ts')) return;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/(?:import|export).*?from\s+['"](\.[^'"]+)['"]/g);
  if (matches) {
    matches.forEach(match => {
      const p = match.match(/['"]([^'"]+)['"]/)[1];
      const dir = path.dirname(f);
      let res = '';
      ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].forEach(ext => {
        if (res) return;
        const testPath = path.resolve(dir, p + ext);
        if (fs.existsSync(testPath)) {
          const basename = path.basename(testPath);
          const readdir = fs.readdirSync(path.dirname(testPath));
          if (!readdir.includes(basename)) {
            res = 'MISMATCH: ' + p + ' actually ' + basename;
          }
        }
      });
      if (res) console.log('File:', f, '\nIssue:', res, '\n');
    });
  }
});
console.log('Strict Case Match Check Complete.');
