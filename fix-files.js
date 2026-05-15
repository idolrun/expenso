const fs = require('fs');

function cleanActionFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Strip anything relating to canX(role)
  code = code.replace(/if\s*\(!can[A-Za-z]+\(.*\)\)\s*\{\s*return\s*\{[^}]+\};\s*\}/g, '');
  code = code.replace(/if\s*\(!can[A-Za-z]+\(.*\)\)\s*\{[\s\S]*?\n\s*\}/g, '');
  
  // also role parameter no longer needed for action handlers
  // remove role from auth check if present
  code = code.replace(/const role = parseUserRole[^\n]+\n/g, '');

  fs.writeFileSync(path, code);
}

cleanActionFile('features/credentials/actions/credential-actions.ts');
cleanActionFile('features/expenses/actions/expense-actions.ts');
