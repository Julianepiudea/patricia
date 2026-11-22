// Service worker de PatricIA: precarga toda la app para uso sin conexión.
// Al publicar cambios, incremente VERSION para que los dispositivos descarguen la nueva versión.
const VERSION = "patricia-v1.2.0";
const ARCHIVOS = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/app.js", "js/buscador.js", "js/calculos.js", "js/checklist.js", "js/datos.js", "js/definiciones.js", "js/estadistica.js", "js/guias.js", "js/formato.js",
  "vendor/chart.umd.min.js", "vendor/lucide.min.js", "vendor/marked.min.js", "vendor/xlsx.full.min.js",
  "fuentes/inter-400.woff2", "fuentes/inter-500.woff2", "fuentes/inter-600.woff2", "fuentes/sora-600.woff2", "fuentes/sora-700.woff2",
  "iconos/icono.svg", "iconos/emblema.svg", "iconos/labmedico.png", "iconos/icono-180.png", "iconos/icono-192.png", "iconos/icono-512.png", "iconos/icono-maskable-512.png",
  "contenido/preguntas-frecuentes.md", "contenido/glosario.md", "contenido/incertidumbre-iso-20914.md", "contenido/control-calidad-interno.md",
  "contenido/especificaciones-desempeno.md", "contenido/verificacion-validacion-clinica.md", "contenido/trazabilidad-eqa.md",
  "contenido/sistema-gestion-iso-15189.md", "contenido/mapa-normativo.md", "contenido/contexto-colombia.md", "contenido/guia-excel.md",
  "contenido/plantillas/presupuesto-incertidumbre.md", "contenido/plantillas/plan-verificacion-metodo.md", "contenido/plantillas/plan-control-calidad.md",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero caché; en segundo plano actualiza el recurso si hay red (stale-while-revalidate)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const enCache = await cache.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then((r) => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => null);
    return enCache || (await red) || (e.request.mode === "navigate" ? cache.match("index.html") : Response.error());
  }));
});
