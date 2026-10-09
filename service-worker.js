/* TradeMaster Pro PWA · v1.0.0 */
const VERSION = 'trademaster-pro-v1.0.0';
const ASSETS = [
  './','./index.html','./styles.css','./trade-math.js','./app.js','./manifest.json',
  './icons/ui-icons.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trademaster-pro-')&&k!==VERSION).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  // Consultar GitHub Pages cuando hay conexión para obtener los cambios
  // aunque el desarrollador no modifique VERSION. Sin red, usar archivos locales.
  event.respondWith((async()=>{
    try {
      const response=await fetch(req,{cache:'no-store'});
      if(response.ok && new URL(req.url).pathname.startsWith(new URL(self.registration.scope).pathname)) {
        const cache=await caches.open(VERSION);
        await cache.put(req,response.clone());
      }
      return response;
    }catch(_){
      return await caches.match(req)|| (req.mode==='navigate'?await caches.match('./index.html'):undefined) || Response.error();
    }
  })());
});
