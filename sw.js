const CACHE='ultimate-clock-offline-v40';
const FILES=['./','./index.html','./ultimate-clock.html','./ultimate-clock.css','./clock-engine.js','./tokens.css','./i18n.js','./alerts.js','./sheet-export.js','./tournament.js','./changelog.js','./ultimate-clock.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
/* cache:'reload' skips the HTTP cache so a new version never stores stale files. */
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ultimate-clock-offline-')&&key!==CACHE).map(key=>caches.delete(key))))])));
/* Cache first, refreshed in the background: the board opens at once even with a weak signal at the field.
   Each release changes CACHE, so the new worker installs every file together and the next load gets them all. */
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  const network=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;});
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(hit=>hit||(request.mode==='navigate'?caches.match('./index.html'):undefined)).then(hit=>{
    if(!hit)return network;
    event.waitUntil(network.catch(()=>{}));
    return hit;
  }));
});
