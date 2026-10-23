const CACHE='ultimate-clock-offline-v51';
const FILES=['./','./index.html','./ultimate-clock.html','./ultimate-clock.css','./clock-engine.js','./tokens.css','./i18n.js','./alerts.js','./sheet-export.js','./fixture.js','./tournament.js','./xlsx.js','./tournament-sheet.js','./fixture-view.js','./vivo.html','./vivo.js','./local-store.js','./session.js','./sync.js','./live-merge.js','./changelog.js','./manual/','./ultimate-clock.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
/* cache:'reload' skips the HTTP cache so a new version never stores stale files. */
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
/* Al activarse borra las cachés de versiones anteriores. Las páginas de la v48 o anteriores no saben recargarse solas
   (eso llegó con la v49): a esas se las recarga desde acá, una sola vez, para que no queden con la versión vieja. */
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const old=(await caches.keys()).filter(key=>key.startsWith('ultimate-clock-offline-')&&key!==CACHE);
  const legacy=old.some(key=>Number(key.split('-v')[1])<49);
  await Promise.all(old.map(key=>caches.delete(key)));
  await self.clients.claim();
  if(legacy)for(const client of await self.clients.matchAll({type:'window'}))client.navigate(client.url).catch(()=>{});
})()));
/* Cache first, refreshed in the background: the board opens at once even with a weak signal at the field.
   Each release changes CACHE, so the new worker installs every file together and the next load gets them all. */
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  /* La API nunca se sirve de la caché: sin esto, las bajadas de sincronización devolverían siempre la primera respuesta. */
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/')||url.pathname.includes('/solicitarpro'))return; /* el formulario del Modo Pro necesita red y es otra página: sin esto la caché lo reemplazaría por el tablero */
  const network=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;});
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(hit=>hit||(request.mode==='navigate'?caches.match('./index.html'):undefined)).then(hit=>{
    if(!hit)return network;
    event.waitUntil(network.catch(()=>{}));
    return hit;
  }));
});
