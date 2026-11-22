// Calculadoras de metrología y calidad para laboratorio clínico (funciones puras).
// Cada función devuelve un objeto de resultado genérico que app.js sabe pintar:
// { titulo, kpis[], tablas[], mensajes[], graficos[], notas[], datos }
import { zInv, tInv, chi2Inv, tCdf, binomCdf, media, de, mediana, percentilRango } from "./estadistica.js";

export const AVISO = "Borrador técnico para revisión por el responsable autorizado del laboratorio; no constituye una decisión de conformidad, liberación ni acreditación.";

const r = (x, d = 3) => (x === null || x === undefined || !isFinite(x) ? null : Number(x.toFixed(d)));
const res = (titulo) => ({ titulo, kpis: [], tablas: [], mensajes: [], graficos: [], notas: [], datos: {} });
function exigir(cond, msg) { if (!cond) throw new Error(msg); }
const agrupar = (filas, clave) => filas.reduce((m, f) => { (m.get(f[clave]) || m.set(f[clave], []).get(f[clave])).push(f); return m; }, new Map());

// ---------------------------------------------------------------- 1. Variación biológica
export const NIVELES_VB = { "óptimo": 0.25, deseable: 0.5, "mínimo": 0.75 };

export function especificacionesVB({ cvi, cvg, cva = null, sesgo = null, prob = 0.95, unilateral = false, zte = 1.65, analito = "" }) {
  exigir(cvi > 0, "El CVI debe ser mayor que 0.");
  const o = res(`Especificaciones por variación biológica${analito ? " — " + analito : ""}`);
  const esp = {};
  for (const [nivel, f] of Object.entries(NIVELES_VB)) {
    const i = f * cvi, b = cvg ? (f / 2) * Math.hypot(cvi, cvg) : null;
    esp[nivel] = { cva: i, sesgo: b, eta: b !== null ? zte * i + b : null, mau: i, mauU: 2 * i };
  }
  o.tablas.push({
    titulo: "Metas de desempeño (modelo 2 de Milán)",
    columnas: ["Nivel", "CVa máx %", "Sesgo máx %", "ETa %", "MAU u %", "MAU U (k=2) %"],
    filas: Object.entries(esp).map(([n, e]) => [n, r(e.cva, 2), r(e.sesgo, 2), r(e.eta, 2), r(e.mau, 2), r(e.mauU, 2)]),
  });
  const z = unilateral ? zInv(prob) : zInv(1 - (1 - prob) / 2);
  const cvaR = cva ?? 0;
  const rcv = Math.SQRT2 * z * Math.hypot(cvaR, cvi);
  const s = Math.sqrt(Math.log((cvaR / 100) ** 2 + (cvi / 100) ** 2 + 1));
  const up = (Math.exp(z * Math.SQRT2 * s) - 1) * 100, down = (Math.exp(-z * Math.SQRT2 * s) - 1) * 100;
  o.kpis.push({ etiqueta: "RCV (normal)", valor: `±${r(rcv, 1)}`, unidad: "%", nota: `${unilateral ? "uni" : "bi"}direccional, p=${prob}, CVa=${r(cvaR, 2)} %` });
  o.kpis.push({ etiqueta: "RCV log-normal", valor: `+${r(up, 1)} / ${r(down, 1)}`, unidad: "%", nota: "asimétrico, preferible con CV altos" });
  if (cvg) {
    const ii = cvi / cvg;
    o.kpis.push({ etiqueta: "Índice de individualidad", valor: r(ii, 2), estado: ii < 0.6 ? "alerta" : "ok",
      nota: ii < 0.6 ? "alta individualidad: el intervalo poblacional es poco útil, prefiera RCV" : ii > 1.4 ? "el intervalo poblacional es útil" : "intermedia" });
  }
  const nivelDe = (v, k) => { if (v === null) return null; for (const n of Object.keys(NIVELES_VB)) if (esp[n][k] !== null && Math.abs(v) <= esp[n][k]) return n; return "no cumple mínimo"; };
  if (cva !== null || sesgo !== null) {
    const te = cva !== null && sesgo !== null ? zte * cva + Math.abs(sesgo) : null;
    const filas = [];
    if (cva !== null) filas.push(["Imprecisión (CVa)", r(cva, 2), nivelDe(cva, "cva")]);
    if (sesgo !== null) filas.push(["Sesgo", r(sesgo, 2), nivelDe(sesgo, "sesgo")]);
    if (te !== null) filas.push([`Error total (${zte}·CVa + |sesgo|)`, r(te, 2), nivelDe(te, "eta")]);
    o.tablas.push({ titulo: "Evaluación de su método", columnas: ["Característica", "Valor %", "Nivel alcanzado"], filas });
    for (const f of filas) o.mensajes.push({ tipo: f[2] === "no cumple mínimo" ? "mal" : f[2] === "mínimo" ? "alerta" : "ok", texto: `${f[0]}: ${f[1]} % → ${f[2]}` });
  }
  o.notas.push("CVa ≤ f·CVI; sesgo ≤ (f/2)·√(CVI²+CVG²); ETa = 1,65·CVa + sesgo; f = 0,25 / 0,50 / 0,75. MAU según EFLM (Braga y Panteghini).",
    "Verifique CVI y CVG en la base EFLM vigente (biologicalvariation.eu).");
  o.datos = { esp, rcv, up, down };
  return o;
}

// ---------------------------------------------------------------- 2. Incertidumbre ISO/TS 20914
export function nivelesDesdeFilas(filas) {
  const out = [];
  for (const [nivel, fs] of agrupar(filas, "nivel")) {
    const v = fs.map((f) => f.valor).filter(Number.isFinite);
    if (v.length < 2) continue;
    const m = media(v), s = de(v);
    out.push({ nombre: String(nivel), n: v.length, media: m, de: s, cv: (100 * s) / m });
  }
  return out;
}

export function incertidumbre20914({ niveles, uCal = null, UCal = null, kCal = null, k = 2, rmsSesgo = null, uCref = null, cvi = null, mau = null, analito = "" }) {
  exigir(niveles && niveles.length, "Indique al menos un nivel con su CV de imprecisión intermedia (o cargue datos de CIC).");
  let ucal = uCal;
  if (UCal !== null && UCal !== undefined) { exigir(kCal > 0, "Con U del calibrador debe indicar el factor k del certificado."); ucal = UCal / kCal; }
  exigir(ucal !== null && ucal >= 0, "Indique la incertidumbre del calibrador (estándar, o expandida con su k).");
  const nordtest = rmsSesgo !== null && rmsSesgo !== undefined;
  if (nordtest) exigir(uCref !== null && uCref !== undefined, "El modelo Nordtest requiere u(Cref) junto con el RMS del sesgo.");
  const uSesgo = nordtest ? Math.hypot(rmsSesgo, uCref) : null;
  const MAU = cvi ? { "óptimo": 0.25 * cvi, deseable: 0.5 * cvi, "mínimo": 0.75 * cvi } : null;
  const o = res(`Incertidumbre de medida — ${nordtest ? "Nordtest TR 537" : "ISO/TS 20914"}${analito ? " — " + analito : ""}`);
  const filas = [], barras = [];
  for (const nv of niveles) {
    const u2 = nordtest ? uSesgo : ucal;
    const uc = Math.hypot(nv.cv, u2), U = k * uc;
    let frente = "—";
    if (mau) frente = uc <= mau ? "cumple" : "NO cumple";
    else if (MAU) frente = Object.entries(MAU).find(([, l]) => uc <= l)?.[0] ?? "no cumple mínimo";
    filas.push([nv.nombre, nv.n ?? "—", nv.media != null ? r(nv.media, 4) : "—", r(nv.cv, 3), r(uc, 3), r(U, 3), nv.media != null ? r((U * nv.media) / 100, 4) : "—", frente]);
    barras.push({ etiqueta: nv.nombre, rw: (nv.cv ** 2 / uc ** 2) * 100, otro: (u2 ** 2 / uc ** 2) * 100 });
    o.mensajes.push({ tipo: frente === "—" ? "info" : /no/i.test(frente) ? "mal" : frente === "mínimo" ? "alerta" : "ok",
      texto: `Nivel ${nv.nombre}: u_c = ${r(uc, 2)} %, U (k=${k}) = ${r(U, 2)} %${frente !== "—" ? " → frente a MAU: " + frente : ""}` });
  }
  o.kpis.push({ etiqueta: "u(cal)", valor: r(ucal, 3), unidad: "%", nota: UCal != null ? `U=${UCal} %, k=${kCal}` : "estándar" });
  if (nordtest) o.kpis.push({ etiqueta: "u(sesgo)", valor: r(uSesgo, 3), unidad: "%", nota: "√(RMS² + u(Cref)²)" });
  if (MAU) o.kpis.push({ etiqueta: "MAU deseable (EFLM)", valor: r(MAU.deseable, 2), unidad: "%", nota: `óptima ${r(MAU["óptimo"], 2)} · mínima ${r(MAU["mínimo"], 2)}` });
  o.tablas.push({ titulo: "Presupuesto por nivel", columnas: ["Nivel", "n", "Media", "u(Rw) %", "u_c %", `U (k=${k}) %`, "U absoluta", "vs MAU"], filas });
  o.graficos.push({ tipo: "contribuciones", titulo: "Aporte a la varianza (%)", series: barras, otroNombre: nordtest ? "u(sesgo)" : "u(cal)" });
  o.notas.push("u_c = √(u(Rw)² + u(cal)²); U = k·u_c. El sesgo significativo debe corregirse; solo se incluye con el modelo Nordtest, declarándolo.",
    "No incluye componentes preanalíticos ni variación biológica. Use CIC de ≥ 6 meses con cambios de lote y recalibraciones.",
    "Informe: resultado ± U, indicando k y la probabilidad de cobertura (~95 %).");
  return o;
}

// ---------------------------------------------------------------- 3. Sigma
export function reglasSigma(s) {
  if (s >= 6) return { clase: "clase mundial", reglas: "1-3s", nr: "N=2, R=1", nota: "QC mínimo" };
  if (s >= 5) return { clase: "excelente", reglas: "1-3s / 2-2s / R-4s", nr: "N=2, R=1", nota: "" };
  if (s >= 4) return { clase: "bueno", reglas: "1-3s / 2-2s / R-4s / 4-1s", nr: "N=4, R=1 o N=2, R=2", nota: "" };
  if (s >= 3) return { clase: "marginal", reglas: "1-3s / 2-2s / R-4s / 4-1s / 8x", nr: "N=4, R=2 o N=2, R=4", nota: "QC máximo; mejorar el método; considere PBRTQC" };
  return { clase: "inaceptable", reglas: "multirregla máxima", nr: "N≥4 por corrida", nota: "El CIC no asegura la calidad: mejore/cambie el método o revise el ETa" };
}

export function sigma({ analitos }) {
  exigir(analitos && analitos.length, "Indique al menos un analito con ETa, sesgo y CV.");
  const o = res("Métrica Sigma y reglas de control");
  const filas = [], serie = [];
  for (const a of analitos) {
    exigir(a.cv > 0, `${a.analito || "Analito"}: el CV debe ser mayor que 0.`);
    const s = (a.eta - Math.abs(a.sesgo || 0)) / a.cv, g = reglasSigma(s);
    filas.push([a.analito || "—", a.nivel || "", r(a.eta, 2), r(a.sesgo || 0, 2), r(a.cv, 2), r(s, 2), r(s - 1.65, 2), g.clase, g.reglas, g.nr]);
    serie.push({ etiqueta: `${a.analito || "—"}${a.nivel ? " " + a.nivel : ""}`, valor: s });
    if (g.nota) o.mensajes.push({ tipo: s < 3 ? "mal" : s < 4 ? "alerta" : "info", texto: `${a.analito || "Analito"}: ${g.nota}` });
  }
  if (analitos.length === 1) {
    const s = serie[0].valor;
    o.kpis.push({ etiqueta: "Sigma", valor: r(s, 2), estado: s >= 4 ? "ok" : s >= 3 ? "alerta" : "mal", nota: reglasSigma(s).clase, contador: true });
    o.kpis.push({ etiqueta: "Reglas sugeridas", valor: reglasSigma(s).reglas, nota: reglasSigma(s).nr });
  }
  o.tablas.push({ titulo: "Sigma por analito", columnas: ["Analito", "Nivel", "ETa %", "Sesgo %", "CV %", "Sigma", "ΔSEc", "Clase", "Reglas", "N / R"], filas });
  o.graficos.push({ tipo: "sigma", titulo: "Sigma por analito", series: serie });
  o.notas.push("Sigma = (ETa − |sesgo|)/CV, todo en % y a la misma concentración. ΔSEc = Sigma − 1,65.",
    "Reglas según Westgard Sigma Rules (2 niveles). Para frecuencia y tamaño de corrida con riesgo del paciente (Max E(Nuf)) siga CLSI C24.");
  return o;
}

// ---------------------------------------------------------------- 4. Westgard
export const REGLAS_WESTGARD = ["1-2s", "1-3s", "2-2s", "R-4s", "4-1s", "2de3-2s", "3-1s", "8x", "10x", "12x"];

export function objetivosDesdeDatos(filas, nPrimeros = null) {
  const obj = {};
  for (const [nivel, fs] of agrupar(filas, "nivel")) {
    const v = fs.map((f) => f.valor).slice(0, nPrimeros || undefined);
    if (v.length >= 2) obj[nivel] = { media: media(v), de: de(v), n: v.length };
  }
  return obj;
}

export function westgard({ filas, objetivos, reglas = ["1-2s", "1-3s", "2-2s", "R-4s", "4-1s", "10x"], entreNiveles = true }) {
  exigir(filas && filas.length, "No hay resultados de control.");
  const R = new Set(reglas);
  const racha = (zs, n, u) => zs.length >= n && (zs.slice(-n).every((v) => v > u) || zs.slice(-n).every((v) => v < -u));
  const dosDeTres = (zs) => zs.length >= 3 && (zs.slice(-3).filter((v) => v > 2).length >= 2 || zs.slice(-3).filter((v) => v < -2).length >= 2);
  const corridas = agrupar(filas, "corrida");
  const hist = new Map(), comb = [], salida = [], puntos = {};
  for (const [corrida, items] of corridas) {
    const viol = [], zr = {};
    for (const it of items) {
      const ob = objetivos[it.nivel];
      exigir(ob && ob.de > 0, `Falta media/DE objetivo válida para el nivel "${it.nivel}".`);
      const z = (it.valor - ob.media) / ob.de;
      zr[it.nivel] = z;
      (hist.get(it.nivel) || hist.set(it.nivel, []).get(it.nivel)).push(z);
      comb.push(z);
      if (R.has("1-3s") && Math.abs(z) > 3) viol.push(`1-3s (${it.nivel})`);
      if (R.has("1-2s") && Math.abs(z) > 2 && Math.abs(z) <= 3) viol.push(`1-2s alerta (${it.nivel})`);
    }
    const zs = Object.values(zr);
    if (R.has("R-4s") && zs.length >= 2 && Math.max(...zs) > 2 && Math.min(...zs) < -2) viol.push("R-4s (dentro de corrida)");
    if (R.has("2-2s") && zs.length >= 2 && (zs.filter((v) => v > 2).length >= 2 || zs.filter((v) => v < -2).length >= 2)) viol.push("2-2s (entre niveles)");
    const series = Object.keys(zr).map((n) => [`nivel ${n}`, hist.get(n)]);
    if (entreNiveles) series.push(["combinada", comb]);
    for (const [nombre, z] of series) {
      if (R.has("2-2s") && nombre !== "combinada" && racha(z, 2, 2)) viol.push(`2-2s (${nombre})`);
      if (R.has("4-1s") && racha(z, 4, 1)) viol.push(`4-1s (${nombre})`);
      if (R.has("3-1s") && racha(z, 3, 1)) viol.push(`3-1s (${nombre})`);
      if (R.has("2de3-2s") && dosDeTres(z)) viol.push(`2de3-2s (${nombre})`);
      for (const x of ["8x", "10x", "12x"]) if (R.has(x) && racha(z, parseInt(x), 0)) viol.push(`${x} (${nombre})`);
    }
    const rechazo = viol.filter((v) => !v.startsWith("1-2s"));
    const estado = rechazo.length ? "RECHAZO" : viol.length ? "alerta" : "aceptada";
    let tipo = "";
    if (rechazo.length) {
      const aleat = rechazo.some((v) => /^(1-3s|R-4s)/.test(v)), sist = rechazo.some((v) => /^(2-2s|4-1s|3-1s|2de3|8x|10x|12x)/.test(v));
      tipo = aleat && sist ? "aleatorio + sistemático" : aleat ? "aleatorio" : "sistemático";
    }
    salida.push({ corrida, zr, estado, tipo, viol });
    for (const it of items) (puntos[it.nivel] ||= []).push({ corrida, valor: it.valor, z: zr[it.nivel], estado });
  }
  const o = res("Reglas de Westgard — evaluación de corridas");
  const nR = salida.filter((s) => s.estado === "RECHAZO").length, nA = salida.filter((s) => s.estado === "alerta").length;
  o.kpis.push({ etiqueta: "Corridas", valor: salida.length, contador: true });
  o.kpis.push({ etiqueta: "Rechazadas", valor: nR, estado: nR ? "mal" : "ok", contador: true });
  o.kpis.push({ etiqueta: "Alertas 1-2s", valor: nA, estado: nA ? "alerta" : "ok", contador: true });
  for (const [nivel, pts] of Object.entries(puntos))
    o.graficos.push({ tipo: "lj", titulo: `Levey-Jennings — nivel ${nivel}`, nivel, media: objetivos[nivel].media, de: objetivos[nivel].de, puntos: pts });
  const prob = salida.filter((s) => s.estado !== "aceptada");
  o.tablas.push({ titulo: prob.length ? "Corridas con alertas o rechazos" : "Todas las corridas aceptadas", columnas: ["Corrida", "z por nivel", "Estado", "Error probable", "Reglas violadas"],
    filas: prob.map((s) => [s.corrida, Object.entries(s.zr).map(([k, v]) => `${k}: ${v >= 0 ? "+" : ""}${v.toFixed(2)}`).join("  "), s.estado, s.tipo, s.viol.join("; ")]) });
  o.tablas.push({ titulo: "Objetivos usados", columnas: ["Nivel", "Media", "DE", "CV %"], filas: Object.entries(objetivos).map(([n, ob]) => [n, r(ob.media, 4), r(ob.de, 4), r((100 * ob.de) / ob.media, 2)]) });
  if (nR) o.mensajes.push({ tipo: "mal", texto: "Ante rechazo: no liberar resultados, investigar la causa (aleatoria vs sistemática), corregir, repetir controles y evaluar los pacientes desde el último control aceptable." });
  else o.mensajes.push({ tipo: "ok", texto: "Ninguna corrida viola reglas de rechazo con los objetivos y reglas seleccionados." });
  o.notas.push("Use media y DE propias del laboratorio (≥ 20 datos, idealmente acumuladas), no las del inserto. 1-2s es solo alerta.");
  o.datos = { salida };
  return o;
}

// ---------------------------------------------------------------- 5. EP15
function anovaUnFactor(grupos) {
  const k = grupos.length, ns = grupos.map((g) => g.length);
  exigir(k >= 2 && Math.min(...ns) >= 2, "Se requieren ≥ 2 días con ≥ 2 réplicas cada uno.");
  const N = ns.reduce((a, b) => a + b, 0), gm = grupos.flat().reduce((a, b) => a + b, 0) / N;
  const ssw = grupos.reduce((a, g) => { const m = media(g); return a + g.reduce((s, x) => s + (x - m) ** 2, 0); }, 0);
  const ssb = grupos.reduce((a, g) => a + g.length * (media(g) - gm) ** 2, 0);
  const dfw = N - k, dfb = k - 1, msw = ssw / dfw, msb = ssb / dfb;
  const n0 = (N - ns.reduce((a, n) => a + n * n, 0) / N) / (k - 1);
  const sb2 = Math.max(0, (msb - msw) / n0), swl2 = msw + sb2;
  let dfwl = dfw;
  if (sb2 > 0) { const a1 = (n0 - 1) / n0, a2 = 1 / n0; dfwl = (a1 * msw + a2 * msb) ** 2 / ((a1 * msw) ** 2 / dfw + (a2 * msb) ** 2 / dfb); }
  return { k, n0, N, gm, msw, msb, sr: Math.sqrt(msw), sb: Math.sqrt(sb2), swl: Math.sqrt(swl2), dfr: dfw, dfwl: Math.min(dfwl, N - 1), balanceado: new Set(ns).size === 1 };
}

export function ep15({ filas, cvRDecl = null, cvWLDecl = null, deRDecl = null, deWLDecl = null, niveles = 1, vo = null, uVo = 0 }) {
  const grupos = [...agrupar(filas, "dia").values()].map((fs) => fs.map((f) => f.valor));
  const a = anovaUnFactor(grupos), m = a.gm, alfa = 0.05 / Math.max(1, niveles);
  const o = res("Verificación de precisión y veracidad (tipo CLSI EP15)");
  o.kpis.push({ etiqueta: "Media", valor: r(m, 4) });
  o.kpis.push({ etiqueta: "CV repetibilidad", valor: r((100 * a.sr) / m, 2), unidad: "%" });
  o.kpis.push({ etiqueta: "CV intralaboratorio", valor: r((100 * a.swl) / m, 2), unidad: "%" });
  o.tablas.push({ titulo: `Componentes de precisión — ${a.k} días × ${r(a.n0, 1)} réplicas (N=${a.N})${a.balanceado ? "" : " [no balanceado]"}`,
    columnas: ["Componente", "DE", "CV %", "gl"],
    filas: [["Repetibilidad (S_r)", r(a.sr, 4), r((100 * a.sr) / m, 2), a.dfr], ["Entre días (S_b)", r(a.sb, 4), r((100 * a.sb) / m, 2), "—"], ["Intralaboratorio (S_WL)", r(a.swl, 4), r((100 * a.swl) / m, 2), r(a.dfwl, 1)]] });
  const verif = [];
  for (const [et, obs, gl, cvD, deD] of [["Repetibilidad", a.sr, a.dfr, cvRDecl, deRDecl], ["Intralaboratorio", a.swl, a.dfwl, cvWLDecl, deWLDecl]]) {
    const sig = deD ?? (cvD != null ? (cvD * m) / 100 : null);
    if (sig == null) continue;
    const lsv = sig * Math.sqrt(chi2Inv(1 - alfa, gl) / gl), ok = obs <= sig || obs <= lsv;
    verif.push([et, r(sig, 4), r(obs, 4), r(lsv, 4), ok ? "verificada" : "NO verificada"]);
    o.mensajes.push({ tipo: ok ? "ok" : "mal", texto: `${et}: observada ${r(obs, 4)} vs declarada ${r(sig, 4)} (LSV ${r(lsv, 4)}) → ${ok ? "verificada" : "NO verificada"}` });
  }
  if (verif.length) o.tablas.push({ titulo: `Comparación con lo declarado (α' = ${r(alfa, 4)})`, columnas: ["Componente", "Declarada (DE)", "Observada (DE)", "LSV", "Resultado"], filas: verif });
  if (vo != null) {
    const ee = Math.sqrt(a.msb / a.N), t = tInv(0.975, a.k - 1), semi = t * Math.hypot(ee, uVo || 0), sesgo = m - vo, ok = Math.abs(sesgo) <= semi;
    o.tablas.push({ titulo: "Veracidad frente al valor objetivo", columnas: ["VO", "u(VO)", "Sesgo", "Sesgo %", "Intervalo de verificación", "Resultado"],
      filas: [[vo, uVo || 0, r(sesgo, 4), r((100 * sesgo) / vo, 2), `${r(vo - semi, 4)} – ${r(vo + semi, 4)}`, ok ? "sesgo no distinguible" : "sesgo significativo"]] });
    o.mensajes.push({ tipo: ok ? "ok" : "alerta", texto: ok ? "La media cae dentro del intervalo de verificación." : "La media cae fuera del intervalo: compare el sesgo con el sesgo admisible antes de decidir." });
  }
  o.graficos.push({ tipo: "puntosDia", titulo: "Resultados por día", grupos: [...agrupar(filas, "dia").entries()].map(([d, fs]) => ({ dia: d, valores: fs.map((f) => f.valor) })), media: m });
  o.notas.push("ANOVA de un factor: S_WL = √(S_r² + S_b²), gl por Satterthwaite. LSV = σ_declarada·√(χ²(1−α'; gl)/gl), α' = 0,05/nº de niveles.",
    "Confirme diseño, factores y criterios exactos con la copia autorizada de CLSI EP15.");
  return o;
}

// ---------------------------------------------------------------- 6. EP17
export function ep17({ blancos, bajas = [] }) {
  const gb = agrupar(blancos, "muestra"), vb = blancos.map((f) => f.valor), B = vb.length, K = gb.size;
  exigir(B - K >= 1, "Se necesitan más resultados que muestras de blanco.");
  const cpb = 1.645 / (1 - 1 / (4 * (B - K))), lobP = media(vb) + cpb * de(vb), lobNP = percentilRango([...vb].sort((a, b) => a - b), 0.5 + 0.95 * B);
  const o = res("Límite del blanco y límite de detección (tipo CLSI EP17)");
  o.kpis.push({ etiqueta: "LoB paramétrico", valor: r(lobP, 4), nota: `cp = ${r(cpb, 4)}` });
  o.kpis.push({ etiqueta: "LoB no paramétrico", valor: r(lobNP, 4), nota: `rango ${r(0.5 + 0.95 * B, 2)}` });
  const filas = [["Blancos", B, K, r(media(vb), 4), r(de(vb), 4)]];
  if (bajas.length) {
    const gl = agrupar(bajas, "muestra"), L = bajas.length, J = gl.size;
    exigir(L - J >= 1, "Se necesitan réplicas en las muestras bajas.");
    let ss = 0; const des = [];
    for (const fs of gl.values()) { const v = fs.map((f) => f.valor), m = media(v); ss += v.reduce((a, x) => a + (x - m) ** 2, 0); if (v.length > 1) des.push(de(v)); }
    const deL = Math.sqrt(ss / (L - J)), cpl = 1.645 / (1 - 1 / (4 * (L - J)));
    o.kpis.push({ etiqueta: "LoD (LoB paramétrico)", valor: r(lobP + cpl * deL, 4), estado: "ok", nota: `cp = ${r(cpl, 4)}` });
    o.kpis.push({ etiqueta: "LoD (LoB no paramétrico)", valor: r(lobNP + cpl * deL, 4) });
    filas.push(["Muestras bajas", L, J, r(media(bajas.map((f) => f.valor)), 4), `${r(deL, 4)} (agrupada)`]);
    if (des.length && Math.max(...des) > 2 * Math.min(...des)) o.mensajes.push({ tipo: "alerta", texto: "DE heterogéneas entre muestras bajas: revise antes de agrupar." });
  }
  o.tablas.push({ titulo: "Datos", columnas: ["Tipo", "Resultados", "Muestras", "Media", "DE"], filas });
  o.notas.push("LoB = media_B + cp_B·DE_B, cp = 1,645/(1 − 1/(4(B−K))). LoD = LoB + cp_L·DE_L. No paramétrico: rango 0,5 + 0,95·B.",
    "Para verificar un LoD declarado: ≥ ~95 % de los resultados de muestras al LoD deben superar el LoB. El LoQ requiere una meta de exactitud.");
  return o;
}

// ---------------------------------------------------------------- 7. EP28
function icRangos(n, p, conf = 0.9) {
  const a = (1 - conf) / 2;
  let j = null;
  if (binomCdf(0, n, p) <= a) for (let x = 1; x <= n; x++) { if (binomCdf(x - 1, n, p) <= a) j = x; else break; }
  let k = n;
  for (let x = 1; x <= n; x++) if (binomCdf(x - 1, n, p) >= 1 - a) { k = x; break; }
  return [j, k];
}

export function ep28({ valores, modo = "verificar", li = null, ls = null }) {
  const v = valores.filter(Number.isFinite).sort((a, b) => a - b), n = v.length;
  exigir(n >= 2, "Se necesitan valores.");
  const o = res(modo === "verificar" ? "Verificación de intervalo de referencia (tipo CLSI EP28)" : "Intervalo de referencia no paramétrico (tipo CLSI EP28)");
  if (modo === "verificar") {
    exigir(li != null || ls != null, "Indique el límite inferior y/o superior a verificar.");
    const fuera = v.filter((x) => (li != null && x < li) || (ls != null && x > ls)), p = fuera.length / n;
    const dec = p <= 0.1 ? "aceptado" : fuera.length <= 4 && n <= 20 ? "repetir con otros 20" : "no transferible";
    o.kpis.push({ etiqueta: "n", valor: n, contador: true });
    o.kpis.push({ etiqueta: "Fuera del intervalo", valor: `${fuera.length} (${r(100 * p, 1)} %)`, estado: p <= 0.1 ? "ok" : "mal" });
    o.kpis.push({ etiqueta: "Decisión sugerida", valor: dec, estado: dec === "aceptado" ? "ok" : dec === "no transferible" ? "mal" : "alerta" });
    if (n < 20) o.mensajes.push({ tipo: "alerta", texto: "n < 20: la verificación tiene muy poca potencia." });
    if (fuera.length) o.tablas.push({ titulo: "Valores fuera", columnas: ["Valor"], filas: fuera.map((x) => [x]) });
    o.graficos.push({ tipo: "histograma", titulo: "Distribución de los sanos locales", valores: v, li, ls });
  } else {
    if (n < 120) o.mensajes.push({ tipo: "alerta", texto: `n = ${n} < 120: los IC 90 % de los límites serán amplios o no calculables.` });
    const filas = [];
    for (const [nom, q] of [["Inferior (P2,5)", 0.025], ["Superior (P97,5)", 0.975]]) {
      const lim = percentilRango(v, q * (n + 1)), [j, k] = icRangos(n, q);
      filas.push([nom, r(lim, 4), j ? r(v[j - 1], 4) : "n/d", r(v[k - 1], 4), `${j ?? "—"}–${k}`]);
      o.kpis.push({ etiqueta: `Límite ${nom.split(" ")[0].toLowerCase()}`, valor: r(lim, 3) });
    }
    o.tablas.push({ titulo: `Límites no paramétricos (n = ${n})`, columnas: ["Límite", "Valor", "IC 90 % inf", "IC 90 % sup", "Rangos IC"], filas });
    o.graficos.push({ tipo: "histograma", titulo: "Distribución", valores: v, li: filas[0][1], ls: filas[1][1] });
    o.notas.push("Revise valores atípicos (Dixon/Tukey) y particiones (sexo, edad) antes de usar el intervalo.");
  }
  o.notas.push("Transferencia: se acepta si ≤ 10 % de 20 sanos locales cae fuera; establecimiento: n ≥ 120 por partición, percentiles 2,5 y 97,5 por rangos.");
  return o;
}

// ---------------------------------------------------------------- 8. Comparación de métodos
export function passingBablok(x, y) {
  const n = x.length, S = [];
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
    const dx = x[j] - x[i], dy = y[j] - y[i];
    if (dx === 0 && dy === 0) continue;
    const s = dx === 0 ? (dy > 0 ? Infinity : -Infinity) : dy / dx;
    if (s === -1) continue;
    S.push(s);
  }
  S.sort((a, b) => a - b);
  const N = S.length, K = S.filter((s) => s < -1).length;
  const at = (i) => S[Math.min(Math.max(i, 1), N) - 1]; // 1-indexado
  const b = N % 2 ? at((N + 1) / 2 + K) : 0.5 * (at(N / 2 + K) + at(N / 2 + 1 + K));
  const C = zInv(0.975) * Math.sqrt((n * (n - 1) * (2 * n + 5)) / 18);
  const M1 = Math.round((N - C) / 2), M2 = N - M1 + 1;
  const bL = at(M1 + K), bU = at(M2 + K);
  const a = mediana(y.map((yi, i) => yi - b * x[i]));
  const aL = mediana(y.map((yi, i) => yi - bU * x[i])), aU = mediana(y.map((yi, i) => yi - bL * x[i]));
  return { b, bL, bU, a, aL, aU };
}

function demingCore(x, y, delta) {
  const mx = media(x), my = media(y), n = x.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; sxy += (x[i] - mx) * (y[i] - my); }
  sxx /= n - 1; syy /= n - 1; sxy /= n - 1;
  const b = (syy - delta * sxx + Math.sqrt((syy - delta * sxx) ** 2 + 4 * delta * sxy ** 2)) / (2 * sxy);
  return { b, a: my - b * mx };
}
export function deming(x, y, delta = 1) {
  const n = x.length, full = demingCore(x, y, delta), bs = [], as = [];
  for (let i = 0; i < n; i++) { const xi = x.filter((_, j) => j !== i), yi = y.filter((_, j) => j !== i), d = demingCore(xi, yi, delta); bs.push(d.b); as.push(d.a); }
  const jk = (v) => Math.sqrt(((n - 1) / n) * v.reduce((s, q) => s + (q - media(v)) ** 2, 0));
  const t = tInv(0.975, n - 2), seb = jk(bs), sea = jk(as);
  return { ...full, bL: full.b - t * seb, bU: full.b + t * seb, aL: full.a - t * sea, aU: full.a + t * sea };
}

export function comparacionMetodos({ pares, delta = 1, relativo = false, decisiones = [], sesgoAdm = null, margen = null, nombreX = "Comparativo", nombreY = "Nuevo" }) {
  const p = pares.filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y));
  exigir(p.length >= 10, "Se recomiendan ≥ 40 pares de muestras de pacientes (mínimo 10 para calcular).");
  const x = p.map((q) => q.x), y = p.map((q) => q.y), n = p.length;
  const o = res(`Comparación de métodos: ${nombreY} vs ${nombreX}`);
  const prom = p.map((q) => (q.x + q.y) / 2), dif = p.map((q, i) => (relativo ? (100 * (q.y - q.x)) / prom[i] : q.y - q.x));
  const md = media(dif), sd = de(dif), t = tInv(0.975, n - 1), ic = t * (sd / Math.sqrt(n));
  // Tendencia de la diferencia con la concentración (sesgo proporcional)
  const mp = media(prom); let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (prom[i] - mp) * (dif[i] - md); sxx += (prom[i] - mp) ** 2; }
  const pend = sxy / sxx, resid = dif.map((d, i) => d - (md + pend * (prom[i] - mp))), se = Math.sqrt(resid.reduce((a, e) => a + e * e, 0) / (n - 2) / sxx);
  const pTrend = 2 * (1 - tCdf(Math.abs(pend / se), n - 2));
  const pb = passingBablok(x, y), dm = deming(x, y, delta);
  const u = relativo ? " %" : "";
  o.kpis.push({ etiqueta: "Pares", valor: n, contador: true, estado: n >= 40 ? "ok" : "alerta", nota: n >= 40 ? "" : "EP09 recomienda ≥ 40" });
  o.kpis.push({ etiqueta: "Sesgo medio", valor: `${r(md, 3)}${u}`, nota: `IC95 ${r(md - ic, 3)} a ${r(md + ic, 3)}` });
  o.kpis.push({ etiqueta: "Límites de acuerdo", valor: `${r(md - 1.96 * sd, 2)} a ${r(md + 1.96 * sd, 2)}${u}` });
  o.tablas.push({ titulo: "Regresión", columnas: ["Método", "Pendiente", "IC 95 %", "Intercepto", "IC 95 %"], filas: [
    ["Passing-Bablok", r(pb.b, 4), `${r(pb.bL, 4)} – ${r(pb.bU, 4)}`, r(pb.a, 4), `${r(pb.aL, 4)} – ${r(pb.aU, 4)}`],
    [`Deming (δ=${delta})`, r(dm.b, 4), `${r(dm.bL, 4)} – ${r(dm.bU, 4)}`, r(dm.a, 4), `${r(dm.aL, 4)} – ${r(dm.aU, 4)}`]] });
  const pbOkB = pb.bL <= 1 && pb.bU >= 1, pbOkA = pb.aL <= 0 && pb.aU >= 0;
  o.mensajes.push({ tipo: pbOkB ? "ok" : "alerta", texto: pbOkB ? "IC de la pendiente (Passing-Bablok) incluye 1: sin sesgo proporcional detectable." : "IC de la pendiente excluye 1: hay sesgo proporcional." });
  o.mensajes.push({ tipo: pbOkA ? "ok" : "alerta", texto: pbOkA ? "IC del intercepto incluye 0: sin sesgo constante detectable." : "IC del intercepto excluye 0: hay sesgo constante." });
  if (pTrend < 0.05) o.mensajes.push({ tipo: "alerta", texto: `La diferencia cambia con la concentración (p = ${r(pTrend, 4)}): un solo sesgo medio no describe bien la relación; use la regresión.` });
  if (decisiones.length) {
    const filas = decisiones.map((xc) => {
      const yc = pb.a + pb.b * xc, sesgo = yc - xc, sp = (100 * sesgo) / xc;
      const est = sesgoAdm != null ? (Math.abs(sp) <= sesgoAdm ? "aceptable" : "NO aceptable") : "—";
      return [xc, r(yc, 4), r(sesgo, 4), r(sp, 2), est];
    });
    o.tablas.push({ titulo: "Sesgo en los límites de decisión clínica (Passing-Bablok)", columnas: ["Límite (X)", "Y estimado", "Sesgo", "Sesgo %", sesgoAdm != null ? `vs ±${sesgoAdm} %` : "Criterio"], filas });
    for (const f of filas) if (f[4] !== "—") o.mensajes.push({ tipo: f[4] === "aceptable" ? "ok" : "mal", texto: `En ${f[0]}: sesgo ${f[3]} % → ${f[4]}` });
  }
  if (margen != null) {
    const lo = md - tInv(0.95, n - 1) * (sd / Math.sqrt(n)), hi = md + tInv(0.95, n - 1) * (sd / Math.sqrt(n)), eq = lo > -margen && hi < margen;
    o.mensajes.push({ tipo: eq ? "ok" : "alerta", texto: `TOST (equivalencia de la diferencia media, margen ±${margen}${u}): IC 90 % ${r(lo, 3)} a ${r(hi, 3)} → ${eq ? "equivalentes al margen" : "equivalencia no demostrada"}.` });
  }
  o.graficos.push({ tipo: "dispersion", titulo: "Dispersión con Passing-Bablok", x, y, pb, nombreX, nombreY });
  o.graficos.push({ tipo: "ba", titulo: `Bland-Altman (${relativo ? "diferencia %" : "diferencia absoluta"})`, prom, dif, md, lim: [md - 1.96 * sd, md + 1.96 * sd], relativo });
  o.notas.push("Un coeficiente de correlación alto no demuestra concordancia; 'p > 0,05' no demuestra equivalencia.",
    "Passing-Bablok asume relación lineal y distribución continua; Deming requiere la razón de varianzas del error (δ). IC de Deming por jackknife.");
  return o;
}

// ---------------------------------------------------------------- 9. EEC / ensayos de aptitud
export function puntajesEEC({ filas }) {
  exigir(filas && filas.length, "Indique al menos un resultado de EEC.");
  const o = res("Puntajes de evaluación externa (ISO 13528)");
  const tabla = [];
  let insat = 0, cuest = 0;
  for (const f of filas) {
    const z = f.spt ? (f.x - f.X) / f.spt : null, zp = f.spt && f.uX ? (f.x - f.X) / Math.hypot(f.spt, f.uX) : null;
    const en = f.Ulab && f.Uref != null ? (f.x - f.X) / Math.hypot(f.Ulab, f.Uref) : null;
    const zu = zp ?? z;
    const cal = zu == null ? "—" : Math.abs(zu) <= 2 ? "satisfactorio" : Math.abs(zu) < 3 ? "cuestionable" : "insatisfactorio";
    if (cal === "insatisfactorio") insat++; if (cal === "cuestionable") cuest++;
    tabla.push([f.analito || f.muestra || "—", f.x, f.X, r(((f.x - f.X) / f.X) * 100, 2), r(z, 2), r(zp, 2), r(en, 2), cal, en == null ? "—" : Math.abs(en) <= 1 ? "|En| ≤ 1" : "|En| > 1"]);
  }
  o.kpis.push({ etiqueta: "Resultados", valor: filas.length, contador: true });
  o.kpis.push({ etiqueta: "Insatisfactorios", valor: insat, estado: insat ? "mal" : "ok", contador: true });
  o.kpis.push({ etiqueta: "Cuestionables", valor: cuest, estado: cuest ? "alerta" : "ok", contador: true });
  o.tablas.push({ titulo: "Puntajes", columnas: ["Analito/muestra", "x (lab)", "X (asignado)", "Desv %", "z", "z'", "En", "Calificación z", "En"], filas: tabla });
  const desv = filas.map((f) => ((f.x - f.X) / f.X) * 100);
  if (desv.length >= 3 && (desv.every((d) => d > 0) || desv.every((d) => d < 0)))
    o.mensajes.push({ tipo: "alerta", texto: "Todas las desviaciones tienen el mismo signo: posible sesgo sistemático aunque los puntajes sean satisfactorios." });
  if (insat) o.mensajes.push({ tipo: "mal", texto: "Investigue cada resultado insatisfactorio: causa raíz, impacto en pacientes y acción correctiva verificada." });
  o.graficos.push({ tipo: "zscores", titulo: "Puntajes z", etiquetas: tabla.map((t) => String(t[0])), valores: filas.map((f, i) => tabla[i][5] ?? tabla[i][4]) });
  o.notas.push("z = (x − X)/σpt; z' incluye u(X); En = (x − X)/√(U_lab² + U_ref²). |z| ≤ 2 satisfactorio, 2–3 cuestionable, ≥ 3 insatisfactorio.",
    "El puntaje frente al grupo par no informa veracidad absoluta si el material no es conmutable.");
  return o;
}
