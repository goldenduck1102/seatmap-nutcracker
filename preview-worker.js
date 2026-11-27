const base = new URL(self.registration.scope);
const asset = path => {
  const url = new URL(path, base);
  url.searchParams.set('v', '20261127-voucher-popup');
  return fetch(url);
};
const types = asset('types.json').then(response => response.json());
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function preview(request, url) {
  if (request.method === 'POST' && url.pathname === '/api/seat-holding/seat') {
    return Response.json({seatHoldingCode:'github-pages-preview', expireTime:new Date(Date.now()+900000).toISOString()});
  }
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
  if (request.mode === 'navigate' && url.pathname === base.pathname) {
    const snapshot = await asset('snapshot.txt');
    return new Response(snapshot.body,{headers:{
      'Content-Type':'text/html; charset=utf-8',
      'Content-Security-Policy':"connect-src 'self' https://96gwmt9ymticran5.public.blob.vercel-storage.com; form-action 'none'; frame-src 'none'; worker-src 'self' blob:"
    }});
  }
  const image = url.pathname === '/_next/image' ? url.searchParams.get('url') : url.pathname;
  if (image && /^\/catalogue\/[\w.-]+$/.test(image)) return asset(image.slice(1));
  if (url.pathname === '/catalogue.css') return asset('catalogue.css');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url.pathname+url.search));
  const hash = Array.from(new Uint8Array(bytes), byte=>byte.toString(16).padStart(2,'0')).join('');
  const type = (await types)[hash];
  if (!type) return new Response(null,{status:404});
  const file = await asset('static/'+hash);
  return new Response(file.body,{status:file.status,headers:{'Content-Type':type}});
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === base.origin) event.respondWith(preview(event.request,url));
});
