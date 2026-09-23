const fs = require('fs');
const path = require('path');

function loadLocalEnv(root) {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  });
}

function requireHttpUrl(name, { originOnly = false } = {}) {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is required. Configure it in the root .env file.`);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid absolute HTTP(S) ${originOnly ? 'origin' : 'URL'}.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash || (originOnly && (url.search || url.pathname !== '/'))) {
    throw new Error(`${name} must be a valid absolute HTTP(S) ${originOnly ? 'origin' : 'URL'}.`);
  }
}

loadLocalEnv(path.resolve(__dirname, '..'));
requireHttpUrl('REACT_APP_API_BASE_URL');
requireHttpUrl('REACT_APP_PUBLIC_SITE_URL', { originOnly: true });
