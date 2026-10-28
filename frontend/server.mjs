import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number.parseInt(process.env.PORT || '8080', 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
try { await stat(join(root, 'index.html')); }
catch { throw new Error('dist/index.html absent : configurer BP_NODE_RUN_SCRIPTS=build'); }

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  const send = (code, msg) => {
    res.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff'});
    res.end(msg);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return send(400, 'Bad path'); }
  if (pathname === '/health') return send(200, 'FRONT_CNB_OK');
  if (pathname.includes('\0') || pathname.includes('\\')) return send(400, 'Bad path');
  const requestPath = resolve(root, `.${pathname}`);
  if (requestPath !== root && !requestPath.startsWith(root + sep)) return send(403, 'Forbidden');
  let target = requestPath;
  try { if (!(await stat(target)).isFile()) target = join(root, 'index.html'); }
  catch { target = pathname.includes('.') ? '' : join(root, 'index.html'); }
  if (!target) return send(404, 'Not found');
  try {
    const bytes = await readFile(target);
    res.writeHead(200, {
      'Content-Type': mime[extname(target)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=300',
    });
    if (req.method === 'HEAD') res.end(); else res.end(bytes);
  } catch { send(500, 'Internal error'); }
});
server.listen(port, '0.0.0.0', () => console.log(`CNB FRONT listening on ${port}`));
