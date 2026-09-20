import fs from 'node:fs/promises';
import path from 'node:path';

const tokensDir = path.resolve(import.meta.dirname, '../src/tokens');
const cardsFile = path.resolve(import.meta.dirname, '../src/components/home-cards/cards.json');
const logosDir = path.resolve(import.meta.dirname, '../src/images/logos');

const MAX_TOKENS_BODY = 200 * 1024;
const MAX_CARDS_BODY = 3 * 1024 * 1024;
const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;
const LOGO_EXTENSIONS = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > max) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

// Loaded through Vite on every request so edits to the schema or generators apply without restarting Storybook.
function loadFresh(server, file) {
  return server.ssrLoadModule(file);
}

function postRoute(server, route, maxBody, handler) {
  server.middlewares.use(route, async (req, res) => {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) {
      return send(res, 403, { error: 'Cross-origin request rejected' });
    }

    try {
      send(res, 200, await handler(JSON.parse(await readBody(req, maxBody)), server));
    } catch (error) {
      send(res, 400, { error: error.message });
    }
  });
}

async function saveTokens({ category, data }, server) {
  const { categories, generateCss } = await loadFresh(server, '/src/tokens/generate.js');
  const css = generateCss(category, data);
  const target = categories[category];
  await fs.writeFile(path.join(tokensDir, target.json), JSON.stringify(data, null, 2) + '\n');
  await fs.writeFile(path.join(tokensDir, target.css), css);
  return { ok: true };
}

async function writeLogo(cardId, dataUrl) {
  const match = /^data:([a-z+/]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? '');
  const extension = match && LOGO_EXTENSIONS[match[1]];
  if (!extension) throw new Error('Logo must be an SVG, PNG, JPG or WebP image');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_LOGO_BYTES) throw new Error('Logo is larger than 1.5 MB');

  const fileName = `${cardId.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}-logo.${extension}`;
  await fs.mkdir(logosDir, { recursive: true });
  await fs.writeFile(path.join(logosDir, fileName), bytes);
  return fileName;
}

async function saveCard({ cardId, config, logoUpload }, server) {
  const { validateCard } = await loadFresh(server, '/src/components/home-cards/cardSchema.js');
  const cards = JSON.parse(await fs.readFile(cardsFile, 'utf8'));
  if (!Object.hasOwn(cards, cardId)) throw new Error(`Unknown card "${cardId}"`);

  const clean = validateCard(config);
  const dropped = Object.keys(config).filter((key) => !(key in clean));
  if (dropped.length) throw new Error(`Unknown setting(s) would be lost: ${dropped.join(', ')}`);
  if (logoUpload) {
    clean.logo = await writeLogo(cardId, logoUpload.dataUrl);
  } else if (clean.logo) {
    await fs.access(path.join(logosDir, clean.logo)).catch(() => {
      throw new Error(`Logo file "${clean.logo}" does not exist`);
    });
  }

  cards[cardId] = clean;
  await fs.writeFile(cardsFile, JSON.stringify(cards, null, 2) + '\n');
  return { ok: true, config: clean };
}

// Dev-only: lets the Storybook setup pages write token files and card configs into the project.
export default function tokenSavePlugin() {
  return {
    name: 'token-save',
    apply: 'serve',
    configureServer(server) {
      postRoute(server, '/__tokens/save', MAX_TOKENS_BODY, saveTokens);
      postRoute(server, '/__cards/save', MAX_CARDS_BODY, saveCard);
    },
  };
}
