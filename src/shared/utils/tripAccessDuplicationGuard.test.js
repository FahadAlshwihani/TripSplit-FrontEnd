import fs from 'fs';
import path from 'path';

/*
  A light structural guard, not a brittle text-matching one: every
  frontend surface that touches join-policy state must IMPORT the
  canonical shared helpers (deriveTripAccessState/nextJoinPolicy from
  tripAccess.js, tripJoinUrl from shareLinks.js) rather than deriving
  Governance's inviteLinkEnabled/approvalRequired concepts -- or
  building a second "/trips/join?code=" string -- inline a second
  time. This only checks for the import statement's presence (a
  structural fact that survives refactors/formatting), never
  implementation details.
*/
const read = (relPath) => fs.readFileSync(path.join(__dirname, '..', '..', relPath), 'utf8');

const CONSUMERS = [
  'features/governance/components/AccessSettingsCard.jsx',
  'features/trips/components/SettingsAccessSecurity.jsx',
];

test('every Settings/Governance access-control surface imports the canonical tripAccess helpers, never its own inline mapping', () => {
  const offenders = CONSUMERS.filter((relPath) => {
    const content = read(relPath);
    return !/from ['"].*shared\/utils\/(tripAccess|shareLinks)['"]/.test(content);
  });
  expect(offenders).toEqual([]);
});

test('AccessSettingsCard specifically imports deriveTripAccessState/nextJoinPolicy -- never re-deriving inviteLinkEnabled/approvalRequired inline', () => {
  const content = read('features/governance/components/AccessSettingsCard.jsx');
  expect(content).toMatch(/import\s*\{[^}]*deriveTripAccessState[^}]*\}\s*from\s*['"].*tripAccess['"]/);
  // The old inline derivation this replaced -- must never come back.
  expect(content).not.toMatch(/trip\.join_policy\s*!==\s*['"]invite_only['"]/);
  expect(content).not.toMatch(/trip\.join_policy\s*===\s*['"]approval_required['"]/);
});

test('no source file outside tripAccess.js itself builds a second "/trips/join?code=" string', () => {
  const walk = (dir, files = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, files);
      else if (/\.jsx?$/.test(entry.name) && !entry.name.endsWith('.test.js') && !entry.name.endsWith('.test.jsx')) files.push(full);
    }
    return files;
  };
  const srcRoot = path.join(__dirname, '..', '..');
  const offenders = walk(srcRoot).filter((file) => {
    if (file.endsWith(path.join('shared', 'utils', 'shareLinks.js'))) return false;
    return fs.readFileSync(file, 'utf8').includes('/trips/join?code=');
  });
  expect(offenders).toEqual([]);
});
