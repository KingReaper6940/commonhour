import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(path);
    response.setHeader('Content-Type', { '.html':'text/html', '.css':'text/css', '.mjs':'text/javascript' }[extname(path)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('Commonhour preview: http://127.0.0.1:4174'));

