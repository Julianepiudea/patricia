// PatricIA — interfaz. Vanilla JS, enrutado por hash, funciona sin conexión (service worker).
import { Buscador, DOCUMENTOS, normalizar } from "./buscador.js";
import { GUIAS } from "./guias.js";
import { CHECKLIST } from "./checklist.js";
import { CALCULADORAS } from "./definiciones.js";
import { leerArchivo, parsearTexto, autoMapear, aplicarMapa } from "./datos.js";
import { AVISO } from "./calculos.js";
import { analizarLibro, responderArchivo, sugerenciasArchivo, guiaExcel, resumenTexto } from "./formato.js";

const VERSION = "1.2.0";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const vista = $("#vista");
const iconos = () => window.lucide && window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
const fmtNum = (x) => (typeof x === "number" ? x.toLocaleString("es-CO", { maximumFractionDigits: 6 }) : x ?? "—");

// ------------------------------------------------------------ almacenamiento seguro
const guardado = {
  leer(k, d) { try { const v = localStorage.getItem("patricia." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  escribir(k, v) { try { localStorage.setItem("patricia." + k, JSON.stringify(v)); } catch { /* modo privado */ } },
};
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("ver"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("ver"), 2400); }

// ------------------------------------------------------------ navegación
const NAV = [
  ["inicio", "Inicio", "sparkles"], ["preguntar", "Preguntar", "message-circle-question"], ["guias", "Guías", "compass"],
  ["calculadoras", "Calculadoras", "calculator"], ["formato", "Revisar mi Excel", "file-search"], ["checklist", "Autoevaluación 15189", "list-checks"], ["biblioteca", "Biblioteca", "library"],
  ["glosario", "Glosario", "book-a"], ["acerca", "Acerca e instalación", "info"],
];
const TABS = [["inicio", "Inicio", "sparkles"], ["preguntar", "Preguntar", "message-circle-question"], ["guias", "Guías", "compass"], ["calculadoras", "Calcular", "calculator"], ["mas", "Más", "layout-grid"]];
$("#nav").innerHTML = NAV.map(([id, t, ic]) => `<a href="#/${id}" data-ruta="${id}"><i data-lucide="${ic}"></i>${t}</a>`).join("");
$("#tabs").innerHTML = TABS.map(([id, t, ic]) => `<a href="#/${id}" data-ruta="${id}"><i data-lucide="${ic}"></i>${t}</a>`).join("");

// ------------------------------------------------------------ conocimiento
const buscador = new Buscador();
const docs = new Map(); // archivo -> md
const plantillas = [["presupuesto-incertidumbre.md", "Presupuesto de incertidumbre"], ["plan-verificacion-metodo.md", "Plan y reporte de verificación de método"], ["plan-control-calidad.md", "Plan de control interno de la calidad"]];
const listo = (async () => {
  await Promise.all(DOCUMENTOS.map(async ([f, t]) => {
    try { const md = await (await fetch("contenido/" + f)).text(); docs.set(f, md); buscador.agregarDocumento(f, t, md); } catch (e) { console.warn("No se pudo cargar", f, e); }
  }));
  buscador.construir();
})();

// ------------------------------------------------------------ Markdown
const SCRIPT_A_CALC = { "incertidumbre_20914.py": "mu", "sigma_cic.py": "sigma", "westgard.py": "westgard", "verificacion_ep15.py": "ep15", "lob_lod_ep17.py": "ep17", "intervalos_ep28.py": "ep28", "especificaciones_vb.py": "vb", "compare_methods.py": "comparacion" };
const nombreCalc = (id) => CALCULADORAS.find((c) => c.id === id)?.corto || id;
function prepararMd(md) {
  return md
    .replace(/```[a-z]*\n[\s\S]*?```/g, (b) => (/(py -3|python|PYTHON)/.test(b) ? "" : b))
    .replace(/`([^`\n]*(?:\.py|modulos\/|references\/|plantillas\/|scripts\/)[^`\n]*)`/g, (m, p) => {
      const base = p.split("/").pop().split(" ")[0];
      if (SCRIPT_A_CALC[base]) return `[${nombreCalc(SCRIPT_A_CALC[base])}](#/calc/${SCRIPT_A_CALC[base]})`;
      if (/^references\/[\w-]+\.md$/.test(p)) return `[${DOCUMENTOS.find(([f]) => f === base)?.[1] || base}](#/doc/${base.replace(".md", "")})`;
      if (/^plantillas\/[\w-]+\.md$/.test(p)) return `[plantilla](#/plantilla/${base.replace(".md", "")})`;
      if (/plantillas\/$/.test(p)) return `[plantillas](#/biblioteca)`;
      return "herramienta de la versión de escritorio";
    });
}
function md(texto) {
  const html = window.marked ? window.marked.parse(prepararMd(texto), { mangle: false, headerIds: false }) : `<pre>${esc(texto)}</pre>`;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  $$("table", tmp).forEach((t) => { const w = document.createElement("div"); w.className = "tabla-env"; t.replaceWith(w); w.appendChild(t); });
  $$("a", tmp).forEach((a) => { if (/^https?:/.test(a.getAttribute("href") || "")) { a.target = "_blank"; a.rel = "noopener"; } if ((a.getAttribute("href") || "").startsWith("#/calc/")) a.classList.add("calc-link"); });
  // Lista blanca de etiquetas y atributos (el contenido puede venir de archivos del usuario)
  const PERMITIDAS = new Set(["P", "A", "STRONG", "EM", "B", "I", "CODE", "PRE", "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "DIV", "SPAN", "BR", "HR", "DEL"]);
  $$("*", tmp).forEach((el) => {
    if (!PERMITIDAS.has(el.tagName)) { el.replaceWith(document.createTextNode(el.textContent)); return; }
    for (const at of [...el.attributes]) {
      const n = at.name.toLowerCase();
      if (n === "href" ? !/^(#|https?:)/i.test(at.value) : !["class", "id", "target", "rel", "align", "colspan", "rowspan"].includes(n)) el.removeAttribute(at.name);
    }
  });
  return tmp.innerHTML;
}
const resaltar = (texto, q) => {
  let h = esc(texto);
  const ts = normalizar(q).split(" ").filter((w) => w.length > 3);
  for (const t of ts) h = h.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split("").map((c) => `${c}[\\u0300-\\u036f]?`).join("")}\\w*)`, "gi"), "<mark>$1</mark>");
  return h;
};

// ------------------------------------------------------------ voz
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function microfono(input, alTerminar) {
  if (!SR) return "";
  return `<button class="btn icono fantasma mic" type="button" aria-label="Preguntar por voz"><i data-lucide="mic"></i></button>`;
}
function activarMic(cont, input, alTerminar) {
  const b = $(".mic", cont);
  if (!b || !SR) return;
  b.addEventListener("click", () => {
    const r = new SR(); r.lang = "es-CO"; r.interimResults = true; r.maxAlternatives = 1;
    $$(".orbe").forEach((o) => o.classList.add("escuchando")); b.classList.add("primario");
    r.onresult = (e) => { input.value = [...e.results].map((x) => x[0].transcript).join(" "); };
    r.onend = () => { $$(".orbe").forEach((o) => o.classList.remove("escuchando")); b.classList.remove("primario"); if (input.value.trim()) alTerminar(input.value.trim()); };
    r.onerror = () => toast("No se pudo usar el micrófono (requiere permiso y conexión en algunos navegadores).");
    r.start();
  });
}
function hablar(texto) {
  if (!("speechSynthesis" in window)) return toast("Este navegador no puede leer en voz alta.");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto.replace(/[#*_`>|]/g, " ").replace(/\s+/g, " ").slice(0, 3000));
  u.lang = "es-ES";
  const voz = speechSynthesis.getVoices().find((v) => /^es(-|_)(CO|MX|US|419)/i.test(v.lang)) || speechSynthesis.getVoices().find((v) => /^es/i.test(v.lang));
  if (voz) u.voice = voz;
  speechSynthesis.speak(u);
}

// ------------------------------------------------------------ enrutador
const RUTAS = { inicio: vInicio, preguntar: vPreguntar, guias: vGuias, guia: vGuia, calculadoras: vCalculadoras, calc: vCalc, formato: vFormato, checklist: vChecklist, biblioteca: vBiblioteca, doc: vDoc, plantilla: vPlantilla, glosario: vGlosario, acerca: vAcerca, mas: vMas };
let graficos = [];
async function enrutar() {
  const [camino, qs] = (location.hash.replace(/^#\/?/, "") || "inicio").split("?");
  const [ruta, ...resto] = camino.split("/");
  const arg = resto.join("/");
  const params = new URLSearchParams(qs || "");
  graficos.forEach((g) => g.destroy()); graficos = [];
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const fn = RUTAS[ruta] || vInicio;
  $$("[data-ruta]").forEach((a) => a.classList.toggle("activo", a.dataset.ruta === ruta || (ruta === "calc" && a.dataset.ruta === "calculadoras") || (ruta === "guia" && a.dataset.ruta === "guias") || (["doc", "plantilla"].includes(ruta) && a.dataset.ruta === "biblioteca")));
  await fn(decodeURIComponent(arg || ""), params);
  iconos();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}
window.addEventListener("hashchange", enrutar);

// ------------------------------------------------------------ Inicio
const SUGERENCIAS = ["¿Cómo calculo la incertidumbre de medida?", "¿Qué hago si se rechaza el control?", "Diferencia entre verificar y validar", "¿Qué es la conmutabilidad?", "¿Cuántas muestras para comparar métodos?", "¿Puedo usar la media del inserto del control?"];
function vInicio() {
  const recientes = guardado.leer("chat", []).slice(-4).reverse();
  const terminos = (docs.get("glosario.md") || "").split(/\n### /).slice(1);
  const dia = Math.floor(Date.now() / 864e5);
  const td = terminos.length ? terminos[dia % terminos.length] : "";
  const [tTit, ...tCuerpo] = td.split("\n");
  const progreso = progresoChecklist();
  const destacadas = ["mu", "sigma", "westgard", "comparacion"].map((id) => CALCULADORAS.find((c) => c.id === id));
  const hora = new Date().getHours(), saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  vista.innerHTML = `
    <section class="heroe">
      <span class="orbe grande" aria-hidden="true"></span>
      <div>
        <div class="cejilla"><a class="marca-lab" href="#/acerca" title="Labmédico · Laboratorio Médico de Referencia"><img src="iconos/labmedico.png" alt="Labmédico"></a><span class="etiqueta">${saludo}</span></div>
        <h1>Soy <span>PatricIA</span>, tu asistente de metrología y calidad clínica.</h1>
        <p>Pregúntame sobre ISO 15189, incertidumbre, Westgard, verificación de métodos o normativa colombiana. Sube tus datos de control y te los analizo, sin que salgan de tu dispositivo.</p>
        <form class="buscador" id="f-inicio" role="search">
          <i data-lucide="search" class="lupa"></i>
          <input id="q-inicio" placeholder="Escribe tu pregunta…" aria-label="Pregunta" autocomplete="off">
          ${microfono()}
          <button class="btn primario" type="submit"><i data-lucide="arrow-up-right"></i><span>Preguntar</span></button>
        </form>
        <div class="chips" style="margin-top:14px">${SUGERENCIAS.slice(0, 4).map((s) => `<button class="chip" data-q="${esc(s)}"><i data-lucide="sparkle"></i>${esc(s)}</button>`).join("")}</div>
      </div>
    </section>
    <section class="bento">
      ${destacadas.map((c, i) => `<a class="tarjeta interactiva b-3" style="--i:${i}" href="#/calc/${c.id}"><div class="icono-caja"><i data-lucide="${c.icono}"></i></div><h3>${esc(c.nombre)}</h3><p>${esc(c.descripcion)}</p></a>`).join("")}
      <a class="tarjeta interactiva b-6" style="--i:4;display:flex;gap:16px;align-items:center" href="#/formato"><div class="icono-caja"><i data-lucide="file-search"></i></div><div><h3 style="margin-top:0">Revisar mi Excel de verificación</h3><p>Sube tu formato (p. ej. FO-LG-61): PatricIA recalcula todo, detecta errores en las fórmulas, responde preguntas sobre el ejercicio y te explica cómo hacerlo en Excel.</p></div></a>
      <a class="tarjeta interactiva b-2" style="--i:4" href="#/guias"><div class="icono-caja"><i data-lucide="compass"></i></div><h3>Guías paso a paso</h3><p>${Object.keys(GUIAS).length} árboles de decisión: rechazo de control, EEC insatisfactoria, verificar o validar…</p></a>
      <a class="tarjeta interactiva b-2" style="--i:5;display:flex;gap:16px;align-items:center" href="#/checklist"><span class="anillo" style="--p:${progreso.avance}" data-texto="${progreso.avance}%"></span><div><h3 style="margin-top:0">Autoevaluación ISO 15189</h3><p>${progreso.respondidos} de ${progreso.total} requisitos revisados.</p></div></a>
      <a class="tarjeta interactiva b-2 dato-dia" style="--i:6" href="#/glosario"><div class="etiqueta">Término del día</div><h3>${esc(tTit || "Glosario")}</h3><blockquote>${esc((tCuerpo.join(" ").trim() || "").slice(0, 150))}…</blockquote></a>
      ${recientes.length ? `<div class="tarjeta b-6" style="--i:7"><div class="etiqueta">Preguntas recientes</div><div class="chips" style="margin-top:10px">${recientes.map((q) => `<button class="chip" data-q="${esc(q)}"><i data-lucide="history"></i>${esc(q)}</button>`).join("")}</div></div>` : ""}
    </section>`;
  const ir = (q) => { if (q) location.hash = "#/preguntar?q=" + encodeURIComponent(q); };
  $("#f-inicio").addEventListener("submit", (e) => { e.preventDefault(); ir($("#q-inicio").value.trim()); });
  $$("[data-q]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.q)));
  activarMic(vista, $("#q-inicio"), ir);
}

// ------------------------------------------------------------ Preguntar (conversación)
const conversacion = [];
async function vPreguntar(_arg, params) {
  vista.innerHTML = `
    <div class="cabecera"><div><h1>Pregúntale a PatricIA</h1><p>Respuestas tomadas de su base de conocimiento experta, con la fuente y las herramientas relacionadas.</p></div>
      <button class="btn fantasma" id="limpiar"><i data-lucide="eraser"></i>Limpiar</button></div>
    <div class="conversacion" id="conv"></div>
    <form class="buscador entrada-chat" id="f-chat" role="search">
      <i data-lucide="message-circle-question" class="lupa"></i>
      <input id="q-chat" placeholder="Pregunta sobre incertidumbre, Westgard, EP15, ISO 15189…" aria-label="Pregunta" autocomplete="off">
      ${microfono()}
      <button class="btn primario" type="submit" aria-label="Enviar"><i data-lucide="send"></i></button>
    </form>`;
  await listo;
  const conv = $("#conv");
  if (!conversacion.length) conv.innerHTML = bienvenida();
  else conversacion.forEach((t) => conv.insertAdjacentHTML("beforeend", t.html));
  enlazarRespuestas(conv);
  const enviar = (q) => { if (!q) return; $("#q-chat").value = ""; preguntar(q, conv); };
  $("#f-chat").addEventListener("submit", (e) => { e.preventDefault(); enviar($("#q-chat").value.trim()); });
  $("#limpiar").addEventListener("click", () => { conversacion.length = 0; conv.innerHTML = bienvenida(); enlazarRespuestas(conv); iconos(); });
  activarMic(vista, $("#q-chat"), enviar);
  const q = params.get("q");
  if (q) { history.replaceState(null, "", "#/preguntar"); preguntar(q, conv); }
  $("#q-chat").focus({ preventScroll: true });
}
const bienvenida = () => `<div class="msg-patricia"><span class="orbe"></span><div class="tarjeta respuesta"><div class="md"><p><b>Hola.</b> Puedo explicarte conceptos, orientarte con la norma y llevarte a la calculadora o guía adecuada. Prueba con alguna de estas preguntas:</p></div><div class="chips">${SUGERENCIAS.map((s) => `<button class="chip" data-q="${esc(s)}"><i data-lucide="sparkle"></i>${esc(s)}</button>`).join("")}</div></div></div>`;

function preguntar(q, conv) {
  const h = guardado.leer("chat", []).filter((x) => x !== q); h.push(q); guardado.escribir("chat", h.slice(-30));
  if (conversacion.length === 0) conv.innerHTML = "";
  conv.insertAdjacentHTML("beforeend", `<div class="msg-usuario">${esc(q)}</div><div class="msg-patricia" id="pensando"><span class="orbe escuchando"></span><div class="tarjeta escribiendo" aria-label="PatricIA está pensando"><i></i><i></i><i></i></div></div>`);
  $("#pensando").scrollIntoView({ behavior: "smooth", block: "end" });
  setTimeout(() => {
    const tmp = document.createElement("div");
    tmp.innerHTML = respuestaHTML(q);
    const nodo = tmp.firstElementChild;
    $("#pensando")?.replaceWith(nodo);
    conversacion.push({ q, html: `<div class="msg-usuario">${esc(q)}</div>` + nodo.outerHTML });
    enlazarRespuestas(conv); iconos();
    nodo.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 420);
}

function respuestaHTML(q, seccionForzada = null) {
  const res = seccionForzada ? [seccionForzada, ...buscador.buscar(seccionForzada.titulo, 5).filter((r) => r.id !== seccionForzada.id)] : buscador.buscar(q, 6);
  const sug = buscador.sugerencias(q);
  if (!res.length) {
    return `<div class="msg-patricia"><span class="orbe"></span><div class="tarjeta respuesta"><div class="md"><p>No encontré una respuesta para <b>${esc(q)}</b> en mi base de conocimiento. Prueba con otras palabras o siglas (p. ej. <i>incertidumbre</i>, <i>EP15</i>, <i>Westgard</i>, <i>EEC</i>), o explora:</p></div>
      <div class="chips"><a class="chip" href="#/guias"><i data-lucide="compass"></i>Guías</a><a class="chip" href="#/calculadoras"><i data-lucide="calculator"></i>Calculadoras</a><a class="chip" href="#/glosario"><i data-lucide="book-a"></i>Glosario</a></div></div></div>`;
  }
  const top = res[0];
  let cuerpo = top.md;
  const largo = cuerpo.length > 3200;
  if (largo) cuerpo = cuerpo.slice(0, 3000).replace(/\n[^\n]*$/, "") + "\n\n…";
  const herramientas = [
    ...sug.calculadoras.map((c) => `<a class="chip" href="#/calc/${c.id}"><i data-lucide="calculator"></i>${esc(c.nombre)}</a>`),
    ...sug.guias.map((g) => `<a class="chip" href="#/guia/${g}"><i data-lucide="compass"></i>Guía: ${esc(GUIAS[g].titulo)}</a>`),
  ];
  const archivo = top.archivo.replace(".md", "");
  return `<div class="msg-patricia"><span class="orbe"></span><div class="tarjeta respuesta" data-texto="${esc(top.titulo + ". " + top.md)}">
    <div class="fuente"><i data-lucide="book-open" style="width:14px"></i>${esc(top.doc)}${top.ruta ? " › " + esc(top.ruta) : ""}</div>
    <h2>${esc(top.titulo.replace(/^\d+\.\s*/, ""))}</h2>
    <div class="md">${md(cuerpo)}</div>
    ${largo ? `<p><a href="#/doc/${archivo}">Leer la sección completa →</a></p>` : ""}
    ${herramientas.length ? `<div class="etiqueta" style="margin-top:14px">Herramientas para esto</div><div class="chips" style="margin-top:8px">${herramientas.join("")}</div>` : ""}
    ${res.length > 1 ? `<div class="etiqueta" style="margin-top:16px">También relevante</div><div class="relacionados">${res.slice(1, 5).map((r) => `<a class="relacionado" href="#" data-sec="${r.id}" data-q="${esc(q)}"><b>${esc(r.titulo)}</b><small>${esc(r.doc)} · ${resaltar(r.extracto, q)}</small></a>`).join("")}</div>` : ""}
    <div class="acciones"><button class="btn fantasma" data-acc="copiar"><i data-lucide="copy"></i>Copiar</button><button class="btn fantasma" data-acc="voz"><i data-lucide="volume-2"></i>Escuchar</button><a class="btn fantasma" href="#/doc/${archivo}"><i data-lucide="file-text"></i>Abrir documento</a></div>
  </div></div>`;
}
function enlazarRespuestas(conv) {
  $$("[data-q]", conv).forEach((b) => { if (b.dataset.sec) return; b.onclick = () => preguntar(b.dataset.q, conv); });
  $$("[data-sec]", conv).forEach((a) => a.onclick = (e) => {
    e.preventDefault();
    const s = buscador.secciones[Number(a.dataset.sec)];
    conv.insertAdjacentHTML("beforeend", `<div class="msg-usuario">${esc(s.titulo)}</div>` + respuestaHTML(a.dataset.q, s));
    conversacion.push({ q: s.titulo, html: `<div class="msg-usuario">${esc(s.titulo)}</div>` + conv.lastElementChild.outerHTML });
    enlazarRespuestas(conv); iconos(); conv.lastElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $$("[data-acc]", conv).forEach((b) => b.onclick = () => {
    const t = b.closest(".respuesta").dataset.texto;
    if (b.dataset.acc === "copiar") navigator.clipboard?.writeText(t).then(() => toast("Respuesta copiada"), () => toast("No se pudo copiar"));
    else hablar(t);
  });
}

// ------------------------------------------------------------ Guías
function vGuias() {
  vista.innerHTML = `<div class="cabecera"><div><h1>Guías paso a paso</h1><p>Responde unas preguntas y PatricIA te dice qué hacer, con qué documento y con qué herramienta.</p></div></div>
    <div class="rejilla">${Object.entries(GUIAS).map(([id, g], i) => `<a class="tarjeta interactiva tarjeta-calc" style="--i:${i}" href="#/guia/${id}"><div class="icono-caja"><i data-lucide="${g.icono}"></i></div><h3>${esc(g.titulo)}</h3><p>${esc(g.descripcion)}</p></a>`).join("")}</div>`;
}
function vGuia(id) {
  const g = GUIAS[id];
  if (!g) return vGuias();
  const rastro = [];
  const pintar = (nodoId) => {
    const n = g.nodos[nodoId];
    const pasos = rastro.length + 1;
    const cuerpo = n.resultado
      ? `<div class="tarjeta resultado-guia ${n.tipo}"><div class="etiqueta">Resultado</div><h2 style="margin-top:6px">${esc(n.titulo)}</h2><div class="md">${md(n.md)}</div>
          ${n.calcs?.length ? `<div class="etiqueta" style="margin-top:10px">Herramientas</div><div class="chips" style="margin-top:8px">${n.calcs.map((c) => `<a class="chip" href="#/calc/${c}"><i data-lucide="calculator"></i>${esc(nombreCalc(c))}</a>`).join("")}</div>` : ""}
          ${n.leer ? `<div class="chips" style="margin-top:10px"><a class="chip" href="#/preguntar?q=${encodeURIComponent(n.leer)}"><i data-lucide="book-open"></i>Profundizar en la base de conocimiento</a></div>` : ""}
          <div class="acciones"><button class="btn" id="reiniciar"><i data-lucide="rotate-ccw"></i>Empezar de nuevo</button><button class="btn fantasma" id="atras"><i data-lucide="undo-2"></i>Atrás</button><button class="btn fantasma" onclick="window.print()"><i data-lucide="printer"></i>Imprimir</button></div></div>`
      : `<div class="tarjeta pregunta"><div class="etiqueta">Paso ${pasos}</div><h2 style="margin-top:6px">${esc(n.pregunta)}</h2>${n.ayuda ? `<p class="sub">${esc(n.ayuda)}</p>` : ""}
          <div class="opciones">${n.opciones.map((o, i) => `<button class="opcion" data-ir="${o.ir}" data-t="${esc(o.texto)}" style="animation:entrar 400ms var(--ease-out) both;animation-delay:${i * 50}ms"><span>${esc(o.texto)}</span><i data-lucide="chevron-right"></i></button>`).join("")}</div>
          ${rastro.length ? `<div class="acciones"><button class="btn fantasma" id="atras"><i data-lucide="undo-2"></i>Atrás</button></div>` : ""}</div>`;
    vista.innerHTML = `<div class="guia"><div class="migas"><a href="#/guias">Guías</a><i data-lucide="chevron-right" style="width:14px"></i>${esc(g.titulo)}</div>
      <div class="cabecera"><div><h1>${esc(g.titulo)}</h1><p>${esc(g.descripcion)}</p></div></div>
      <div class="pasos">${Array.from({ length: Math.max(3, pasos) }, (_, i) => `<i class="${i < pasos ? "hecho" : ""}"></i>`).join("")}</div>
      ${cuerpo}
      ${rastro.length ? `<div class="rastro">${rastro.map((r) => `<span>✓ ${esc(r.t)}</span>`).join("")}</div>` : ""}
      <div class="solo-impresion aviso">${esc(AVISO)}</div></div>`;
    $$("[data-ir]").forEach((b) => b.onclick = () => { rastro.push({ nodo: nodoId, t: b.dataset.t }); pintar(b.dataset.ir); });
    $("#atras") && ($("#atras").onclick = () => { const r = rastro.pop(); pintar(r.nodo); });
    $("#reiniciar") && ($("#reiniciar").onclick = () => { rastro.length = 0; pintar(g.inicio); });
    iconos();
  };
  pintar(g.inicio);
}

// ------------------------------------------------------------ Calculadoras
function vCalculadoras() {
  vista.innerHTML = `<div class="cabecera"><div><h1>Calculadoras</h1><p>Carga un Excel o CSV, pega datos desde Excel o usa el ejemplo. Todo se calcula en tu dispositivo: tus datos no se envían a ningún servidor.</p></div></div>
    <div class="rejilla">${CALCULADORAS.map((c, i) => `<a class="tarjeta interactiva tarjeta-calc" style="--i:${i}" href="#/calc/${c.id}"><div class="icono-caja"><i data-lucide="${c.icono}"></i></div><h3>${esc(c.nombre)}</h3><p>${esc(c.descripcion)}</p></a>`).join("")}</div>`;
}

const estadoDatos = new Map(); // id calc -> { hojas, hoja, mapa, texto }
function vCalc(id) {
  const c = CALCULADORAS.find((x) => x.id === id);
  if (!c) return vCalculadoras();
  const form = guardado.leer("form." + id, {});
  const est = estadoDatos.get(id) || { hojas: null, hoja: 0, mapa: {}, texto: "" };
  estadoDatos.set(id, est);
  const valor = (f) => form[f.id] ?? f.valor ?? (f.tipo === "multi" ? [] : f.tipo === "check" ? false : "");
  const campoHTML = (f) => {
    const vis = f.siCheck ? `data-si-check="${f.siCheck}"` : f.siSelect ? `data-si-select="${f.siSelect.join("=")}"` : "";
    if (f.tipo === "check") return `<label class="check" ${vis}><input type="checkbox" name="${f.id}" ${valor(f) ? "checked" : ""}>${esc(f.etiqueta)}</label>`;
    if (f.tipo === "multi") return `<div class="campo" ${vis}><label>${esc(f.etiqueta)}</label><div class="multi">${f.opciones.map((o) => `<label><input type="checkbox" name="${f.id}" value="${o}" ${valor(f).includes(o) ? "checked" : ""}><span>${o}</span></label>`).join("")}</div></div>`;
    if (f.tipo === "select") return `<div class="campo" ${vis}><label for="c-${f.id}">${esc(f.etiqueta)}</label><select id="c-${f.id}" name="${f.id}">${f.opciones.map(([v, t]) => `<option value="${v}" ${String(valor(f)) === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>`;
    return `<div class="campo" ${vis}><label for="c-${f.id}">${esc(f.etiqueta)}</label><input id="c-${f.id}" name="${f.id}" ${f.tipo === "num" ? 'inputmode="decimal"' : ""} value="${esc(valor(f))}" placeholder="${esc(f.ph || "")}">${f.ayuda ? `<small>${esc(f.ayuda)}</small>` : ""}</div>`;
  };
  const conDatos = !c.sinDatos;
  vista.innerHTML = `
    <div class="migas"><a href="#/calculadoras">Calculadoras</a><i data-lucide="chevron-right" style="width:14px"></i>${esc(c.corto)}</div>
    <div class="cabecera"><div style="display:flex;gap:14px;align-items:center"><div class="icono-caja"><i data-lucide="${c.icono}"></i></div><div><h1>${esc(c.nombre)}</h1><p>${esc(c.descripcion)}</p></div></div></div>
    <div class="calc-layout">
      <form class="tarjeta panel-form" id="f-calc" autocomplete="off">
        ${conDatos ? `<div class="seccion-form">
          <div class="etiqueta">Datos ${c.obligatorioDatos ? "" : "(opcional)"}</div>
          <label class="zona" id="zona"><input type="file" id="archivo" accept=".csv,.txt,.xlsx,.xls,.xlsm,.ods" hidden>
            <i data-lucide="file-up"></i><b>Sube un Excel o CSV</b><small>o arrástralo aquí · columnas: ${c.columnas.map((k) => esc(k.etiqueta)).join(", ")}</small></label>
          <details ${est.texto ? "open" : ""}><summary class="sub" style="cursor:pointer;font-size:.88rem">Pegar datos desde Excel</summary>
            <textarea id="pegado" placeholder="${esc(c.columnas.map((k) => k.clave).join("\t"))}&#10;…" style="margin-top:8px">${esc(est.texto)}</textarea></details>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="ejemplo"><i data-lucide="flask-conical"></i>Cargar ejemplo</button><button type="button" class="btn fantasma" id="quitar"><i data-lucide="x"></i>Quitar datos</button></div>
          <div id="info-datos"></div>
        </div>` : ""}
        ${c.campos.length ? `<div class="seccion-form"><div class="etiqueta">Parámetros</div>${c.campos.map(campoHTML).join("")}</div>` : ""}
        <button class="btn primario" type="submit"><i data-lucide="play"></i>Calcular</button>
      </form>
      <section class="resultados" id="resultados"><div class="tarjeta vacio"><span class="orbe"></span><h3>Listo para calcular</h3><p>Completa los parámetros${conDatos ? " y carga tus datos (o el ejemplo)" : ""}, y pulsa <b>Calcular</b>.</p></div></section>
    </div>`;
  const f = $("#f-calc");
  const visibilidad = () => {
    $$("[data-si-check]", f).forEach((el) => el.classList.toggle("oculto", !f.elements[el.dataset.siCheck]?.checked));
    $$("[data-si-select]", f).forEach((el) => { const [k, v] = el.dataset.siSelect.split("="); el.classList.toggle("oculto", f.elements[k]?.value !== v); });
  };
  f.addEventListener("change", visibilidad); visibilidad();
  const leerForm = () => {
    const o = {};
    for (const campo of c.campos) {
      if (campo.tipo === "multi") o[campo.id] = $$(`input[name="${campo.id}"]:checked`, f).map((x) => x.value);
      else if (campo.tipo === "check") o[campo.id] = f.elements[campo.id].checked;
      else o[campo.id] = f.elements[campo.id].value.trim();
    }
    return o;
  };
  const filasMapeadas = () => (est.hojas ? aplicarMapa(est.hojas[est.hoja].filas, est.mapa, c.columnas) : []);
  const pintarInfo = () => {
    const info = $("#info-datos");
    if (!info) return;
    if (!est.hojas) { info.innerHTML = ""; return; }
    const hoja = est.hojas[est.hoja], filas = filasMapeadas();
    info.innerHTML = `
      ${est.hojas.length > 1 ? `<div class="campo"><label>Hoja</label><select id="hoja">${est.hojas.map((h, i) => `<option value="${i}" ${i === est.hoja ? "selected" : ""}>${esc(h.nombre)}</option>`).join("")}</select></div>` : ""}
      <div class="etiqueta" style="margin:4px 0 8px">Columnas (${hoja.filas.length} filas leídas · <span class="${filas.length ? "estado ok" : "estado mal"}">${filas.length} válidas</span>)</div>
      <div class="mapa">${c.columnas.map((k) => `<span>${esc(k.etiqueta)}${k.opcional ? " <small class='sub'>(opc.)</small>" : ""}</span><select data-col="${k.clave}"><option value="">— ninguna —</option>${hoja.columnas.map((col) => `<option ${est.mapa[k.clave] === col ? "selected" : ""}>${esc(col)}</option>`).join("")}</select>`).join("")}</div>
      ${filas.length ? `<div class="tabla-env vista-previa" style="margin-top:10px"><table><thead><tr>${c.columnas.filter((k) => est.mapa[k.clave]).map((k) => `<th>${esc(k.etiqueta)}</th>`).join("")}</tr></thead><tbody>${filas.slice(0, 6).map((r) => `<tr>${c.columnas.filter((k) => est.mapa[k.clave]).map((k) => `<td>${esc(fmtNum(r[k.clave]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}`;
    $("#hoja") && ($("#hoja").onchange = (e) => { est.hoja = Number(e.target.value); est.mapa = autoMapear(est.hojas[est.hoja].columnas, c.columnas); pintarInfo(); });
    $$("[data-col]", info).forEach((s) => s.onchange = () => { est.mapa[s.dataset.col] = s.value; pintarInfo(); });
  };
  const usarHojas = (hojas) => { est.hojas = hojas; est.hoja = 0; est.mapa = autoMapear(hojas[0].columnas, c.columnas); pintarInfo(); };
  const usarTexto = (t) => { est.texto = t; if (!t.trim()) { est.hojas = null; pintarInfo(); return; } try { usarHojas([{ nombre: "Datos pegados", ...parsearTexto(t) }]); } catch (e) { toast(e.message); } };
  if (conDatos) {
    const zona = $("#zona"), inp = $("#archivo");
    const cargar = async (file) => { try { usarHojas((await leerArchivo(file)).hojas); est.texto = ""; toast(`Archivo cargado: ${file.name}`); } catch (e) { toast("No se pudo leer el archivo: " + e.message); } };
    inp.onchange = () => inp.files[0] && cargar(inp.files[0]);
    zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("sobre"));
    zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("sobre"); e.dataTransfer.files[0] && cargar(e.dataTransfer.files[0]); });
    let tPeg; $("#pegado").addEventListener("input", (e) => { clearTimeout(tPeg); tPeg = setTimeout(() => usarTexto(e.target.value), 350); });
    $("#ejemplo").onclick = () => { if (!c.ejemplo) return; const t = c.ejemplo(); $("#pegado").value = t; $("#pegado").closest("details").open = true; usarTexto(t); toast("Ejemplo cargado: revisa el formato de las columnas"); };
    $("#quitar").onclick = () => { est.hojas = null; est.texto = ""; $("#pegado").value = ""; pintarInfo(); };
    pintarInfo();
  }
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const vals = leerForm();
    guardado.escribir("form." + id, vals);
    const filas = filasMapeadas();
    const out = $("#resultados");
    try {
      if (c.obligatorioDatos && !filas.length) throw new Error("Carga datos (archivo, pegado o ejemplo) con las columnas indicadas.");
      const r = c.ejecutar(vals, filas);
      pintarResultado(out, r, c);
      if (innerWidth < 960) out.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      out.innerHTML = `<div class="mensaje mal"><i data-lucide="circle-alert"></i><span>${esc(err.message)}</span></div>`;
      iconos();
    }
  });
}

const ICON_MSG = { ok: "circle-check", alerta: "triangle-alert", mal: "circle-x", info: "info" };
function pintarResultado(out, r, c) {
  graficos.forEach((g) => g.destroy()); graficos = [];
  const fecha = new Date().toLocaleString("es-CO");
  out.innerHTML = `
    <div class="solo-impresion"><img src="iconos/labmedico.png" alt="Labmédico" style="height:42px"><h2>PatricIA · ${esc(r.titulo)}</h2><p class="sub">Reporte generado el ${esc(fecha)} · versión ${VERSION}</p></div>
    <div class="tarjeta no-imprimir" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px"><h2 style="margin:0;font-size:1.1rem">${esc(r.titulo)}</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="imprimir"><i data-lucide="printer"></i>Imprimir / PDF</button><button class="btn" id="exportar"><i data-lucide="sheet"></i>Exportar CSV</button><button class="btn fantasma" id="copiar"><i data-lucide="copy"></i>Copiar resumen</button></div></div>
    ${r.kpis.length ? `<div class="kpis">${r.kpis.map((k, i) => `<div class="kpi ${k.estado || ""}" style="--i:${i}"><div class="etiqueta">${esc(k.etiqueta)}</div><div class="valor" ${k.contador && typeof k.valor === "number" ? `data-contar="${k.valor}"` : ""}>${esc(fmtNum(k.valor))}${k.unidad ? `<small>${esc(k.unidad)}</small>` : ""}</div>${k.nota ? `<div class="nota">${esc(k.nota)}</div>` : ""}</div>`).join("")}</div>` : ""}
    ${r.mensajes.length ? `<div style="display:grid;gap:8px">${r.mensajes.map((m) => `<div class="mensaje ${m.tipo}"><i data-lucide="${ICON_MSG[m.tipo]}"></i><span>${esc(m.texto)}</span></div>`).join("")}</div>` : ""}
    ${r.graficos.length ? `<div class="graficos">${r.graficos.map((g, i) => `<div class="tarjeta"><div class="etiqueta">${esc(g.titulo)}</div><div class="grafico"><canvas id="g${i}" role="img" aria-label="${esc(g.titulo)}"></canvas></div></div>`).join("")}</div>` : ""}
    ${r.tablas.map((t) => `<div class="tarjeta"><div class="etiqueta" style="margin-bottom:10px">${esc(t.titulo)}</div>${t.filas.length ? `<div class="tabla-env"><table><thead><tr>${t.columnas.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.filas.map((f) => `<tr>${f.map((v) => `<td${/^(RECHAZO|alerta|aceptada|NO verificada|verificada|cumple|NO cumple|no cumple mínimo|insatisfactorio|cuestionable|satisfactorio|aceptable|NO aceptable)$/.test(String(v)) ? ` class="estado ${/RECHAZO|NO|no cumple|insatisf/.test(String(v)) ? "mal" : /alerta|cuestionable/.test(String(v)) ? "alerta" : "ok"}"` : ""}>${esc(fmtNum(v))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="sub">Sin filas que mostrar.</p>`}</div>`).join("")}
    ${r.notas.length ? `<div class="notas">${r.notas.map((n) => `<div>• ${esc(n)}</div>`).join("")}</div>` : ""}
    <div class="aviso">${esc(AVISO)}</div>`;
  r.graficos.forEach((g, i) => { const ch = dibujar($("#g" + i, out), g); if (ch) graficos.push(ch); });
  $$("[data-contar]", out).forEach(contar);
  $("#imprimir").onclick = () => window.print();
  $("#exportar").onclick = () => exportarCSV(r, c);
  $("#copiar").onclick = () => {
    const t = [r.titulo, ...r.kpis.map((k) => `${k.etiqueta}: ${k.valor}${k.unidad || ""}`), ...r.mensajes.map((m) => "- " + m.texto), "", AVISO].join("\n");
    navigator.clipboard?.writeText(t).then(() => toast("Resumen copiado"), () => toast("No se pudo copiar"));
  };
  iconos();
}
function contar(el) {
  const fin = Number(el.dataset.contar), dec = Number.isInteger(fin) ? 0 : 2, t0 = performance.now(), dur = 700, unidad = el.querySelector("small")?.outerHTML || "";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const paso = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.innerHTML = (fin * e).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + unidad; if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
function exportarCSV(r, c) {
  const celda = (v) => { const s = typeof v === "number" ? String(v).replace(".", ",") : String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const partes = [`PatricIA;${celda(r.titulo)}`, `Fecha;${new Date().toLocaleString("es-CO")}`, ""];
  if (r.kpis.length) partes.push("Indicador;Valor;Nota", ...r.kpis.map((k) => [k.etiqueta, k.valor + (k.unidad || ""), k.nota || ""].map(celda).join(";")), "");
  for (const t of r.tablas) partes.push(celda(t.titulo), t.columnas.map(celda).join(";"), ...t.filas.map((f) => f.map(celda).join(";")), "");
  partes.push(celda(AVISO));
  const blob = new Blob(["﻿" + partes.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `PatricIA-${c.id}-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ------------------------------------------------------------ Gráficos (Chart.js)
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const alfa = (hex, a) => { const m = hex.replace("#", ""); const n = parseInt(m.length === 3 ? m.split("").map((x) => x + x).join("") : m, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const pluginLineas = {
  id: "lineas",
  afterDatasetsDraw(chart, _a, op) {
    const { ctx, chartArea: ca, scales } = chart;
    ctx.save();
    for (const l of op.h || []) {
      const y = scales.y.getPixelForValue(l.y); if (y < ca.top - 1 || y > ca.bottom + 1) continue;
      ctx.strokeStyle = l.color; ctx.lineWidth = l.ancho || 1; ctx.setLineDash(l.dash || []); ctx.beginPath(); ctx.moveTo(ca.left, y); ctx.lineTo(ca.right, y); ctx.stroke();
      if (l.etiqueta) { ctx.setLineDash([]); ctx.fillStyle = l.color; ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "right"; ctx.fillText(l.etiqueta, ca.right - 4, y - 4); }
    }
    for (const l of op.v || []) {
      const x = l.decimal != null ? scales.x.getPixelForDecimal(l.decimal) : scales.x.getPixelForValue(l.x); if (x < ca.left - 1 || x > ca.right + 1) continue;
      ctx.strokeStyle = l.color; ctx.lineWidth = l.ancho || 1.5; ctx.setLineDash(l.dash || []); ctx.beginPath(); ctx.moveTo(x, ca.top); ctx.lineTo(x, ca.bottom); ctx.stroke();
      if (l.etiqueta) { ctx.setLineDash([]); ctx.fillStyle = l.color; ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "left"; ctx.fillText(l.etiqueta, x + 4, ca.top + 12); }
    }
    ctx.restore();
  },
};
function dibujar(canvas, g) {
  if (!window.Chart || !canvas) return null;
  const C = { acento: css("--acento"), acento2: css("--acento-2"), ok: css("--ok"), alerta: css("--alerta"), mal: css("--mal"), texto: css("--texto-2"), rejilla: css("--borde"), info: css("--info") };
  Chart.defaults.color = C.texto; Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.borderColor = C.rejilla;
  const tooltip = { backgroundColor: css("--solido"), titleColor: css("--texto"), bodyColor: css("--texto-2"), borderColor: css("--borde-fuerte"), borderWidth: 1, padding: 10, cornerRadius: 10 };
  const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 700, easing: "easeOutQuart" }, plugins: { legend: { display: false }, tooltip }, scales: { x: { grid: { display: false } }, y: { grid: { color: C.rejilla } } } };
  const grad = (ctx, color) => { const gr = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 280); gr.addColorStop(0, alfa(color, 0.32)); gr.addColorStop(1, alfa(color, 0)); return gr; };
  const ctx = canvas.getContext("2d");
  let cfg;
  if (g.tipo === "lj") {
    const col = g.puntos.map((p) => (p.estado === "RECHAZO" ? C.mal : p.estado === "alerta" ? C.alerta : C.acento));
    cfg = { type: "line", data: { labels: g.puntos.map((p) => p.corrida), datasets: [{ data: g.puntos.map((p) => p.valor), borderColor: C.acento, backgroundColor: grad(ctx, C.acento), fill: false, tension: 0.25, pointBackgroundColor: col, pointBorderColor: col, pointRadius: g.puntos.map((p) => (p.estado === "aceptada" ? 3 : 5)), borderWidth: 2 }] },
      options: { ...base, plugins: { ...base.plugins, tooltip: { ...tooltip, callbacks: { label: (it) => `valor ${fmtNum(it.raw)} · z ${g.puntos[it.dataIndex].z.toFixed(2)} · ${g.puntos[it.dataIndex].estado}` } },
        lineas: { h: [[0, C.ok, [], "media"], [1, C.texto, [2, 4]], [-1, C.texto, [2, 4]], [2, C.alerta, [5, 4], "±2 DE"], [-2, C.alerta, [5, 4]], [3, C.mal, [6, 3], "±3 DE"], [-3, C.mal, [6, 3]]].map(([k, color, dash, etiqueta]) => ({ y: g.media + k * g.de, color, dash, etiqueta })) } },
        scales: { ...base.scales, y: { ...base.scales.y, suggestedMin: g.media - 3.6 * g.de, suggestedMax: g.media + 3.6 * g.de } } } };
  } else if (g.tipo === "contribuciones") {
    cfg = { type: "bar", data: { labels: g.series.map((s) => s.etiqueta), datasets: [{ label: "u(Rw)", data: g.series.map((s) => s.rw), backgroundColor: C.acento, borderRadius: 8 }, { label: g.otroNombre, data: g.series.map((s) => s.otro), backgroundColor: C.acento2, borderRadius: 8 }] },
      options: { ...base, plugins: { ...base.plugins, legend: { display: true, position: "bottom" } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, max: 100, grid: { color: C.rejilla }, ticks: { callback: (v) => v + " %" } } } } };
  } else if (g.tipo === "sigma") {
    const col = g.series.map((s) => (s.valor >= 6 ? C.ok : s.valor >= 4 ? C.acento : s.valor >= 3 ? C.alerta : C.mal));
    cfg = { type: "bar", data: { labels: g.series.map((s) => s.etiqueta), datasets: [{ data: g.series.map((s) => Math.max(0, s.valor)), backgroundColor: col, borderRadius: 8, maxBarThickness: 34 }] },
      options: { ...base, indexAxis: "y", plugins: { ...base.plugins, lineas: { v: [[3, C.mal, "3σ"], [4, C.alerta, "4σ"], [6, C.ok, "6σ"]].map(([x, color, etiqueta]) => ({ x, color, dash: [5, 4], etiqueta })) } },
        scales: { x: { grid: { color: C.rejilla }, suggestedMax: 7, min: 0 }, y: { grid: { display: false } } } } };
  } else if (g.tipo === "histograma") {
    const v = g.valores, n = v.length, k = Math.max(5, Math.ceil(Math.log2(n) + 1)), min = v[0], max = v[n - 1], w = (max - min) / k || 1;
    const cuentas = Array(k).fill(0); v.forEach((x) => cuentas[Math.min(k - 1, Math.floor((x - min) / w))]++);
    const lv = []; if (g.li != null) lv.push({ decimal: (g.li - min) / (k * w), color: C.mal, dash: [5, 4], etiqueta: "LI" }); if (g.ls != null) lv.push({ decimal: (g.ls - min) / (k * w), color: C.mal, dash: [5, 4], etiqueta: "LS" });
    cfg = { type: "bar", data: { labels: cuentas.map((_, i) => fmtNum(Number((min + (i + 0.5) * w).toFixed(3)))), datasets: [{ data: cuentas, backgroundColor: alfa(C.acento, 0.75), borderRadius: 6, categoryPercentage: 0.95, barPercentage: 0.95 }] },
      options: { ...base, plugins: { ...base.plugins, lineas: { v: lv } }, scales: { x: { grid: { display: false } }, y: { grid: { color: C.rejilla }, ticks: { precision: 0 } } } } };
  } else if (g.tipo === "dispersion") {
    const lo = Math.min(...g.x, ...g.y), hi = Math.max(...g.x, ...g.y);
    cfg = { type: "scatter", data: { datasets: [
      { label: "Muestras", data: g.x.map((x, i) => ({ x, y: g.y[i] })), backgroundColor: alfa(C.acento, 0.75), pointRadius: 3.5 },
      { label: "y = x", type: "line", data: [{ x: lo, y: lo }, { x: hi, y: hi }], borderColor: C.texto, borderDash: [4, 4], borderWidth: 1, pointRadius: 0 },
      { label: `Passing-Bablok: y = ${g.pb.b.toFixed(3)}x ${g.pb.a >= 0 ? "+" : "−"} ${Math.abs(g.pb.a).toFixed(3)}`, type: "line", data: [{ x: lo, y: g.pb.a + g.pb.b * lo }, { x: hi, y: g.pb.a + g.pb.b * hi }], borderColor: C.acento2, borderWidth: 2, pointRadius: 0 }] },
      options: { ...base, plugins: { ...base.plugins, legend: { display: true, position: "bottom", labels: { boxWidth: 12 } } }, scales: { x: { type: "linear", title: { display: true, text: g.nombreX }, grid: { color: C.rejilla } }, y: { title: { display: true, text: g.nombreY }, grid: { color: C.rejilla } } } } };
  } else if (g.tipo === "ba") {
    cfg = { type: "scatter", data: { datasets: [{ data: g.prom.map((x, i) => ({ x, y: g.dif[i] })), backgroundColor: alfa(C.acento, 0.75), pointRadius: 3.5 }] },
      options: { ...base, plugins: { ...base.plugins, lineas: { h: [{ y: 0, color: C.texto, dash: [2, 4] }, { y: g.md, color: C.acento2, etiqueta: `sesgo ${g.md.toFixed(2)}` }, { y: g.lim[0], color: C.alerta, dash: [6, 4], etiqueta: "−1,96 DE" }, { y: g.lim[1], color: C.alerta, dash: [6, 4], etiqueta: "+1,96 DE" }] } },
        scales: { x: { type: "linear", title: { display: true, text: "Promedio de ambos métodos" }, grid: { color: C.rejilla } }, y: { title: { display: true, text: g.relativo ? "Diferencia (%)" : "Diferencia" }, grid: { color: C.rejilla } } } } };
  } else if (g.tipo === "puntosDia") {
    const dias = g.grupos.map((x) => x.dia);
    cfg = { type: "scatter", data: { datasets: [{ data: g.grupos.flatMap((gr, i) => gr.valores.map((v, j) => ({ x: i + 1 + (j - (gr.valores.length - 1) / 2) * 0.07, y: v }))), backgroundColor: alfa(C.acento, 0.8), pointRadius: 4 }] },
      options: { ...base, plugins: { ...base.plugins, lineas: { h: [{ y: g.media, color: C.acento2, dash: [5, 4], etiqueta: "media" }] } },
        scales: { x: { type: "linear", min: 0.5, max: dias.length + 0.5, ticks: { stepSize: 1, callback: (v) => (Number.isInteger(v) ? "Día " + dias[v - 1] : "") }, grid: { display: false } }, y: { grid: { color: C.rejilla } } } } };
  } else if (g.tipo === "sesgoNiveles") {
    cfg = { type: "bar", data: { labels: g.etiquetas, datasets: [{ data: g.valores, backgroundColor: g.valores.map((v) => (v < 0 ? C.acento2 : C.acento)), borderRadius: 8, maxBarThickness: 56 }] },
      options: { ...base, plugins: { ...base.plugins, tooltip: { ...tooltip, callbacks: { label: (it) => `sesgo ${it.raw.toFixed(2)} %` } }, lineas: { h: [{ y: 0, color: C.texto }, { y: g.agrupado, color: C.mal, dash: [6, 4], etiqueta: `sesgo agrupado del archivo ${g.agrupado.toFixed(2)} %` }] } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: C.rejilla }, ticks: { callback: (v) => v + " %" } } } } };
  } else if (g.tipo === "zscores") {
    const col = g.valores.map((z) => (z == null ? C.texto : Math.abs(z) >= 3 ? C.mal : Math.abs(z) > 2 ? C.alerta : C.acento));
    cfg = { type: "bar", data: { labels: g.etiquetas, datasets: [{ data: g.valores, backgroundColor: col, borderRadius: 6, maxBarThickness: 40 }] },
      options: { ...base, plugins: { ...base.plugins, lineas: { h: [[2, C.alerta], [-2, C.alerta], [3, C.mal], [-3, C.mal]].map(([y, color]) => ({ y, color, dash: [5, 4] })) } },
        scales: { x: { grid: { display: false } }, y: { suggestedMin: -3.5, suggestedMax: 3.5, grid: { color: C.rejilla } } } } };
  }
  return cfg ? new Chart(canvas, { ...cfg, plugins: [pluginLineas] }) : null;
}

// ------------------------------------------------------------ Revisar mi Excel de verificación
let informe = null;
const ESTADO_SEC = { ok: ["ok", "circle-check", "Sin problemas"], alerta: ["alerta", "triangle-alert", "Con advertencias"], mal: ["mal", "circle-x", "Con problemas"], vacio: ["info", "circle-dashed", "Sin datos"] };
async function vFormato() {
  vista.innerHTML = `
    <div class="cabecera"><div><h1>Revisar mi Excel de verificación</h1><p>Sube tu formato de verificación de métodos cuantitativos (.xls o .xlsx, p. ej. FO-LG-61). PatricIA recalcula cada hoja, revisa las fórmulas, te dice qué está bien y qué no, responde tus preguntas sobre el ejercicio y te explica cómo hacerlo en Excel. El archivo se analiza en tu dispositivo y no se envía a ningún lugar.</p></div></div>
    <label class="zona" id="zona-fmt" style="margin-bottom:18px"><input type="file" id="archivo-fmt" accept=".xls,.xlsx,.xlsm,.ods" hidden>
      <i data-lucide="file-search"></i><b>${informe ? "Analizar otro archivo" : "Sube tu formato de verificación"}</b><small>o arrástralo aquí · hojas esperadas: Repetibilidad, Precisión intermedia, Comparación de métodos, Veracidad, Incertidumbre, Linealidad</small></label>
    <div id="informe"></div>`;
  const zona = $("#zona-fmt"), inp = $("#archivo-fmt");
  const cargar = async (file) => {
    $("#informe").innerHTML = `<div class="tarjeta vacio"><span class="orbe escuchando"></span><h3>Analizando ${esc(file.name)}…</h3></div>`; iconos();
    try {
      if (!window.XLSX) throw new Error("El lector de Excel aún no está listo; intenta de nuevo en unos segundos.");
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: true });
      informe = analizarLibro(wb, file.name);
      informe.chat = [];
      pintarInforme();
      toast("Archivo analizado");
    } catch (e) { informe = null; $("#informe").innerHTML = `<div class="mensaje mal"><i data-lucide="circle-x"></i><span>${esc(e.message)}</span></div>`; iconos(); }
  };
  inp.onchange = () => inp.files[0] && cargar(inp.files[0]);
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("sobre"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("sobre"); e.dataTransfer.files[0] && cargar(e.dataTransfer.files[0]); });
  if (informe) pintarInforme();
}

const mdHallazgo = (h) => `<div class="mensaje ${h.tipo}"><i data-lucide="${ICON_MSG[h.tipo]}"></i><span class="md">${md(h.texto)}${h.excel ? `<div style="margin-top:6px;font-size:.86rem">Fórmula sugerida: <code>${esc(h.excel)}</code></div>` : ""}</span></div>`;
function pintarInforme() {
  const inf = informe, cont = $("#informe");
  graficos.forEach((g) => g.destroy()); graficos = [];
  const secOk = inf.secciones.filter((s) => s.estado === "ok").length;
  cont.innerHTML = `
    <div class="solo-impresion"><img src="iconos/labmedico.png" alt="Labmédico" style="height:42px"><h2>PatricIA · Revisión del formato ${esc(inf.archivo)}</h2><p class="sub">${new Date().toLocaleString("es-CO")}</p></div>
    <div class="tarjeta" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
        <div><div class="etiqueta">${inf.esPlantilla ? "Plantilla (sin datos)" : "Ejercicio de verificación"}</div><h2 style="margin:6px 0 2px">${esc(inf.prueba)}</h2><p class="sub" style="margin:0">${esc(inf.archivo)}${inf.metodo ? ` · ${esc(inf.metodo)} vs ${esc(inf.comparador)}` : ""}${inf.eta != null ? ` · ETa ${fmtNum(inf.eta)} %` : ""}</p></div>
        <div class="no-imprimir" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" onclick="window.print()"><i data-lucide="printer"></i>Imprimir informe</button><button class="btn" id="exp-hall"><i data-lucide="sheet"></i>Exportar hallazgos</button></div>
      </div>
      <div class="kpis" style="margin-top:14px">
        <div class="kpi mal"><div class="etiqueta">Problemas importantes</div><div class="valor" data-contar="${inf.conteo.mal}">${inf.conteo.mal}</div></div>
        <div class="kpi alerta"><div class="etiqueta">Advertencias</div><div class="valor" data-contar="${inf.conteo.alerta}">${inf.conteo.alerta}</div></div>
        <div class="kpi ok"><div class="etiqueta">Secciones sin problemas</div><div class="valor">${secOk} / ${inf.secciones.length}</div></div>
      </div>
      <div class="chips" style="margin-top:14px">${inf.secciones.map((s) => { const [cls, ic, t] = ESTADO_SEC[s.estado] || ESTADO_SEC.vacio; return `<button class="chip" data-ir-sec="${s.id}"><i data-lucide="${ic}" style="color:var(--${cls === "info" ? "texto-3" : cls})"></i>${esc(s.titulo)} · ${t}</button>`; }).join("")}</div>
      ${inf.generales.length ? `<div style="display:grid;gap:8px;margin-top:14px">${inf.generales.map(mdHallazgo).join("")}</div>` : ""}
    </div>
    <div class="tarjeta no-imprimir" style="margin-bottom:16px">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><span class="orbe" style="--t:34px"></span><div><h3 style="margin:0">Pregúntale a PatricIA sobre este archivo</h3><p class="sub" style="margin:0;font-size:.88rem">Valores, criterios, problemas, o cómo hacer un cálculo o gráfico en Excel.</p></div></div>
      <div id="chat-fmt" class="conversacion" style="padding-bottom:6px"></div>
      <form class="buscador" id="f-fmt" role="search"><i data-lucide="message-circle-question" class="lupa"></i><input id="q-fmt" placeholder="p. ej. ¿Cuál es el sesgo del nivel bajo?" autocomplete="off" aria-label="Pregunta sobre el archivo">${microfono()}<button class="btn primario" type="submit" aria-label="Preguntar"><i data-lucide="send"></i></button></form>
      <div class="chips" style="margin-top:10px">${sugerenciasArchivo(inf).map((s) => `<button class="chip" data-qf="${esc(s)}"><i data-lucide="sparkle"></i>${esc(s)}</button>`).join("")}</div>
    </div>
    ${inf.secciones.map((s) => { const [cls, ic, t] = ESTADO_SEC[s.estado] || ESTADO_SEC.vacio; return `
    <section class="tarjeta" id="sec-${s.id}" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><h2 style="margin:0;font-size:1.2rem">${esc(s.titulo)} <small class="sub" style="font-weight:400;font-size:.85rem">hoja «${esc(s.hoja)}»</small></h2><span class="mensaje ${cls}" style="padding:5px 12px"><i data-lucide="${ic}"></i><span>${t}</span></span></div>
      <div style="display:grid;gap:8px">${s.hallazgos.map(mdHallazgo).join("")}</div>
      ${(s.tablas || []).filter((tb) => tb.filas.length).map((tb) => `<div class="etiqueta" style="margin:16px 0 8px">${esc(tb.titulo)}</div><div class="tabla-env"><table><thead><tr>${tb.columnas.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${tb.filas.map((f) => `<tr>${f.map((v) => `<td${/^(cumple|NO cumple)$/.test(String(v)) ? ` class="estado ${v === "cumple" ? "ok" : "mal"}"` : ""}>${esc(fmtNum(v))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("")}
      ${s.graficos?.length ? `<div class="graficos" style="margin-top:16px">${s.graficos.map((g, i) => `<div><div class="etiqueta">${esc(g.titulo)}</div><div class="grafico"><canvas data-graf="${s.id}-${i}" role="img" aria-label="${esc(g.titulo)}"></canvas></div></div>`).join("")}</div>` : ""}
      <details style="margin-top:14px" class="no-imprimir"><summary class="chip" style="display:inline-flex"><i data-lucide="sheet"></i>Cómo hacerlo en Excel</summary><div class="md" style="margin-top:12px">${md(guiaExcel(s.id, inf))}</div></details>
    </section>`; }).join("")}
    <details class="tarjeta no-imprimir" style="margin-bottom:16px"><summary style="cursor:pointer;font-weight:600"><i data-lucide="chart-line" style="width:18px;vertical-align:-3px"></i> Reparar gráficos que no se actualizan</summary><div class="md" style="margin-top:12px">${md(guiaExcel("graficos", inf))}</div></details>
    <div class="aviso">${esc(AVISO)} Las conclusiones del formato deben firmarlas los responsables autorizados.</div>`;
  for (const s of inf.secciones) (s.graficos || []).forEach((g, i) => { const ch = dibujar($(`[data-graf="${s.id}-${i}"]`, cont), g); if (ch) graficos.push(ch); });
  $$("[data-contar]", cont).forEach(contar);
  $$("[data-ir-sec]", cont).forEach((b) => b.onclick = () => $("#sec-" + b.dataset.irSec).scrollIntoView({ behavior: "smooth", block: "start" }));
  $("#exp-hall").onclick = () => {
    const filas = [["Sección", "Tipo", "Hallazgo", "Fórmula sugerida"], ...inf.hallazgos.map((h) => [h.seccion, h.tipo, h.texto.replace(/\*\*/g, ""), h.excel || ""])];
    const csv = "﻿" + filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: `PatricIA-revision-${inf.archivo.replace(/\.[^.]+$/, "")}.csv` }); a.click();
  };
  const chat = $("#chat-fmt");
  const pintarChat = () => { chat.innerHTML = inf.chat.map((m) => `<div class="msg-usuario">${esc(m.q)}</div><div class="msg-patricia"><span class="orbe"></span><div class="tarjeta respuesta"><div class="md">${md(m.md)}</div></div></div>`).join(""); iconos(); };
  const preguntarF = (q) => {
    if (!q) return;
    let r = responderArchivo(q, inf);
    if (!r) {
      const kb = buscador.buscar(q, 1)[0];
      r = { md: kb ? `No encontré eso en los datos del archivo. Esto dice la base de conocimiento (${kb.doc} › ${kb.titulo}):\n\n${kb.md.slice(0, 1800)}` : `No encontré una respuesta. Prueba con: ${sugerenciasArchivo(inf).slice(0, 3).join(" · ")}` };
    }
    inf.chat.push({ q, md: r.md }); pintarChat(); $("#q-fmt").value = "";
    chat.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  pintarChat();
  $("#f-fmt").addEventListener("submit", (e) => { e.preventDefault(); preguntarF($("#q-fmt").value.trim()); });
  $$("[data-qf]", cont).forEach((b) => b.onclick = () => preguntarF(b.dataset.qf));
  activarMic(cont, $("#q-fmt"), preguntarF);
  iconos();
  void resumenTexto;
}

// ------------------------------------------------------------ Autoevaluación ISO 15189
function progresoChecklist() {
  const est = guardado.leer("checklist", {});
  const total = CHECKLIST.reduce((a, s) => a + s.items.length, 0);
  let resp = 0, cumple = 0, aplic = 0;
  CHECKLIST.forEach((s, i) => s.items.forEach((_, j) => { const v = est[`${i}-${j}`]?.v; if (v) { resp++; if (v !== "na") { aplic++; cumple += v === "cumple" ? 1 : v === "parcial" ? 0.5 : 0; } } }));
  return { total, respondidos: resp, avance: Math.round((100 * resp) / total), cumplimiento: aplic ? Math.round((100 * cumple) / aplic) : 0 };
}
function vChecklist() {
  const est = guardado.leer("checklist", {});
  const pintar = () => {
    const p = progresoChecklist();
    vista.innerHTML = `
      <div class="cabecera"><div><h1>Autoevaluación ISO 15189:2022</h1><p>Revisa la evidencia de tu laboratorio requisito por requisito. Se guarda en este dispositivo. Las preguntas son orientativas: confirma cada numeral en la copia autorizada de la norma.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap" class="no-imprimir"><button class="btn" onclick="window.print()"><i data-lucide="printer"></i>Imprimir</button><button class="btn" id="exp-check"><i data-lucide="sheet"></i>Exportar CSV</button><button class="btn fantasma" id="reset-check"><i data-lucide="trash-2"></i>Reiniciar</button></div></div>
      <div class="bento" style="margin-bottom:18px">
        <div class="tarjeta b-3" style="display:flex;gap:18px;align-items:center"><span class="anillo" style="--p:${p.avance}" data-texto="${p.avance}%"></span><div><div class="etiqueta">Avance</div><h3 style="margin:4px 0">${p.respondidos} de ${p.total} revisados</h3></div></div>
        <div class="tarjeta b-3" style="display:flex;gap:18px;align-items:center"><span class="anillo" style="--p:${p.cumplimiento}" data-texto="${p.cumplimiento}%"></span><div><div class="etiqueta">Cumplimiento estimado</div><h3 style="margin:4px 0">Cumple = 1 · Parcial = 0,5</h3><p class="sub" style="font-size:.85rem">Sobre los requisitos aplicables revisados</p></div></div>
      </div>
      ${CHECKLIST.map((s, i) => {
        const r = s.items.filter((_, j) => est[`${i}-${j}`]?.v).length;
        return `<details class="tarjeta area" ${i === 0 ? "open" : ""}><summary><i data-lucide="chevron-right" class="chev"></i><h3>${esc(s.area)} <small class="sub" style="font-weight:400">· ${esc(s.clausula)}</small></h3><span class="sub" style="font-size:.85rem">${r}/${s.items.length}</span><span class="barra"><i style="width:${(100 * r) / s.items.length}%"></i></span></summary>
          ${s.items.map((t, j) => { const k = `${i}-${j}`, e = est[k] || {}; return `<div class="item" data-k="${k}"><p>${esc(t)}</p><div class="segmento" role="group" aria-label="Estado">${[["cumple", "Cumple"], ["parcial", "Parcial"], ["no", "No"], ["na", "N/A"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${e.v === v ? "sel" : ""}" aria-pressed="${e.v === v}">${l}</button>`).join("")}</div><textarea placeholder="Evidencia, código del documento o hallazgo…" aria-label="Nota">${esc(e.nota || "")}</textarea></div>`; }).join("")}
        </details>`;
      }).join("")}
      <div class="aviso">${esc(AVISO)}</div>`;
    $$(".item").forEach((it) => {
      const k = it.dataset.k;
      $$(".segmento button", it).forEach((b) => b.onclick = () => { est[k] = { ...(est[k] || {}), v: est[k]?.v === b.dataset.v ? null : b.dataset.v }; guardado.escribir("checklist", est); const abiertos = $$("details.area").map((d) => d.open); pintar(); $$("details.area").forEach((d, i) => (d.open = abiertos[i])); });
      $("textarea", it).onchange = (e) => { est[k] = { ...(est[k] || {}), nota: e.target.value }; guardado.escribir("checklist", est); };
    });
    $("#reset-check").onclick = () => { if (confirm("¿Borrar todas las respuestas de la autoevaluación en este dispositivo?")) { for (const k in est) delete est[k]; guardado.escribir("checklist", est); pintar(); } };
    $("#exp-check").onclick = () => {
      const filas = [["Área", "Cláusula (orientativa)", "Requisito", "Estado", "Nota"]];
      CHECKLIST.forEach((s, i) => s.items.forEach((t, j) => { const e = est[`${i}-${j}`] || {}; filas.push([s.area, s.clausula, t, e.v || "", e.nota || ""]); }));
      const csv = "﻿" + filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: "PatricIA-autoevaluacion-ISO15189.csv" }); a.click();
    };
    iconos();
  };
  pintar();
}

// ------------------------------------------------------------ Biblioteca, documentos, plantillas, glosario
async function vBiblioteca() {
  await listo;
  const ICON = { "guia-excel.md": "sheet", "preguntas-frecuentes.md": "messages-square", "glosario.md": "book-a", "incertidumbre-iso-20914.md": "sigma", "control-calidad-interno.md": "activity", "especificaciones-desempeno.md": "target", "verificacion-validacion-clinica.md": "badge-check", "trazabilidad-eqa.md": "link", "sistema-gestion-iso-15189.md": "shield-check", "mapa-normativo.md": "map", "contexto-colombia.md": "landmark" };
  vista.innerHTML = `<div class="cabecera"><div><h1>Biblioteca</h1><p>La base de conocimiento completa de PatricIA y plantillas para tus documentos.</p></div></div>
    <div class="etiqueta" style="margin-bottom:10px">Documentos</div>
    <div class="rejilla">${DOCUMENTOS.map(([f, t], i) => { const m = (docs.get(f) || "").match(/^>\s*(.+)$/m); return `<a class="tarjeta interactiva tarjeta-calc" style="--i:${i}" href="#/doc/${f.replace(".md", "")}"><div class="icono-caja"><i data-lucide="${ICON[f] || "file-text"}"></i></div><h3>${esc(t)}</h3><p>${esc((m?.[1] || "").replace(/[*`]/g, "").slice(0, 120))}${m ? "…" : ""}</p></a>`; }).join("")}</div>
    <div class="etiqueta" style="margin:26px 0 10px">Plantillas</div>
    <div class="rejilla">${plantillas.map(([f, t], i) => `<a class="tarjeta interactiva tarjeta-calc" style="--i:${i}" href="#/plantilla/${f.replace(".md", "")}"><div class="icono-caja"><i data-lucide="file-pen-line"></i></div><h3>${esc(t)}</h3><p>Plantilla de borrador para completar, imprimir o descargar.</p></a>`).join("")}</div>`;
}
async function vDoc(nombre) {
  await listo;
  const f = nombre + ".md", texto = docs.get(f);
  if (!texto) return vBiblioteca();
  const titulo = DOCUMENTOS.find(([x]) => x === f)?.[1] || nombre;
  const cuerpo = texto.replace(/^# .*\n/, "");
  vista.innerHTML = `<div class="migas"><a href="#/biblioteca">Biblioteca</a><i data-lucide="chevron-right" style="width:14px"></i>${esc(titulo)}</div>
    <div class="cabecera"><div><h1>${esc((texto.match(/^# (.*)$/m) || [])[1] || titulo)}</h1></div><div class="no-imprimir" style="display:flex;gap:8px"><button class="btn" onclick="window.print()"><i data-lucide="printer"></i>Imprimir</button></div></div>
    <div class="doc-layout"><article class="tarjeta md" id="doc">${md(cuerpo)}</article><nav class="toc" id="toc" aria-label="Contenido"></nav></div>`;
  const toc = $("#toc");
  $$("#doc h2, #doc h3").forEach((h, i) => { h.id = "s" + i; toc.insertAdjacentHTML("beforeend", `<a href="#" data-s="${h.id}" style="${h.tagName === "H3" ? "padding-left:20px;font-size:.82rem" : ""}">${esc(h.textContent)}</a>`); });
  $$("[data-s]", toc).forEach((a) => a.onclick = (e) => { e.preventDefault(); document.getElementById(a.dataset.s).scrollIntoView({ behavior: "smooth" }); });
}
async function vPlantilla(nombre) {
  const p = plantillas.find(([f]) => f === nombre + ".md");
  if (!p) return vBiblioteca();
  let texto = "";
  try { texto = await (await fetch("contenido/plantillas/" + p[0])).text(); } catch { texto = "No disponible sin conexión."; }
  vista.innerHTML = `<div class="migas"><a href="#/biblioteca">Biblioteca</a><i data-lucide="chevron-right" style="width:14px"></i>${esc(p[1])}</div>
    <div class="cabecera"><div><h1>${esc(p[1])}</h1><p>Copia la plantilla a tu procesador de texto, o descárgala y complétala.</p></div>
      <div class="no-imprimir" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="cp"><i data-lucide="copy"></i>Copiar</button><button class="btn" id="dl"><i data-lucide="download"></i>Descargar .md</button><button class="btn" onclick="window.print()"><i data-lucide="printer"></i>Imprimir</button></div></div>
    <article class="tarjeta md">${md(texto.replace(/^# .*\n/, (m) => m.replace("# ", "## ")))}</article>`;
  $("#cp").onclick = () => navigator.clipboard?.writeText(texto).then(() => toast("Plantilla copiada"));
  $("#dl").onclick = () => { const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([texto], { type: "text/markdown" })), download: p[0] }); a.click(); };
}
async function vGlosario() {
  await listo;
  const terminos = buscador.secciones.filter((s) => s.archivo === "glosario.md" && s.nivel === 3).sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  const letras = [...new Set(terminos.map((t) => normalizar(t.titulo)[0].toUpperCase()))];
  vista.innerHTML = `<div class="cabecera"><div><h1>Glosario</h1><p>${terminos.length} términos de metrología y calidad, con base en el VIM y el uso del laboratorio clínico.</p></div></div>
    <form class="buscador" style="margin-bottom:14px" onsubmit="return false"><i data-lucide="filter" class="lupa"></i><input id="filtro" placeholder="Filtrar términos…" aria-label="Filtrar términos"></form>
    <div class="letras">${letras.map((l) => `<a href="#" data-l="${l}">${l}</a>`).join("")}</div>
    <div class="glosario-lista" id="lista">${terminos.map((t) => `<div class="tarjeta termino" data-n="${esc(normalizar(t.titulo + " " + t.md))}" data-l="${normalizar(t.titulo)[0].toUpperCase()}"><h3>${esc(t.titulo)}</h3><div class="md">${md(t.md)}</div></div>`).join("")}</div>`;
  $("#filtro").addEventListener("input", (e) => { const q = normalizar(e.target.value); $$("#lista .termino").forEach((el) => el.classList.toggle("oculto", q && !el.dataset.n.includes(q))); });
  $$(".letras a").forEach((a) => a.onclick = (e) => { e.preventDefault(); $(`#lista .termino[data-l="${a.dataset.l}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
}

// ------------------------------------------------------------ Más (móvil) y Acerca
function vMas() {
  vista.innerHTML = `<div class="cabecera"><div><h1>Más</h1></div></div><div class="rejilla">${NAV.filter(([id]) => !["inicio", "preguntar", "guias", "calculadoras"].includes(id)).map(([id, t, ic], i) => `<a class="tarjeta interactiva tarjeta-calc" style="--i:${i}" href="#/${id}"><div class="icono-caja"><i data-lucide="${ic}"></i></div><h3>${esc(t)}</h3></a>`).join("")}</div>`;
}
function vAcerca() {
  vista.innerHTML = `<div class="cabecera"><div><h1>Acerca de PatricIA</h1><p>Versión ${VERSION}</p></div></div>
    <div class="bento">
      <div class="tarjeta b-6" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><span class="marca-lab grande"><img src="iconos/labmedico.png" alt="Labmédico, Laboratorio Médico de Referencia"></span><p class="sub" style="margin:0;flex:1;min-width:220px">PatricIA es una herramienta de apoyo del <b>Laboratorio Médico de Referencia — Labmédico</b> para su equipo de calidad y metrología. Su emblema animado evoca la siembra en caja de Petri del logo del laboratorio.</p></div>
      <div class="tarjeta b-3 md"><h3>Qué es</h3><p>PatricIA es un asistente experto en metrología y calidad para el laboratorio clínico: una base de conocimiento consultable, guías de decisión, calculadoras validadas y una autoevaluación ISO 15189. Funciona <b>sin conexión</b> y <b>sin inteligencia artificial generativa</b>: las respuestas provienen de contenido experto revisable, y los cálculos se hacen en tu dispositivo.</p><p><b>Privacidad:</b> los archivos que subes no salen de tu equipo. La autoevaluación y las preferencias se guardan solo en este navegador.</p></div>
      <div class="tarjeta b-3 md"><h3>Instalar en tu dispositivo</h3>
        <p><b>Android (Chrome):</b> menú ⋮ → <i>Instalar aplicación</i> (o el botón <i>Instalar</i> de PatricIA).</p>
        <p><b>iPhone / iPad (Safari):</b> botón Compartir → <i>Agregar a inicio</i>.</p>
        <p><b>Computador (Chrome / Edge):</b> icono de instalar en la barra de direcciones, o el botón <i>Instalar</i> del menú lateral.</p>
        <p>Una vez instalada, se abre como una aplicación y funciona sin internet.</p>
        <button class="btn primario oculto" id="btn-instalar-a"><i data-lucide="download"></i>Instalar ahora</button></div>
      <div class="tarjeta b-6 md"><h3>Alcance y responsabilidad</h3>
        <ul><li>Los resultados son <b>borradores técnicos</b> para revisión del responsable autorizado (director del laboratorio, gestor de calidad); no constituyen decisiones de conformidad, liberación ni acreditación.</li>
        <li>Las normas ISO y CLSI tienen derechos de autor: PatricIA explica su propósito y aplicación sin reproducir su texto. Los criterios exactos deben confirmarse en la copia autorizada.</li>
        <li>La normativa colombiana y las ediciones de las normas cambian: la base de conocimiento corresponde a noviembre de 2026. Confirma la vigencia en las fuentes oficiales.</li>
        <li>Las calculadoras implementan fórmulas publicadas (ISO/TS 20914, EFLM, Westgard, ISO 13528, enfoques tipo CLSI EP15, EP17 y EP28, Passing-Bablok, Deming) y se verificaron contra implementaciones de referencia (SciPy).</li></ul></div>
      <div class="tarjeta b-6 md"><h3>Créditos y licencias</h3><p>Contenido y diseño: PatricIA. Librerías incluidas: Chart.js (MIT), SheetJS Community Edition (Apache 2.0), marked (MIT), Lucide (ISC), fuentes Inter y Sora (SIL OFL). Parte del conocimiento metodológico se apoya en <i>Scientific Agent Skills</i> de K-Dense (MIT).</p></div>
    </div>`;
  actualizarInstalar();
}

// ------------------------------------------------------------ tema, instalación, service worker
function alternarTema() {
  const r = document.documentElement, nuevo = r.dataset.tema === "claro" ? "oscuro" : "claro";
  if (nuevo === "oscuro") delete r.dataset.tema; else r.dataset.tema = "claro";
  try { localStorage.setItem("patricia.tema", nuevo === "oscuro" ? "" : "claro"); } catch { /* */ }
  if (location.hash.startsWith("#/calc/") && $("#resultados .kpis, #resultados canvas")) $("#f-calc")?.requestSubmit();
}
$("#btn-tema").onclick = alternarTema; $("#btn-tema-m").onclick = alternarTema;
let eventoInstalar = null;
function actualizarInstalar() { ["#btn-instalar", "#btn-instalar-m", "#btn-instalar-a"].forEach((s) => { const b = $(s); if (b) { b.classList.toggle("oculto", !eventoInstalar); b.onclick = instalar; } }); }
async function instalar() { if (!eventoInstalar) return; eventoInstalar.prompt(); await eventoInstalar.userChoice; eventoInstalar = null; actualizarInstalar(); }
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); eventoInstalar = e; actualizarInstalar(); });
window.addEventListener("appinstalled", () => toast("PatricIA quedó instalada"));
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW", e));

enrutar();
