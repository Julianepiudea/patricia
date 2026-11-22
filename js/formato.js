// Analizador de formatos de verificación de métodos cuantitativos en Excel (tipo FO-LG-61).
// Localiza las tablas por sus rótulos (no por celdas fijas), recalcula todo de forma independiente,
// audita las fórmulas y genera hallazgos, instrucciones de Excel y respuestas a preguntas.
// Funciones puras: recibe un libro de SheetJS ({ SheetNames, Sheets }).
import { media, de } from "./estadistica.js";
import { comparacionMetodos } from "./calculos.js";

// ------------------------------------------------------------------ utilidades de celdas
export const norm = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const letra = (c) => { let s = ""; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
const colNum = (s) => s.toUpperCase().split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
export const dir = (r, c) => `${letra(c)}${r + 1}`;
const rangoDir = (c, r1, r2) => `${letra(c)}${r1 + 1}:${letra(c)}${r2 + 1}`;
function dims(sh) {
  const ref = sh["!ref"]; if (!ref) return { r0: 0, c0: 0, r1: -1, c1: -1 };
  const [a, b = a] = ref.split(":"); const p = (x) => { const m = /([A-Z]+)(\d+)/.exec(x); return [Number(m[2]) - 1, colNum(m[1])]; };
  const [r0, c0] = p(a), [r1, c1] = p(b); return { r0, c0, r1, c1 };
}
const cel = (sh, r, c) => sh[dir(r, c)];
const num = (x) => (x && x.t === "n" && Number.isFinite(x.v) ? x.v : null);
const txt = (x) => (x && x.t === "s" ? String(x.v) : x && x.t === "n" ? String(x.v) : "");
const esError = (x) => x && x.t === "e";
const ERRORES = { 0: "#¡NULO!", 7: "#¡DIV/0!", 15: "#¡VALOR!", 23: "#¡REF!", 29: "#¿NOMBRE?", 36: "#¡NUM!", 42: "#N/A" };
const r4 = (x, d = 3) => (x == null || !isFinite(x) ? null : Number(x.toFixed(d)));
const fmt = (x, d = 2) => (x == null || !isFinite(x) ? "—" : x.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: d }));

const ES = { AVERAGE: "PROMEDIO", STDEV: "DESVEST", "STDEV.S": "DESVEST.M", STDEVA: "DESVESTA", SLOPE: "PENDIENTE", INTERCEPT: "INTERSECCION.EJE", SQRT: "RAIZ", SUM: "SUMA", RSQ: "COEFICIENTE.R2", CORREL: "COEF.DE.CORREL", COUNT: "CONTAR", IF: "SI", ABS: "ABS", MEDIAN: "MEDIANA", "STDEV.P": "DESVEST.P", ROUND: "REDONDEAR" };
export function aEspanol(f) {
  if (!f) return "";
  return "=" + f.replace(/\b([A-Z][A-Z0-9.]*)\(/g, (m, fn) => (ES[fn] || fn) + "(").replace(/#REF!/g, "#¡REF!").replace(/,/g, ";").replace(/(\d)\.(\d)/g, "$1,$2");
}
// Referencias de una fórmula: [{ hoja, c1, r1, c2, r2 }]
export function referencias(f, hojaActual) {
  const out = [];
  const re = /(?:(?:'([^']+)'|([A-Za-z_][\w.]*))!)?\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g;
  let m;
  while ((m = re.exec(f || ""))) {
    const prev = f[m.index - 1];
    if (prev && /[A-Za-z0-9_.]/.test(prev)) continue; // parte de un nombre de función (p. ej. LOG10)
    const c1 = colNum(m[3]), r1 = Number(m[4]) - 1, c2 = m[5] ? colNum(m[5]) : c1, r2 = m[6] ? Number(m[6]) - 1 : r1;
    out.push({ hoja: m[1] || m[2] || hojaActual, c1, r1, c2, r2, rango: !!m[5] });
  }
  return out;
}

// ------------------------------------------------------------------ búsqueda de rótulos
function celdasTexto(sh) {
  const { r0, c0, r1, c1 } = dims(sh), out = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const x = cel(sh, r, c); if (x && x.t === "s" && String(x.v).trim()) out.push({ r, c, t: String(x.v), n: norm(x.v) }); }
  return out;
}
function valorDerecha(sh, r, c, hastaC) {
  for (let cc = c + 1; cc <= hastaC; cc++) { const x = cel(sh, r, cc); if (x && (x.t === "n" || x.t === "e" || x.f || (x.t === "s" && String(x.v).trim()))) return { celda: x, r, c: cc }; }
  return null;
}
// Lee la columna de resultados: valores escritos (no fórmulas), empezando cerca del encabezado
function leerColumna(sh, c, desde, max = 90) {
  const datos = []; let vacias = 0;
  for (let r = desde; r < desde + max; r++) {
    const x = cel(sh, r, c), v = x && !x.f ? num(x) : null;
    if (v != null) { datos.push({ r, v }); vacias = 0; }
    else if (datos.length ? ++vacias >= 3 : r - desde >= 6) break;
  }
  return datos;
}

function tipoHoja(nombre) {
  const n = norm(nombre);
  if (/repetib/.test(n)) return "rep";
  if (/intermed|presic|precis/.test(n)) return "pi";
  if (/compara/.test(n)) return "comp";
  if (/veraci/.test(n)) return "ver";
  if (/incertid/.test(n)) return "inc";
  if (/lineal/.test(n)) return "lin";
  return null;
}
const TITULOS = { rep: "Repetibilidad", pi: "Precisión intermedia", comp: "Comparación de métodos", ver: "Veracidad", inc: "Incertidumbre", lin: "Linealidad" };

function nivelDe(nombre, i) {
  const n = norm(nombre);
  if (/normal|nivel i\b|nivel 1|\bn1\b/.test(n)) return "Normal (nivel I)";
  if (/bajo|nivel ii\b|nivel 2|\bn2\b/.test(n)) return "Bajo (nivel II)";
  if (/alto|nivel iii\b|nivel 3|\bn3\b/.test(n)) return "Alto (nivel III)";
  return ["Nivel I", "Nivel II", "Nivel III", "Nivel IV"][i] || `Nivel ${i + 1}`;
}

// Auditoría de fórmulas de media/DE sobre un rango de datos
function auditarFormula(f, filas, colDatos, hoja) {
  const avisos = [];
  if (!f) return avisos;
  if (/#REF!/.test(f)) avisos.push({ tipo: "mal", texto: "la fórmula tiene una referencia rota (#¡REF!)" });
  const refs = referencias(f, hoja).filter((x) => x.hoja === hoja);
  const rangos = refs.filter((x) => x.rango), sueltas = refs.filter((x) => !x.rango);
  const dentro = sueltas.filter((s) => rangos.some((g) => s.c1 >= g.c1 && s.c1 <= g.c2 && s.r1 >= g.r1 && s.r1 <= g.r2));
  if (dentro.length) avisos.push({ tipo: "mal", texto: `la fórmula suma ${dentro.length} celdas dos veces (incluye el rango y además las mismas celdas sueltas), lo que distorsiona la media y la DE` });
  if (filas.length && rangos.length) {
    const g = rangos[0], f0 = filas[0], f1 = filas[filas.length - 1];
    if (g.c1 === colDatos && (g.r1 > f0 || g.r2 < f1)) avisos.push({ tipo: "mal", texto: `el rango ${rangoDir(g.c1, g.r1, g.r2)} no cubre todos los datos (${rangoDir(colDatos, f0, f1)})` });
  }
  if (/STDEVA/.test(f)) avisos.push({ tipo: "info", texto: "usa DESVESTA (cuenta textos como 0); es más seguro DESVEST.M" });
  return avisos;
}

// ------------------------------------------------------------------ análisis por hoja
function bloquesPrecision(sh, hoja) {
  const textos = celdasTexto(sh);
  const enc = textos.filter((t) => t.n === "resultado").sort((a, b) => a.c - b.c);
  const bloques = [];
  enc.forEach((h, i) => {
    const zona0 = Math.max(0, h.c - 2), zona1 = i + 1 < enc.length ? enc[i + 1].c - 3 : dims(sh).c1;
    const datos = leerColumna(sh, h.c, h.r + 1);
    const enZona = textos.filter((t) => t.c >= zona0 && t.c <= zona1);
    const nombreCel = enZona.filter((t) => /nombre de la prueba/.test(t.n) && t.r < h.r).sort((a, b) => b.r - a.r)[0];
    const nombre = nombreCel ? nombreCel.t.split(":").slice(1).join(":").trim() : "";
    const fechaH = textos.find((t) => t.n === "fecha" && t.r === h.r && Math.abs(t.c - h.c) <= 2);
    const fechas = fechaH ? datos.map((d) => num(cel(sh, d.r, fechaH.c))).filter((x) => x != null) : [];
    const lab = (pred) => {
      const t = enZona.find((x) => pred(x.n));
      if (!t) return null;
      const v = valorDerecha(sh, t.r, t.c, zona1);
      return { etiqueta: t.t, celdaEtiqueta: dir(t.r, t.c), r: t.r, c: t.c, valor: v ? num(v.celda) : null, texto: v ? txt(v.celda) : "", error: v && esError(v.celda) ? ERRORES[v.celda.v] || "error" : null, formula: v?.celda?.f || null, celda: v ? dir(v.r, v.c) : null };
    };
    bloques.push({
      nombre, nivel: nivelDe(nombre, i), col: h.c, filaEnc: h.r, datos, fechas, zona: [zona0, zona1],
      media: lab((n) => n === "media"), ds: lab((n) => n === "ds" || n === "de" || /^desviacion/.test(n)), cv: lab((n) => n === "cv"),
      eta: lab((n) => /^e?rr?or total permitido$|^eror total permitido$/.test(n) || n === "error total permitido" || n === "eror total permitido"),
      criterio: lab((n) => /total permitido ?\*/.test(n)), mediaInserto: lab((n) => /^media inserto/.test(n)), rangoInserto: lab((n) => /^rango inserto/.test(n)),
      conclusion: enZona.find((t) => /^conclusion/.test(t.n)), reactivo: enZona.find((t) => /^(rvo|reactivo)/.test(t.n)),
      sesgo: lab((n) => n === "sesgo"), incert: lab((n) => n === "incertidumbre"), grupoPar: lab((n) => /valor del grupo par/.test(n)),
      objetivo: lab((n) => /^incertidumbre obj/.test(n)), intervalo: lab((n) => /^intervalo calculado/.test(n)), etClia: lab((n) => /^et por clia|^error total$/.test(n)),
      hoja,
    });
  });
  return bloques;
}

function analizarPrecision(sh, hoja, tipo) {
  const bloques = bloquesPrecision(sh, hoja);
  const factorDef = tipo === "rep" ? 0.25 : 0.33;
  const sec = { id: tipo, titulo: TITULOS[tipo], hoja, niveles: [], hallazgos: [], graficos: [] };
  const etas = new Set();
  for (const b of bloques) {
    const v = b.datos.map((d) => d.v);
    const nv = { nivel: b.nivel, nombre: b.nombre, n: v.length, celdas: b.datos.length ? rangoDir(b.col, b.datos[0].r, b.datos[b.datos.length - 1].r) : null, bloque: b };
    if (v.length >= 2) { nv.media = media(v); nv.de = de(v); nv.cv = (100 * nv.de) / nv.media; }
    nv.archivo = { media: b.media?.valor, de: b.ds?.valor, cv: b.cv?.valor };
    const eta = b.eta?.valor;
    if (eta != null) etas.add(eta);
    const fac = Number(String(b.criterio?.etiqueta || "").match(/\*\s*([0-9]+[.,][0-9]+)/)?.[1]?.replace(",", ".")) || factorDef;
    nv.eta = eta; nv.factor = fac; nv.criterio = eta != null ? eta * fac : null;
    nv.cumple = nv.cv != null && nv.criterio != null ? nv.cv <= nv.criterio : null;
    nv.conclusionArchivo = b.conclusion ? b.conclusion.t.replace(/^conclusi[oó]n:?\s*/i, "") : "";
    if (b.mediaInserto?.valor != null && b.rangoInserto) {
      const m = /([\d.,]+)\s*-\s*([\d.,]+)/.exec(b.rangoInserto.texto || "");
      if (m && nv.media != null) { const lo = Number(m[1].replace(",", ".")), hi = Number(m[2].replace(",", ".")); nv.inserto = { media: b.mediaInserto.valor, lo, hi, dentro: nv.media >= lo && nv.media <= hi }; }
    }
    nv.diasDistintos = new Set(b.fechas).size;
    // auditorías
    for (const [k, nombreK] of [["media", "media"], ["ds", "DE"]]) {
      const x = b[k];
      if (x?.error && v.length) sec.hallazgos.push({ tipo: "mal", texto: `${b.nivel}: la celda de la ${nombreK} (${x.celda}) muestra ${x.error}.`, celda: x.celda });
      for (const a of auditarFormula(x?.formula, b.datos.map((d) => d.r), b.col, hoja)) sec.hallazgos.push({ tipo: a.tipo, texto: `${b.nivel}: en ${x.celda} (${nombreK}) ${a.texto}. Fórmula actual: ${aEspanol(x.formula)}`, celda: x.celda, excel: k === "media" ? `=PROMEDIO(${nv.celdas})` : `=DESVEST.M(${nv.celdas})` });
    }
    if (nv.cv != null && nv.archivo.cv != null && Math.abs(nv.cv - nv.archivo.cv) > 0.005 * Math.max(1, nv.cv)) sec.hallazgos.push({ tipo: "alerta", texto: `${b.nivel}: el CV del archivo (${fmt(nv.archivo.cv, 3)} %) difiere del recalculado (${fmt(nv.cv, 3)} %).` });
    if (nv.n && nv.n < 20) sec.hallazgos.push({ tipo: "alerta", texto: `${b.nivel}: solo ${nv.n} resultados (lo habitual son 20).` });
    if (tipo === "pi" && nv.n >= 5 && nv.diasDistintos > 0 && nv.diasDistintos < Math.min(nv.n, 10)) sec.hallazgos.push({ tipo: "alerta", texto: `${b.nivel}: los datos de precisión intermedia abarcan solo ${nv.diasDistintos} fechas distintas; deben provenir de días diferentes.` });
    if (tipo === "rep" && nv.diasDistintos > 1) sec.hallazgos.push({ tipo: "info", texto: `${b.nivel}: la repetibilidad debería hacerse en una sola corrida; hay ${nv.diasDistintos} fechas distintas.` });
    if (nv.inserto && !nv.inserto.dentro) sec.hallazgos.push({ tipo: "alerta", texto: `${b.nivel}: la media obtenida (${fmt(nv.media)}) está fuera del rango del inserto (${nv.inserto.lo}–${nv.inserto.hi}).` });
    if (nv.cumple === false) sec.hallazgos.push({ tipo: "mal", texto: `${b.nivel}: CV ${fmt(nv.cv)} % supera el criterio (${fmt(nv.criterio)} % = ${fac} × ETa ${fmt(eta)} %).` });
    if (nv.n) sec.niveles.push(nv);
    if (v.length) sec.graficos.push({ tipo: "lj", titulo: `${TITULOS[tipo]} — ${b.nivel}`, media: nv.media, de: nv.de, puntos: b.datos.map((d, i) => ({ corrida: i + 1, valor: d.v, z: (d.v - nv.media) / nv.de, estado: Math.abs((d.v - nv.media) / nv.de) > 3 ? "RECHAZO" : Math.abs((d.v - nv.media) / nv.de) > 2 ? "alerta" : "aceptada" })) });
  }
  if (etas.size > 1) sec.hallazgos.push({ tipo: "alerta", texto: `Se usan ETa distintos entre niveles (${[...etas].map((e) => fmt(e)).join(" % y ")} %). Verifique que sea intencional y declare la fuente de cada uno (variación biológica, CLIA…).` });
  if (sec.niveles.length && sec.niveles.every((n) => n.cumple)) sec.hallazgos.push({ tipo: "ok", texto: `Todos los niveles cumplen el criterio CV ≤ ${sec.niveles[0].factor} × ETa.` });
  sec.estado = estadoDe(sec);
  sec.tablas = sec.niveles.length ? [{ titulo: "Archivo vs recalculado por PatricIA", columnas: ["Nivel", "n", "Media (archivo)", "Media (recalc.)", "DE (archivo)", "DE (recalc.)", "CV % (archivo)", "CV % (recalc.)", "Criterio %", "Resultado"],
    filas: sec.niveles.map((n) => [n.nivel, n.n, r4(n.archivo.media, 4), r4(n.media, 4), r4(n.archivo.de, 4), r4(n.de, 4), r4(n.archivo.cv, 3), r4(n.cv, 3), r4(n.criterio, 3), n.cumple == null ? "—" : n.cumple ? "cumple" : "NO cumple"]) }] : [];
  if (!sec.niveles.length) { sec.estado = "vacio"; sec.hallazgos.push({ tipo: "info", texto: "La hoja no tiene datos (plantilla vacía)." }); }
  return sec;
}

function analizarComparacion(sh, hoja, eta) {
  const textos = celdasTexto(sh);
  const sec = { id: "comp", titulo: TITULOS.comp, hoja, hallazgos: [], graficos: [], tablas: [] };
  const hy = textos.find((t) => /^y \(datos a validar/.test(t.n)), hx = textos.find((t) => /^x \(datos de compara/.test(t.n));
  sec.metodoValidar = (textos.find((t) => /^metodo a validar/.test(t.n))?.t || "").split(":").slice(1).join(":").trim();
  sec.metodoComparacion = (textos.find((t) => /^metodo de comparacion/.test(t.n))?.t || "").split(":").slice(1).join(":").trim();
  if (!hy || !hx) { sec.estado = "vacio"; sec.hallazgos.push({ tipo: "info", texto: "No se encontraron las columnas Y / X." }); return sec; }
  const filas = [];
  for (let r = hy.r + 1; r < hy.r + 120; r++) { const y = num(cel(sh, r, hy.c)), x = num(cel(sh, r, hx.c)); if (y != null && x != null) filas.push({ r, y, x }); else if (filas.length && y == null && x == null && num(cel(sh, r + 1, hy.c)) == null) break; }
  sec.n = filas.length; sec.celdasY = filas.length ? rangoDir(hy.c, filas[0].r, filas[filas.length - 1].r) : null; sec.celdasX = filas.length ? rangoDir(hx.c, filas[0].r, filas[filas.length - 1].r) : null;
  const resultado = (nombre) => textos.filter((t) => t.n === nombre).map((t) => ({ t, v: valorDerecha(sh, t.r, t.c, t.c + 3) })).find((o) => o.v && (o.v.celda.f || o.v.celda.t === "n" || o.v.celda.t === "e"));
  const pend = resultado("pendiente"), inter = resultado("intercepto");
  sec.archivo = { pendiente: pend ? num(pend.v.celda) : null, intercepto: inter ? num(inter.v.celda) : null, celdaPendiente: pend ? dir(pend.v.r, pend.v.c) : null, celdaIntercepto: inter ? dir(inter.v.r, inter.v.c) : null };
  const critTxt = textos.find((t) => t.n === "pendiente" && (!pend || t.r !== pend.t.r));
  sec.criterioPendiente = critTxt ? txt(valorDerecha(sh, critTxt.r, critTxt.c, critTxt.c + 3)?.celda) : "";
  for (const o of [pend, inter]) {
    if (!o?.v?.celda?.f) continue;
    const f = o.v.celda.f, refs = referencias(f, hoja).filter((x) => x.rango);
    if (/#REF!/.test(f)) sec.hallazgos.push({ tipo: "mal", texto: `${o.t.t} (${dir(o.v.r, o.v.c)}) tiene una referencia rota (#¡REF!).` });
    if (!filas.length && refs.some((g) => g.r1 <= hy.r)) {
      const g = refs[0];
      sec.hallazgos.push({ tipo: "mal", texto: `${o.t.t} (${dir(o.v.r, o.v.c)}): la fórmula ${aEspanol(f)} empieza en la fila ${g.r1 + 1}, por encima del encabezado (fila ${hy.r + 1}). Los datos empiezan en la fila ${hy.r + 2}, así que las últimas ${hy.r + 1 - g.r1} muestras quedarán por fuera del cálculo.`, celda: dir(o.v.r, o.v.c),
        excel: `=${o === pend ? "PENDIENTE" : "INTERSECCION.EJE"}(${letra(hy.c)}${hy.r + 2}:${letra(hy.c)}${hy.r + 2 + (g.r2 - g.r1)};${letra(hx.c)}${hy.r + 2}:${letra(hx.c)}${hy.r + 2 + (g.r2 - g.r1)})` });
    }
    if (filas.length && refs.length) {
      const f0 = filas[0].r, f1 = filas[filas.length - 1].r;
      if (refs.some((g) => g.r1 !== f0 || g.r2 < f1)) {
        sec.hallazgos.push({ tipo: "mal", texto: `${o.t.t} (${dir(o.v.r, o.v.c)}): la fórmula ${aEspanol(f)} usa filas ${refs[0].r1 + 1}–${refs[0].r2 + 1}, pero los datos están en las filas ${f0 + 1}–${f1 + 1}; deja muestras por fuera.`, celda: dir(o.v.r, o.v.c),
          excel: o === pend ? `=PENDIENTE(${sec.celdasY};${sec.celdasX})` : `=INTERSECCION.EJE(${sec.celdasY};${sec.celdasX})` });
      }
    }
    if (/^SLOPE\(\s*\$?D/.test(f)) sec.hallazgos.push({ tipo: "alerta", texto: "PENDIENTE tiene los argumentos invertidos: el primero debe ser Y (método a validar)." });
  }
  if (filas.length < 3) {
    sec.estado = "vacio";
    if (!filas.length) sec.hallazgos.push({ tipo: "info", texto: "La hoja no tiene datos (plantilla vacía)." });
    return sec;
  }
  const x = filas.map((f) => f.x), y = filas.map((f) => f.y);
  let sxy = 0, sxx = 0; const mx = media(x), my = media(y);
  x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; });
  sec.ols = { b: sxy / sxx, a: my - (sxy / sxx) * mx };
  if (filas.length >= 10) {
    sec.calc = comparacionMetodos({ pares: filas.map((f) => ({ x: f.x, y: f.y })), relativo: true, decisiones: [], nombreX: sec.metodoComparacion || "Comparativo", nombreY: sec.metodoValidar || "A validar" });
    sec.graficos = sec.calc.graficos;
    sec.pb = sec.calc.datos?.pb;
  }
  // límites individuales X ± ETa %
  if (eta != null) {
    sec.fueraETa = filas.filter((f) => Math.abs(f.y - f.x) > (Math.abs(f.x) * eta) / 100);
    sec.hallazgos.push(sec.fueraETa.length ? { tipo: "mal", texto: `${sec.fueraETa.length} de ${filas.length} muestras tienen una diferencia mayor que el ETa (${fmt(eta)} %).` } : { tipo: "ok", texto: `Todas las muestras (${filas.length}) quedan dentro de X ± ETa (${fmt(eta)} %).` });
  }
  // influencia de valores extremos en la regresión por mínimos cuadrados
  const med = [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)];
  const extremos = filas.filter((f) => f.x > 3 * med);
  if (extremos.length && extremos.length <= 2) {
    const resto = filas.filter((f) => !extremos.includes(f)); const rx = resto.map((f) => f.x), ry = resto.map((f) => f.y);
    let a2 = 0, b2 = 0; const mx2 = media(rx), my2 = media(ry); rx.forEach((v, i) => { a2 += (v - mx2) * (ry[i] - my2); b2 += (v - mx2) ** 2; });
    sec.sinExtremos = { b: a2 / b2, a: my2 - (a2 / b2) * mx2, extremos };
    sec.hallazgos.push({ tipo: "alerta", texto: `La muestra con X = ${extremos.map((e) => fmt(e.x)).join(", ")} está muy lejos del resto y domina la regresión por mínimos cuadrados: con ella la pendiente es ${fmt(sec.ols.b, 4)}; sin ella, ${fmt(sec.sinExtremos.b, 4)}. Distribuya las muestras de forma pareja en todo el intervalo.` });
  }
  if (filas.length < 40) sec.hallazgos.push({ tipo: "alerta", texto: `Se usaron ${filas.length} muestras; CLSI EP09 recomienda en general ≥ 40 distribuidas en todo el intervalo de medida.` });
  if (sec.calc) {
    const pb = sec.calc.tablas[0].filas[0];
    sec.hallazgos.push({ tipo: "info", texto: `Passing-Bablok: pendiente ${pb[1]} (IC 95 % ${pb[2]}), intercepto ${pb[3]} (IC 95 % ${pb[4]}). El criterio "pendiente 0,9–1,1" es más robusto si se evalúa con el intervalo de confianza y no solo con el valor puntual.` });
    for (const m of sec.calc.mensajes) sec.hallazgos.push({ tipo: m.tipo === "ok" ? "ok" : "alerta", texto: m.texto });
  }
  if (sec.archivo.pendiente != null && Math.abs(sec.archivo.pendiente - sec.ols.b) > 1e-6) sec.hallazgos.push({ tipo: "alerta", texto: `La pendiente del archivo (${fmt(sec.archivo.pendiente, 4)}) no coincide con la de todos los datos (${fmt(sec.ols.b, 4)}).` });
  const vacioIntervalo = textos.find((t) => /^intervalo dinamico/.test(t.n));
  if (vacioIntervalo && !valorDerecha(sh, vacioIntervalo.r, vacioIntervalo.c, vacioIntervalo.c + 6)) sec.hallazgos.push({ tipo: "info", texto: `"Intervalo dinámico comunicable" está vacío: documente el intervalo de medida verificado (rango cubierto por las muestras: ${fmt(Math.min(...x))} a ${fmt(Math.max(...x))}).` });
  sec.tablas.push({ titulo: "Regresión: archivo vs recalculado", columnas: ["Método", "Pendiente", "Intercepto"], filas: [
    ["Archivo (mínimos cuadrados)", r4(sec.archivo.pendiente, 4), r4(sec.archivo.intercepto, 4)], ["Mínimos cuadrados, todos los datos", r4(sec.ols.b, 4), r4(sec.ols.a, 4)],
    ...(sec.sinExtremos ? [["Mínimos cuadrados sin el valor extremo", r4(sec.sinExtremos.b, 4), r4(sec.sinExtremos.a, 4)]] : []),
    ...(sec.calc ? sec.calc.tablas[0].filas.map((f) => [f[0] + " (IC 95 %)", `${f[1]} (${f[2]})`, `${f[3]} (${f[4]})`]) : [])] });
  sec.estado = estadoDe(sec);
  return sec;
}

function analizarVeracidad(sh, hoja, cvsPI, eta) {
  const textos = celdasTexto(sh);
  const sec = { id: "ver", titulo: TITULOS.ver, hoja, hallazgos: [], graficos: [], tablas: [], niveles: [] };
  const hy = textos.find((t) => /^y \(datos a validar/.test(t.n)), hx = textos.find((t) => /^x \(datos de compara/.test(t.n));
  sec.comparacion = (textos.find((t) => /^metodo de comparacion/.test(t.n))?.t || "").split(":").slice(1).join(":").trim();
  const lab = (re) => { const t = textos.find((x) => re.test(x.n)); if (!t) return null; const v = valorDerecha(sh, t.r, t.c, t.c + 3); return v ? { celda: dir(v.r, v.c), valor: num(v.celda), f: v.celda.f, error: esError(v.celda) ? ERRORES[v.celda.v] : null } : null; };
  sec.archivo = { sesgoPct: lab(/^sesgo en porcentaje/), et: [lab(/^error total nivel i$/), lab(/^error total nivel ii$/), lab(/^error total nivel iii$/)] };
  for (const [i, e] of sec.archivo.et.entries()) if (e?.error || /#REF!/.test(e?.f || "")) sec.hallazgos.push({ tipo: "mal", texto: `"Error total Nivel ${["I", "II", "III"][i]}" (${e.celda}) tiene una referencia rota (#¡REF!): la fórmula perdió la celda del CV de precisión intermedia. Fórmula actual: ${aEspanol(e.f)}`, celda: e.celda });
  const etF = sec.archivo.et.find((e) => e?.f && !/#REF!/.test(e.f));
  if (etF && /\+\s*VERACIDAD!\$?O\$?\d+|\+\s*\$?O\$?\d+/.test(etF.f) && !/ABS/i.test(etF.f)) sec.hallazgos.push({ tipo: "mal", texto: `El error total se calcula como 1,65 × CV + sesgo **con signo** y con un sesgo **agrupado** de todos los niveles (${aEspanol(etF.f)}). Un sesgo negativo resta y subestima el error total; debe usarse |sesgo| de cada nivel.`, excel: "=1,65*CV_nivel+ABS(sesgo%_nivel)" });
  const div = textos.length && Object.keys(sh).filter((k) => !k.startsWith("!")).map((k) => ({ k, f: sh[k].f })).find((o) => o.f && /^[A-Z]+\d+\/\d+$/.test(o.f));
  if (!hy || !hx) { sec.estado = "vacio"; sec.hallazgos.push({ tipo: "info", texto: "No se encontraron las columnas Y / X." }); sec.estado = estadoDe(sec); return sec; }
  const filas = [];
  for (let r = hy.r + 1; r < hy.r + 200; r++) { const y = num(cel(sh, r, hy.c)), x = num(cel(sh, r, hx.c)); if (y != null && x != null) filas.push({ r, y, x }); else if (filas.length && num(cel(sh, r + 1, hy.c)) == null) break; }
  sec.n = filas.length;
  if (div && filas.length) { const d = Number(div.f.split("/")[1]); if (d !== filas.length) sec.hallazgos.push({ tipo: "mal", texto: `En ${div.k} la fórmula divide por ${d} fijo, pero hay ${filas.length} datos. Use =PROMEDIO(...) en lugar de SUMA/${d}.` }); else sec.hallazgos.push({ tipo: "info", texto: `En ${div.k} se divide por ${d} fijo (=${div.f}); funciona con ${d} datos, pero falla si cambia el número de datos. Prefiera =PROMEDIO(...).` }); }
  if (!filas.length) { sec.estado = "vacio"; sec.hallazgos.push({ tipo: "info", texto: "La hoja no tiene datos (plantilla vacía)." }); return sec; }
  // niveles: grupos consecutivos con el mismo valor X
  const grupos = [];
  for (const f of filas) { const g = grupos[grupos.length - 1]; if (g && Math.abs(g.x - f.x) < 1e-9) g.filas.push(f); else grupos.push({ x: f.x, filas: [f] }); }
  const nombres = ["Nivel I", "Nivel II", "Nivel III", "Nivel IV", "Nivel V"];
  sec.agrupado = media(filas.map((f) => ((f.y - f.x) / f.x) * 100));
  grupos.forEach((g, i) => {
    const y = g.filas.map((f) => f.y), m = media(y), sesgo = m - g.x, pct = (100 * sesgo) / g.x;
    const cv = cvsPI[i] ?? null, et = cv != null ? 1.65 * cv + Math.abs(pct) : null;
    sec.niveles.push({ nivel: nombres[i] || `Nivel ${i + 1}`, n: y.length, x: g.x, media: m, sesgo, sesgoPct: pct, cv, et, eta, cumple: et != null && eta != null ? et <= eta : null, celdas: rangoDir(hy.c, g.filas[0].r, g.filas[g.filas.length - 1].r) });
  });
  if (grupos.length > 1 && grupos.length <= 5) {
    const signos = new Set(sec.niveles.map((n) => Math.sign(n.sesgoPct)));
    sec.hallazgos.push({ tipo: signos.size > 1 ? "mal" : "alerta", texto: `El archivo reporta un único sesgo agrupado (${fmt(sec.agrupado, 3)} %), pero el sesgo por nivel es ${sec.niveles.map((n) => `${n.nivel}: ${fmt(n.sesgoPct, 2)} %`).join("; ")}.${signos.size > 1 ? " Los sesgos de distinto signo se compensan al promediarlos y ocultan el sesgo real de cada nivel." : ""} La veracidad debe evaluarse por nivel.` });
  }
  for (const n of sec.niveles) if (n.cumple != null) sec.hallazgos.push({ tipo: n.cumple ? "ok" : "mal", texto: `${n.nivel}: ET = 1,65 × ${fmt(n.cv, 2)} % + |${fmt(n.sesgoPct, 2)} %| = ${fmt(n.et, 2)} % ${n.cumple ? "≤" : ">"} ETa ${fmt(eta)} % → ${n.cumple ? "cumple" : "NO cumple"}` + (sec.archivo.et[sec.niveles.indexOf(n)]?.valor != null ? ` (el archivo reporta ${fmt(sec.archivo.et[sec.niveles.indexOf(n)].valor, 2)} %).` : ".") });
  if (/grupo par|par/i.test(sec.comparacion)) sec.hallazgos.push({ tipo: "info", texto: "El valor de comparación es la media del grupo par: sirve para estimar el sesgo frente a laboratorios con el mismo método, no frente a un valor de referencia. Si el material no es conmutable, no evalúa la veracidad absoluta." });
  const pendV = lab(/^pendiente$/);
  if (pendV?.valor != null && grupos.length <= 4) sec.hallazgos.push({ tipo: "info", texto: `La pendiente/intercepto de esta hoja (${fmt(pendV.valor, 4)}) se calcula con solo ${grupos.length} valores distintos de X; tiene poco valor para evaluar sesgo proporcional.` });
  sec.tablas.push({ titulo: "Sesgo y error total por nivel (recalculado)", columnas: ["Nivel", "n", "Valor de comparación (X)", "Media obtenida", "Sesgo", "Sesgo %", "CV PI %", "ET %", "ETa %", "Resultado"],
    filas: sec.niveles.map((n) => [n.nivel, n.n, r4(n.x, 3), r4(n.media, 3), r4(n.sesgo, 3), r4(n.sesgoPct, 2), r4(n.cv, 2), r4(n.et, 2), r4(n.eta, 2), n.cumple == null ? "—" : n.cumple ? "cumple" : "NO cumple"]) });
  sec.graficos.push({ tipo: "sesgoNiveles", titulo: "Sesgo % por nivel vs sesgo agrupado", etiquetas: sec.niveles.map((n) => n.nivel), valores: sec.niveles.map((n) => n.sesgoPct), agrupado: sec.agrupado });
  sec.estado = estadoDe(sec);
  return sec;
}

function analizarIncertidumbre(sh, hoja, sesgosVer, eta) {
  const bloques = bloquesPrecision(sh, hoja);
  const sec = { id: "inc", titulo: TITULOS.inc, hoja, hallazgos: [], graficos: [], tablas: [], niveles: [] };
  const sesgosArchivo = new Set();
  bloques.forEach((b, i) => {
    const v = b.datos.map((d) => d.v);
    const nv = { nivel: b.nivel, n: v.length };
    if (v.length >= 2) { nv.media = media(v); nv.de = de(v); nv.cv = (100 * nv.de) / nv.media; }
    nv.archivo = { sesgo: b.sesgo?.valor, u: b.incert?.valor, objetivo: b.objetivo?.valor, grupoPar: b.grupoPar?.valor };
    if (b.sesgo?.valor != null) sesgosArchivo.add(r4(b.sesgo.valor, 6));
    const sv = sesgosVer[i];
    if (nv.cv != null) {
      nv.uNordtest = sv != null ? Math.hypot(nv.cv, sv) : null; // relativa %
      nv.objetivoRel = eta != null ? eta / Math.sqrt(6) : null;
    }
    // fórmulas del objetivo / intervalo
    if (b.objetivo?.formula && b.intervalo) {
      const refs = referencias(b.objetivo.formula, hoja);
      if (refs.some((x) => x.r1 !== b.intervalo.r)) sec.hallazgos.push({ tipo: "mal", texto: `${b.nivel}: "Incertidumbre objetivo" (${b.objetivo.celda}) = ${aEspanol(b.objetivo.formula)} apunta a la fila ${refs[0].r1 + 1}, no a la del intervalo calculado (fila ${b.intervalo.r + 1}).`, celda: b.objetivo.celda });
    }
    if (b.intervalo?.formula && b.grupoPar) {
      const refs = referencias(b.intervalo.formula, hoja), filasOk = new Set([b.grupoPar.r, b.etClia?.r].filter((x) => x != null));
      const malas = refs.filter((x) => !filasOk.has(x.r1));
      if (malas.length) sec.hallazgos.push({ tipo: "mal", texto: `${b.nivel}: el intervalo (${b.intervalo.celda}) = ${aEspanol(b.intervalo.formula)} usa ${malas.map((x) => dir(x.r1, x.c1)).join(", ")}, que no es la celda del error total${b.etClia ? ` (${b.etClia.celda || "fila " + (b.etClia.r + 1)})` : ""}.`, celda: b.intervalo.celda });
      const derecha = cel(sh, b.intervalo.r, colNum(b.intervalo.celda.replace(/\d+/g, "")) + 1);
      if (!derecha || (!derecha.f && derecha.t !== "n")) sec.hallazgos.push({ tipo: "mal", texto: `${b.nivel}: falta el límite superior del intervalo (a la derecha de ${b.intervalo.celda}); la incertidumbre objetivo queda mal calculada.` });
    }
    if (nv.n) sec.niveles.push(nv);
  });
  if (!sec.niveles.length) { sec.estado = estadoDe(sec) === "ok" ? "vacio" : estadoDe(sec); sec.hallazgos.push({ tipo: "info", texto: "La hoja no tiene datos (plantilla vacía)." }); return sec; }
  if (sesgosArchivo.size === 1 && sec.niveles.length > 1) sec.hallazgos.push({ tipo: "mal", texto: `Se usa el mismo sesgo (${fmt([...sesgosArchivo][0], 4)}, en unidades) para todos los niveles: es el sesgo agrupado de la hoja de veracidad. El sesgo debe ser el de cada nivel y, para combinarlo con la DE, en las mismas unidades o en %.` });
  if (sec.niveles.some((n) => n.archivo.u != null)) sec.hallazgos.push({ tipo: "alerta", texto: "La incertidumbre del archivo es u = √(DE² + sesgo²) en unidades, sin la incertidumbre del calibrador ni factor de cobertura. Según ISO/TS 20914: u_c = √(u(Rw)² + u(cal)²) con u(Rw) = CV de precisión intermedia a largo plazo, y U = 2·u_c. El sesgo no se suma salvo que se declare el modelo Nordtest (y entonces con su incertidumbre).", excel: "=RAIZ(CV^2+u_cal^2) y U: =2*u_c" });
  if (sec.niveles.some((n) => n.n < 60)) sec.hallazgos.push({ tipo: "info", texto: "La incertidumbre se estima con los mismos 20 datos de precisión intermedia. ISO/TS 20914 recomienda datos de CIC a largo plazo (≥ 6 meses, con cambios de lote y recalibraciones)." });
  sec.hallazgos.push({ tipo: "info", texto: `La "incertidumbre objetivo" del archivo = (ancho del intervalo X ± ETa)/(2√6), es decir ETa·X/√6 (distribución triangular). Es una opción documentable; alternativa EFLM: MAU deseable = 0,5·CVI.` });
  sec.tablas.push({ titulo: "Incertidumbre: archivo vs recalculada", columnas: ["Nivel", "n", "Media", "DE", "CV %", "Sesgo usado (archivo)", "u archivo", "u objetivo archivo", "u Nordtest % (CV y sesgo del nivel)", "u objetivo % (ETa/√6)", "¿u ≤ objetivo?"],
    filas: sec.niveles.map((n) => [n.nivel, n.n, r4(n.media, 3), r4(n.de, 4), r4(n.cv, 3), r4(n.archivo.sesgo, 4), r4(n.archivo.u, 4), r4(n.archivo.objetivo, 4), r4(n.uNordtest, 3), r4(n.objetivoRel, 3), n.uNordtest != null && n.objetivoRel != null ? (n.uNordtest <= n.objetivoRel ? "cumple" : "NO cumple") : "—"]) });
  sec.estado = estadoDe(sec);
  return sec;
}

function analizarLinealidad(sh, hoja, eta) {
  const textos = celdasTexto(sh);
  const sec = { id: "lin", titulo: TITULOS.lin, hoja, hallazgos: [], graficos: [], tablas: [] };
  const nota = textos.find((t) => /no se realiza/.test(t.n));
  const hy = textos.find((t) => /^y ?= ?valor obtenido/.test(t.n)), hx = textos.find((t) => /^x ?= ?valor teorico/.test(t.n));
  const r2 = textos.find((t) => /coef correla/.test(t.n));
  if (r2) { const v = valorDerecha(sh, r2.r, r2.c, r2.c + 2); if (v?.celda?.f && /RSQ/.test(v.celda.f)) sec.hallazgos.push({ tipo: "alerta", texto: `"${r2.t}" (${dir(v.r, v.c)}) calcula R² (COEFICIENTE.R2), no el coeficiente de correlación r. Corrija el rótulo. Además, un R² alto no demuestra linealidad: evalúe la desviación de cada nivel frente al ETa (CLSI EP06).`, celda: dir(v.r, v.c) }); }
  const filas = [];
  if (hy && hx) for (let r = hy.r + 1; r < hy.r + 40; r++) { const y = num(cel(sh, r, hy.c)), x = num(cel(sh, r, hx.c)); if (y != null && x != null && !(y === 0 && x === 0)) filas.push({ r, y, x }); }
  if (filas.length >= 3) {
    sec.niveles = filas.map((f) => ({ x: f.x, y: f.y, err: ((f.y - f.x) / f.x) * 100 }));
    sec.tablas.push({ titulo: "Recuperación por nivel", columnas: ["X teórico", "Y obtenido", "Error %", eta != null ? `vs ETa ${fmt(eta)} %` : "—"], filas: sec.niveles.map((n) => [n.x, n.y, r4(n.err, 2), eta != null ? (Math.abs(n.err) <= eta ? "cumple" : "NO cumple") : "—"]) });
  } else sec.hallazgos.push({ tipo: "info", texto: nota ? `Nota del archivo: "${nota.t.slice(0, 160)}…"` : "La hoja no tiene datos de linealidad." });
  sec.estado = filas.length >= 3 ? estadoDe(sec) : sec.hallazgos.some((h) => h.tipo === "mal" || h.tipo === "alerta") ? "alerta" : "vacio";
  return sec;
}

function estadoDe(sec) {
  if (sec.hallazgos.some((h) => h.tipo === "mal")) return "mal";
  if (sec.hallazgos.some((h) => h.tipo === "alerta")) return "alerta";
  return "ok";
}

// ------------------------------------------------------------------ análisis completo
export function analizarLibro(wb, nombreArchivo = "") {
  const hojas = {};
  for (const n of wb.SheetNames) { const t = tipoHoja(n); if (t && !hojas[t]) hojas[t] = n; }
  if (Object.keys(hojas).length < 2) throw new Error("No reconozco este archivo como un formato de verificación (se esperan hojas como REPETIBILIDAD, PRESIC. INTERMEDIA, COMPARACION DE METODOS, VERACIDAD, INCERTIDUMBRE).");
  const inf = { archivo: nombreArchivo, hojas, secciones: [] };
  const rep = hojas.rep ? analizarPrecision(wb.Sheets[hojas.rep], hojas.rep, "rep") : null;
  const pi = hojas.pi ? analizarPrecision(wb.Sheets[hojas.pi], hojas.pi, "pi") : null;
  const eta = rep?.niveles?.[0]?.eta ?? pi?.niveles?.[0]?.eta ?? (rep && bloquesPrecision(wb.Sheets[hojas.rep], hojas.rep)[0]?.eta?.valor) ?? null;
  const comp = hojas.comp ? analizarComparacion(wb.Sheets[hojas.comp], hojas.comp, eta) : null;
  const ver = hojas.ver ? analizarVeracidad(wb.Sheets[hojas.ver], hojas.ver, (pi?.niveles || []).map((n) => n.cv), eta) : null;
  const inc = hojas.inc ? analizarIncertidumbre(wb.Sheets[hojas.inc], hojas.inc, (ver?.niveles || []).map((n) => n.sesgoPct), eta) : null;
  const lin = hojas.lin ? analizarLinealidad(wb.Sheets[hojas.lin], hojas.lin, eta) : null;
  inf.secciones = [rep, pi, comp, ver, inc, lin].filter(Boolean);
  inf.eta = eta;
  const nb = (rep || pi)?.niveles?.[0]?.nombre || "";
  inf.prueba = (nb.split(/nivel|control/i)[0] || "").trim() || "(sin nombre de prueba)";
  inf.metodo = comp?.metodoValidar || "";
  inf.comparador = comp?.metodoComparacion || "";
  inf.esPlantilla = inf.secciones.every((s) => s.estado === "vacio" || !(s.niveles?.length || s.n));
  // hallazgos generales del libro
  const generales = [];
  const todas = wb.SheetNames.flatMap((n) => celdasTexto(wb.Sheets[n]).map((t) => ({ ...t, hoja: n })));
  if (todas.some((t) => /grafica/.test(t.n) && /no esta graficando/.test(t.n))) generales.push({ tipo: "alerta", texto: "El archivo advierte que una gráfica \"no está graficando bien\". Lo más probable es que la serie del gráfico tenga los datos copiados como valores fijos {…} en vez de referencias a celdas, por eso no se actualiza al cambiar los datos. Ver «Cómo hacerlo en Excel → Gráficos»." });
  const CORRECCION = { eror: "error", presicion: "precisión", presic: "precisión", tiepmpo: "tiempo", superios: "superior", pagina: "página" };
  const typos = [...new Set(todas.flatMap((t) => (t.n.match(/\b(eror|presicion|presic|tiepmpo|superios)\b/g) || [])))];
  if (typos.length) generales.push({ tipo: "info", texto: `Errores de ortografía en rótulos del formato: ${typos.map((t) => `«${t.toUpperCase()}» → «${CORRECCION[t].toUpperCase()}»`).join(", ")}. En un documento controlado conviene corregirlos.` });
  const refRotas = wb.SheetNames.flatMap((n) => Object.entries(wb.Sheets[n]).filter(([k, c]) => !k.startsWith("!") && c.f && /#REF!/.test(c.f)).map(([k]) => `${n}!${k}`));
  if (refRotas.length) generales.push({ tipo: "mal", texto: `Hay ${refRotas.length} fórmula(s) con referencias rotas #¡REF!: ${refRotas.join(", ")}.` });
  inf.generales = generales;
  inf.hallazgos = [...generales.map((h) => ({ ...h, seccion: "General" })), ...inf.secciones.flatMap((s) => s.hallazgos.map((h) => ({ ...h, seccion: s.titulo, id: s.id })))];
  inf.conteo = { mal: inf.hallazgos.filter((h) => h.tipo === "mal").length, alerta: inf.hallazgos.filter((h) => h.tipo === "alerta").length, ok: inf.hallazgos.filter((h) => h.tipo === "ok").length };
  return inf;
}

// ------------------------------------------------------------------ guía de Excel con las celdas del archivo
export function guiaExcel(id, inf) {
  const s = inf?.secciones.find((x) => x.id === id);
  const sep = "> En Excel en español (Colombia) los argumentos se separan con **punto y coma (;)** y los decimales con **coma**. Si su Excel usa coma como separador, cambie `;` por `,`.";
  const n0 = s?.niveles?.[0];
  if (id === "rep" || id === "pi") {
    const rango = n0?.celdas || "C15:C34";
    const b = n0?.bloque, cm = b?.media?.celda || "G22", cd = b?.ds?.celda || "G23", cc = b?.cv?.celda || "G24", ce = b?.eta?.celda || "G25";
    return `### ${TITULOS[id]} en Excel (${n0 ? n0.nivel : "nivel"})\n${sep}\n\n| Celda | Qué calcula | Fórmula correcta |\n|---|---|---|\n| ${cm} | Media | \`=PROMEDIO(${rango})\` |\n| ${cd} | Desviación estándar (muestral) | \`=DESVEST.M(${rango})\` |\n| ${cc} | CV % | \`=${cd}/${cm}*100\` |\n| criterio | ${id === "rep" ? "0,25" : "0,33"} × ETa | \`=${ce}*${id === "rep" ? "0,25" : "0,33"}\` |\n| conclusión | ¿Cumple? | \`=SI(${cc}<=${ce}*${id === "rep" ? "0,25" : "0,33"};"Cumple";"No cumple")\` |\n\n**Errores a evitar:**\n- No agregue las celdas sueltas además del rango: \`=PROMEDIO(${rango};C16;C17…)\` cuenta dos veces esos datos.\n- Use \`DESVEST.M\` (o \`DESVEST\`), no \`DESVESTA\`: esta última cuenta los textos como cero.\n- Verifique que el rango empiece en la **primera fila de datos** y termine en la última (las celdas combinadas del encabezado engañan).\n\n**Gráfico de control (tipo Levey-Jennings) en Excel:**\n1. Al lado de los datos cree columnas: \`Media\` (\`=$${cm.replace(/(\d+)/, "$$$1")}\`), \`+2DE\` (\`=Media+2*DE\`), \`−2DE\`, \`+3DE\`, \`−3DE\`, y cópielas hacia abajo para todas las filas.\n2. Seleccione la columna N, los resultados y las 5 columnas nuevas → **Insertar → Gráfico de líneas con marcadores**.\n3. Clic derecho en las series de límites → **Formato de serie de datos** → línea discontinua y sin marcadores (±2DE en ámbar, ±3DE en rojo).\n4. Clic derecho en el eje vertical → **Dar formato al eje** → fije los límites en media ± 4 DE para que se vean las bandas.`;
  }
  if (id === "comp") {
    const y = s?.celdasY || "C12:C31", x = s?.celdasX || "D12:D31";
    return `### Comparación de métodos en Excel\n${sep}\n\n| Qué | Fórmula |\n|---|---|\n| Pendiente (mínimos cuadrados) | \`=PENDIENTE(${y};${x})\` |\n| Intercepto | \`=INTERSECCION.EJE(${y};${x})\` |\n| R² | \`=COEFICIENTE.R2(${y};${x})\` |\n| Diferencia por muestra (columna nueva) | \`=C12-D12\` y copiar hacia abajo |\n| Diferencia % | \`=(C12-D12)/D12*100\` |\n| Sesgo medio % | \`=PROMEDIO(rango de diferencias %)\` |\n| Límites de acuerdo (Bland-Altman) | \`=PROMEDIO(dif)±1,96*DESVEST.M(dif)\` |\n| ¿Dentro de X ± ETa? | \`=SI(ABS(C12-D12)<=D12*ETa/100;"Sí";"No")\` |\n\n- El primer argumento de PENDIENTE es **Y (método a validar)** y el segundo **X (comparación)**.\n- El rango debe cubrir **todas** las filas con datos.\n- Excel no trae Passing-Bablok ni Deming: use la calculadora **Comparación de métodos** de PatricIA (puede pegar las dos columnas) y anote en el formato la pendiente y su IC 95 %.\n\n**Gráfico de dispersión con línea de regresión:**\n1. Seleccione X (comparación) y luego Y (a validar) → **Insertar → Dispersión (solo marcadores)**. Excel toma la primera columna como eje X.\n2. Clic en un punto → **Agregar línea de tendencia → Lineal** → marque *Presentar ecuación* y *Presentar R²*.\n3. Para la línea y = x: agregue una serie con dos puntos (mínimo y máximo) iguales en X e Y, en línea discontinua.\n\n**Gráfico de Bland-Altman:**\n1. Columnas nuevas: \`Promedio = (C12+D12)/2\` y \`Diferencia % = (C12-D12)/D12*100\`.\n2. **Insertar → Dispersión** con Promedio (X) y Diferencia (Y).\n3. Agregue tres series horizontales: sesgo medio y sesgo ± 1,96 DE (dos puntos cada una, en el mínimo y el máximo del promedio).`;
  }
  if (id === "ver") {
    const nv = s?.niveles || [];
    return `### Veracidad en Excel (por nivel)\n${sep}\n\nCalcule el sesgo **por separado para cada nivel**, nunca un solo promedio de todos:\n\n| Qué | Fórmula (ejemplo nivel I) |\n|---|---|\n| Media del nivel | \`=PROMEDIO(${nv[0]?.celdas || "B10:B29"})\` |\n| Sesgo absoluto | \`=media − valor de comparación\` |\n| Sesgo % | \`=(media−X)/X*100\` |\n| Error total del nivel | \`=1,65*CV_PI_nivel+ABS(sesgo%_nivel)\` |\n| ¿Cumple? | \`=SI(ET<=ETa;"Cumple";"No cumple")\` |\n\n${nv.length ? `Rangos de su archivo: ${nv.map((n) => `${n.nivel} → \`${n.celdas}\` (X = ${fmt(n.x, 3)})`).join("; ")}.\n\n` : ""}- Use \`ABS()\` para el sesgo dentro del error total: un sesgo negativo no reduce el error.\n- Reemplace divisiones fijas como \`=D71/60\` por \`=PROMEDIO(D10:D69)\`, que se adapta al número de datos.\n- Si una celda muestra **#¡REF!**, la fórmula apunta a una celda borrada: vuelva a escribirla, p. ej. \`=1,65*'PRESIC. INTERMEDIA'!O24+ABS(sesgo%_nivel_II)\`.`;
  }
  if (id === "inc") {
    return `### Incertidumbre (ISO/TS 20914) en Excel\n${sep}\n\n| Qué | Fórmula |\n|---|---|\n| u(Rw) % (CV de precisión intermedia) | \`=DESVEST.M(datos)/PROMEDIO(datos)*100\` |\n| u(cal) % | \`=U_certificado/k_certificado\` (del certificado del calibrador) |\n| u_c % | \`=RAIZ(uRw^2+ucal^2)\` |\n| U % (k = 2) | \`=2*u_c\` |\n| U en unidades | \`=U%*media/100\` |\n| MAU deseable (EFLM) | \`=0,5*CVI\` |\n| Modelo Nordtest (si decide incluir sesgo) | \`=RAIZ(CV^2+sesgo%_nivel^2+u_Cref^2)\` |\n\n- Trabaje todo en **%** (relativo) o todo en unidades, sin mezclar.\n- Use el sesgo **de cada nivel**, no el agrupado.\n- Reporte U con su k: «U = 0,6 s (k = 2, ~95 %)».\n- Si conserva la «incertidumbre objetivo» por intervalo: límite inferior \`=X-X*ETa/100\`, superior \`=X+X*ETa/100\` y objetivo \`=(superior−inferior)/(2*RAIZ(6))\`, con las celdas correctas.`;
  }
  if (id === "lin") {
    return `### Linealidad en Excel\n${sep}\n\n| Qué | Fórmula |\n|---|---|\n| Error % por nivel | \`=(Y−X)/X*100\` |\n| ¿Cumple? | \`=SI(ABS(error%)<=ETa;"Sí";"No")\` |\n| Pendiente / intercepto | \`=PENDIENTE(Y;X)\` / \`=INTERSECCION.EJE(Y;X)\` |\n| r (correlación) | \`=COEF.DE.CORREL(Y;X)\` — y R² es \`=COEFICIENTE.R2(Y;X)\` |\n\nUn R² alto no demuestra linealidad: evalúe la desviación de cada nivel. Gráfico: Dispersión X vs Y con línea de tendencia y la serie y = x.`;
  }
  if (id === "graficos") {
    return `### Reparar un gráfico que «no grafica bien»\nSi al hacer clic en la serie la barra de fórmulas muestra \`=SERIE(…;{10,2;11,7;…};{10,3;…};1)\` con números **entre llaves**, el gráfico tiene datos fijos copiados y no está conectado a las celdas.\n\n1. Clic derecho en el gráfico → **Seleccionar datos…**\n2. Elija la serie → **Editar**.\n3. En *Valores X* seleccione el rango de X de la tabla (p. ej. \`${inf?.secciones.find((x) => x.id === "comp")?.celdasX || "D12:D31"}\`) y en *Valores Y* el de Y (\`${inf?.secciones.find((x) => x.id === "comp")?.celdasY || "C12:C31"}\`).\n4. Repita para las series de límite inferior y superior (columnas «LIMITE INFERIOR» y «LIMITE SUPERIOR»).\n5. Guarde la plantilla: ahora el gráfico se actualizará con cada ejercicio.`;
  }
  return "";
}

// ------------------------------------------------------------------ preguntas sobre el archivo
const TEMAS = [["rep", /repetib/], ["pi", /intermedi|reproducib|precision intermedia|presic/], ["comp", /compara|pendiente|intercepto|regresion|passing|bland|metodo/], ["ver", /veracid|sesgo|error total|\bet\b|grupo par/], ["inc", /incertid|\bu\b|nordtest|20914/], ["lin", /lineal/]];
const NIVELES = [[0, /normal|nivel (i|1)\b|\bi\b(?!i)/], [1, /bajo|nivel (ii|2)\b/], [2, /alto|nivel (iii|3)\b/]];

export function sugerenciasArchivo(inf) {
  const s = ["¿Qué problemas tiene este archivo?", "¿Pasa la repetibilidad?", "¿Cuál es el CV del control bajo en precisión intermedia?", "¿Cuál es el sesgo de cada nivel?", "¿Cómo calculo la pendiente en Excel?", "¿Cómo hago el gráfico de Levey-Jennings en Excel?", "¿Cómo corrijo el gráfico que no grafica bien?", "¿Cómo calculo la incertidumbre en Excel?"];
  if (inf?.esPlantilla) return ["¿Qué problemas tiene esta plantilla?", "¿Qué fórmula uso para la media y la DE?", "¿Cómo calculo la pendiente en Excel?", "¿Cómo corrijo el error #¡REF!?", "¿Cómo calculo la incertidumbre en Excel?", "¿Cómo hago el gráfico de Bland-Altman en Excel?"];
  return s;
}

export function responderArchivo(q, inf) {
  const n = norm(q);
  const tema = TEMAS.find(([, re]) => re.test(n))?.[0] || null;
  const nivel = NIVELES.find(([, re]) => re.test(n))?.[0] ?? null;
  const sec = tema ? inf.secciones.find((s) => s.id === tema) : null;
  const quiereExcel = /excel|formula|como (lo )?(calculo|hago|saco|obtengo|grafico|corrijo|arreglo)|grafic|paso a paso|#?.?ref/.test(n);
  const quiereProblemas = /problema|error(es)? (del|en|de la)|hallazgo|revis|mal|corregir|que esta mal|fallas?|inconsisten|auditor/.test(n) && !/error total/.test(n);
  const quiereCumple = /cumple|pasa|acept|aprueb|apto|conform|criterio/.test(n);
  const metrica = /\bcv\b|coeficiente de variacion/.test(n) ? "cv" : /\bds\b|\bde\b|desviacion/.test(n) ? "de" : /media|promedio/.test(n) ? "media" : /sesgo/.test(n) ? "sesgo" : /pendiente/.test(n) ? "pendiente" : /intercepto/.test(n) ? "intercepto" : /error total/.test(n) ? "et" : /incertid/.test(n) ? "u" : null;
  const lista = (hs) => hs.map((h) => `- ${h.tipo === "mal" ? "🔴" : h.tipo === "alerta" ? "🟠" : h.tipo === "ok" ? "🟢" : "🔵"} ${h.seccion ? `**${h.seccion}:** ` : ""}${h.texto}${h.excel ? `\n  - Fórmula sugerida: \`${h.excel}\`` : ""}`).join("\n");

  if (/grafic/.test(n) && /(no|mal) (grafica|funciona)|corrij|arregl|repar|actualiz/.test(n)) return { md: guiaExcel("graficos", inf), seccion: "graficos" };
  if (/#?.?ref|referencia rota/.test(n)) { const h = inf.hallazgos.filter((x) => /#¡REF!/.test(x.texto)); return { md: (h.length ? `**Referencias rotas en el archivo:**\n${lista(h)}\n\n` : "No encontré referencias rotas en este archivo.\n\n") + "Un **#¡REF!** aparece cuando la fórmula apuntaba a una celda, fila u hoja que se eliminó. Haga clic en la celda, revise la barra de fórmulas y vuelva a seleccionar la celda correcta.\n\n" + guiaExcel("ver", inf) }; }
  if (quiereExcel) {
    if (/levey|jennings|control/.test(n)) return { md: guiaExcel(sec?.id === "pi" ? "pi" : "rep", inf) };
    if (/bland|altman|dispersion|regresion|pendiente|intercepto/.test(n)) return { md: guiaExcel("comp", inf) };
    if (/media|promedio|\bds\b|\bde\b|desviacion|\bcv\b/.test(n) && !tema) return { md: guiaExcel("rep", inf) };
    if (sec) return { md: guiaExcel(sec.id, inf) };
    return { md: ["rep", "comp", "ver", "inc"].map((i) => guiaExcel(i, inf)).join("\n\n") };
  }
  if (quiereProblemas) {
    const hs = inf.hallazgos.filter((h) => (h.tipo === "mal" || h.tipo === "alerta") && (!sec || h.id === sec.id));
    return { md: hs.length ? `Encontré **${hs.filter((h) => h.tipo === "mal").length} problemas importantes** y **${hs.filter((h) => h.tipo === "alerta").length} advertencias**${sec ? ` en ${sec.titulo}` : ""}:\n\n${lista(hs)}` : "No encontré problemas importantes en esta sección." };
  }
  if (sec && (sec.id === "rep" || sec.id === "pi" || sec.id === "inc") && sec.niveles?.length) {
    const nivs = nivel != null && sec.niveles[nivel] ? [sec.niveles[nivel]] : sec.niveles;
    if (quiereCumple || !metrica) {
      if (sec.id === "inc") return { md: `**${sec.titulo}**\n\n${nivs.map((v) => `- **${v.nivel}:** CV ${fmt(v.cv, 2)} %; u (archivo) ${fmt(v.archivo.u, 4)}; u Nordtest con el sesgo del nivel ${fmt(v.uNordtest, 2)} % vs objetivo ${fmt(v.objetivoRel, 2)} % → ${v.uNordtest <= v.objetivoRel ? "cumple" : "no cumple"}.`).join("\n")}\n\n${lista(sec.hallazgos.filter((h) => h.tipo !== "ok"))}` };
      return { md: `**${sec.titulo}** — criterio del formato: CV ≤ ${sec.niveles[0].factor} × ETa.\n\n${nivs.map((v) => `- **${v.nivel}:** CV ${fmt(v.cv, 2)} % vs criterio ${fmt(v.criterio, 2)} % → **${v.cumple ? "cumple" : "no cumple"}** (n = ${v.n}, media ${fmt(v.media, 3)}, DE ${fmt(v.de, 4)}).${v.conclusionArchivo ? ` Conclusión del archivo: «${v.conclusionArchivo.slice(0, 120)}».` : ""}`).join("\n")}` };
    }
    const etiqueta = { cv: "CV", de: "DE", media: "media", sesgo: "sesgo", u: "incertidumbre" }[metrica] || metrica;
    return { md: `**${etiqueta.toUpperCase()} — ${sec.titulo}:**\n\n${nivs.map((v) => {
      const recalc = metrica === "cv" ? `${fmt(v.cv, 3)} %` : metrica === "de" ? fmt(v.de, 4) : metrica === "media" ? fmt(v.media, 4) : metrica === "u" ? `${fmt(v.uNordtest, 3)} %` : "—";
      const arch = metrica === "cv" ? v.archivo.cv : metrica === "de" ? v.archivo.de : metrica === "media" ? v.archivo.media : metrica === "u" ? v.archivo.u : null;
      return `- **${v.nivel}:** ${recalc}${arch != null ? ` (archivo: ${fmt(arch, 4)})` : ""}`;
    }).join("\n")}\n\nEn Excel: ${metrica === "cv" ? "`=DESVEST.M(rango)/PROMEDIO(rango)*100`" : metrica === "de" ? "`=DESVEST.M(rango)`" : metrica === "media" ? "`=PROMEDIO(rango)`" : "ver «¿Cómo calculo la incertidumbre en Excel?»"} con el rango ${nivs[0].celdas || ""}.` };
  }
  if (sec?.id === "ver" && sec.niveles?.length) {
    const nivs = nivel != null && sec.niveles[nivel] ? [sec.niveles[nivel]] : sec.niveles;
    return { md: `**Veracidad por nivel** (frente a ${sec.comparacion || "el valor de comparación"}):\n\n${nivs.map((v) => `- **${v.nivel}:** media ${fmt(v.media, 3)} vs X = ${fmt(v.x, 3)} → sesgo ${fmt(v.sesgo, 3)} (${fmt(v.sesgoPct, 2)} %); ET = ${fmt(v.et, 2)} % vs ETa ${fmt(v.eta, 2)} % → **${v.cumple ? "cumple" : "no cumple"}**.`).join("\n")}\n\nSesgo agrupado del archivo: ${fmt(sec.agrupado, 3)} % (no debe usarse para todos los niveles).` };
  }
  if (sec?.id === "comp" && sec.n) {
    const pb = sec.calc?.tablas[0].filas[0];
    return { md: `**Comparación ${sec.metodoValidar || "Y"} vs ${sec.metodoComparacion || "X"}** (n = ${sec.n}):\n\n- Archivo (mínimos cuadrados): pendiente ${fmt(sec.archivo.pendiente, 4)}, intercepto ${fmt(sec.archivo.intercepto, 4)}. Criterio del formato: pendiente ${sec.criterioPendiente || "0,9–1,1"}.\n${pb ? `- Passing-Bablok: pendiente ${pb[1]} (IC 95 % ${pb[2]}), intercepto ${pb[3]} (IC 95 % ${pb[4]}).\n` : ""}${sec.sinExtremos ? `- Sin el valor extremo: pendiente ${fmt(sec.sinExtremos.b, 4)}.\n` : ""}${sec.fueraETa ? `- Muestras fuera de X ± ETa: ${sec.fueraETa.length}.\n` : ""}\n${lista(sec.hallazgos.filter((h) => h.tipo !== "info").map((h) => h))}` };
  }
  if (sec) return { md: `**${sec.titulo}**\n\n${lista(sec.hallazgos)}` };
  if (/resumen|conclusion|general|todo|informe/.test(n)) return { md: resumenTexto(inf) };
  return null;
}

export function resumenTexto(inf) {
  return `**${inf.prueba}**${inf.metodo ? ` — ${inf.metodo} vs ${inf.comparador}` : ""}\n\n${inf.secciones.map((s) => `- **${s.titulo}:** ${s.estado === "vacio" ? "sin datos" : s.estado === "ok" ? "sin problemas" : s.estado === "alerta" ? "con advertencias" : "con problemas importantes"}`).join("\n")}\n\nHallazgos: ${inf.conteo.mal} importantes, ${inf.conteo.alerta} advertencias.`;
}
