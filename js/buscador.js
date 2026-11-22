// Buscador experto: indexa los documentos Markdown por secciones y responde con BM25,
// normalización del español, sinónimos y siglas del laboratorio clínico. Sin dependencias.

export const DOCUMENTOS = [
  ["preguntas-frecuentes.md", "Preguntas frecuentes"],
  ["glosario.md", "Glosario"],
  ["incertidumbre-iso-20914.md", "Incertidumbre ISO/TS 20914"],
  ["control-calidad-interno.md", "Control interno de la calidad"],
  ["especificaciones-desempeno.md", "Especificaciones de desempeño"],
  ["verificacion-validacion-clinica.md", "Verificación y validación"],
  ["trazabilidad-eqa.md", "Trazabilidad y EEC"],
  ["sistema-gestion-iso-15189.md", "ISO 15189:2022"],
  ["mapa-normativo.md", "Mapa normativo"],
  ["contexto-colombia.md", "Contexto colombiano"],
  ["guia-excel.md", "Guía de Excel"],
];

const STOP = new Set(("a al algo algun alguna algunas alguno algunos ante antes como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era es esa esas ese eso esos esta estas este esto estos fue ha hay la las le les lo los mas me mi mis mucho muy no nos o otra otro para pero poco por porque que quien se ser si sin sobre son su sus tambien te tiene tienen todo todos tu un una uno unos usted ya yo debo puedo hacer hago hace como cuanto cuantos cuantas necesito quiero saber cual es significa explica explicame dime mi nuestro laboratorio lab")
  .split(" "));

// Sinónimos y siglas → términos que se añaden a la consulta (peso reducido)
const SINONIMOS = {
  mu: ["incertidumbre"], incertidumbr: ["mu", "u_c"], u: ["incertidumbre"], uc: ["incertidumbre", "combinada"],
  gum: ["incertidumbre", "jcgm"], 20914: ["incertidumbre", "top-down"], topdown: ["20914", "incertidumbre"],
  cic: ["control", "interno", "westgard"], qc: ["control", "interno"], iqc: ["control", "interno"], control: ["cic"],
  westgard: ["reglas", "multirregla", "control"], levey: ["jennings", "control"], jennings: ["levey", "control"],
  sigma: ["seis", "sigma", "eta"], seis: ["sigma"],
  eec: ["evaluacion", "externa", "aptitud"], eqa: ["eec", "evaluacion", "externa"], pt: ["aptitud", "eec"], aptitud: ["eec", "externa"],
  intercomparacion: ["eec", "aptitud"], z: ["puntaje", "aptitud"], en: ["numero", "aptitud"],
  lod: ["limite", "deteccion", "ep17"], lob: ["limite", "blanco", "ep17"], loq: ["limite", "cuantificacion", "ep17"],
  deteccion: ["lod", "ep17"], ir: ["intervalo", "referencia", "ep28"], referencia: ["intervalo"], rango: ["intervalo"],
  vb: ["variacion", "biologica"], cvi: ["variacion", "biologica", "intraindividual"], cvg: ["variacion", "biologica", "interindividual"],
  biologic: ["variacion", "cvi"], rcv: ["valor", "referencia", "cambio"], milan: ["especificaciones", "modelo"],
  eta: ["error", "total", "admisible"], tea: ["eta", "error", "total"], et: ["error", "total"], mau: ["incertidumbre", "maxima", "admisible"],
  sesgo: ["veracidad", "bias"], bias: ["sesgo"], veracidad: ["sesgo"], exactitud: ["veracidad", "precision"],
  precision: ["imprecision", "cv", "repetibilidad"], imprecision: ["precision", "cv"], cv: ["precision", "imprecision"],
  repetibilidad: ["precision", "ep15"], linealidad: ["ep06", "intervalo", "medida"], lineal: ["linealidad", "ep06"],
  comparacion: ["ep09", "metodos", "passing", "deming"], correlacion: ["comparacion", "metodos"], passing: ["bablok", "comparacion"], deming: ["comparacion"],
  bland: ["altman", "comparacion"], interferencia: ["ep07", "hemolisis"], hemolisis: ["interferencia"],
  verificar: ["verificacion"], verificacion: ["ep15", "metodo"], validar: ["validacion"], validacion: ["metodo"],
  lote: ["cambio", "ep26", "reactivo"], reactivo: ["lote", "invima"],
  trazabilidad: ["17511", "calibrador", "metrologica"], conmutabilidad: ["conmutable", "material"], calibracion: ["calibrador", "trazabilidad"],
  acreditacion: ["15189", "onac"], acreditar: ["acreditacion"], certificacion: ["acreditacion", "9001"], auditoria: ["15189", "evidencia"],
  15189: ["acreditacion", "laboratorio"], 17025: ["calibracion", "ensayo"], 17043: ["aptitud", "eec"], 13528: ["aptitud", "z"], 17511: ["trazabilidad"],
  22870: ["poct"], poct: ["punto", "atencion"], riesgo: ["22367", "gestion"], capa: ["accion", "correctiva", "no", "conformidad"],
  noconformidad: ["no", "conformidad", "capa"], habilitacion: ["3100", "resolucion"], ins: ["salud", "publica", "red"], invima: ["reactivo", "3770"],
  onac: ["acreditacion"], inm: ["metrologia", "nacional"], colombia: ["habilitacion", "ins", "invima", "onac"],
  indicador: ["indicadores", "calidad"], tat: ["tiempo", "respuesta"], critico: ["valores", "criticos"],
  ep05: ["precision"], ep06: ["linealidad"], ep07: ["interferencia"], ep09: ["comparacion"], ep12: ["cualitativa"], ep15: ["verificacion", "precision"],
  ep17: ["lob", "lod"], ep26: ["lote"], ep28: ["intervalo", "referencia"], ep31: ["comparabilidad"], c24: ["control", "estadistico"],
  cualitativ: ["ep12", "sensibilidad"], excel: ["formula", "grafico"], grafico: ["excel", "grafic"], formula: ["excel"],
  levey: ["jennings", "grafico", "control"], ref: ["error", "excel"], desvest: ["desviacion", "excel"], pbrtqc: ["pacientes", "media", "movil"], mensurando: ["magnitud"],
};

export function normalizar(t) {
  return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]+/g, " ").trim();
}
export function raiz(w) {
  if (/^\d/.test(w) || w.length <= 3) return w;
  return w.replace(/(aciones|iciones|ciones)$/, "cion").replace(/(mente)$/, "").replace(/(idades|idad)$/, "idad")
    .replace(/(es|s)$/, (m, _p, off) => (w.length - m.length >= 4 ? "" : m)).replace(/(ico|ica|icos|icas)$/, "ic").replace(/(o|a)$/, (m) => (w.length > 5 ? "" : m));
}
export function tokens(t) {
  return normalizar(t).split(" ").filter((w) => w && !STOP.has(w)).map(raiz);
}

const CALC_INTENT = [
  { id: "mu", re: /incertidumbr|20914|\bmu\b|nordtest|u\(cal|presupuest/, nombre: "Incertidumbre ISO/TS 20914" },
  { id: "sigma", re: /sigma|six sigma|seis sigma|selecci.n de reglas/, nombre: "Métrica Sigma" },
  { id: "westgard", re: /westgard|levey|jennings|corrida|rechaz.*control|reglas de control|1-3s|2-2s|r-4s/, nombre: "Westgard y Levey-Jennings" },
  { id: "ep15", re: /ep15|verific.*precisi|precisi.*declarad|repetibilidad/, nombre: "Verificación EP15" },
  { id: "ep17", re: /ep17|\blob\b|\blod\b|\bloq\b|l.mite de detecci|l.mite del blanco/, nombre: "LoB / LoD EP17" },
  { id: "ep28", re: /ep28|intervalo.* referencia|valores de referencia|rango de referencia/, nombre: "Intervalos de referencia EP28" },
  { id: "vb", re: /variaci.n biol|\bcvi\b|\bcvg\b|\brcv\b|mil.n|especificaci|error total admisible|\beta\b|\btea\b|\bmau\b|individualidad/, nombre: "Especificaciones por variación biológica" },
  { id: "comparacion", re: /comparaci.n de m.todos|ep09|passing|bablok|deming|bland|altman|correlaci.n|dos equipos|comparabilidad/, nombre: "Comparación de métodos" },
  { id: "eec", re: /\beec\b|\beqa\b|evaluaci.n externa|ensayo de aptitud|z.?score|puntaje z|\ben\b n.mero|interlaboratorio|intercomparaci/, nombre: "Puntajes EEC" },
];
const GUIA_INTENT = [
  { id: "verificarValidar", re: /verific.* o valid|valid.* o verific|diferencia entre verific|tengo que validar|debo validar/ },
  { id: "rechazoCIC", re: /rechaz|fuera de control|control (sali|fall)|qu. hago .*control/ },
  { id: "eecInsatisfactorio", re: /eec .*(insatisf|mal|fall)|insatisfactori|z (mayor|>)|aptitud.*(fall|mal)/ },
  { id: "queEP", re: /qu. (clsi|ep|norma) (uso|aplica|debo)|cu.l ep|qu. documento clsi/ },
  { id: "especificacion", re: /qu. especificaci|c.mo elijo .*(eta|meta|especificaci)|modelo de mil.n/ },
  { id: "cambioLote", re: /cambio de lote|nuevo lote|lote nuevo/ },
  { id: "incertidumbreGuia", re: /c.mo (calculo|estimo|hago) la incertidumbre|incertidumbre paso/ },
];

export class Buscador {
  constructor() { this.secciones = []; this.df = new Map(); this.N = 0; this.avgdl = 1; }

  agregarDocumento(archivo, tituloDoc, md) {
    const lineas = md.replace(/\r/g, "").split("\n");
    let h2 = "", actual = null;
    const cerrar = () => { if (actual && actual.md.trim()) this.secciones.push(actual); };
    for (const l of lineas) {
      const m = /^(#{1,3})\s+(.*)$/.exec(l);
      if (m && m[1].length >= 2) {
        cerrar();
        if (m[1].length === 2) h2 = m[2];
        actual = { archivo, doc: tituloDoc, titulo: m[2], ruta: m[1].length === 3 && h2 ? h2 : "", nivel: m[1].length, md: "" };
      } else if (m && m[1].length === 1) {
        continue;
      } else if (actual) actual.md += l + "\n";
      else if (l.trim() && !l.startsWith(">")) actual = { archivo, doc: tituloDoc, titulo: tituloDoc, ruta: "", nivel: 1, md: l + "\n" };
    }
    cerrar();
  }

  construir() {
    this.df.clear();
    let total = 0;
    for (const [i, s] of this.secciones.entries()) {
      s.id = i;
      const tt = tokens(s.titulo + " " + s.ruta), tb = tokens(s.md);
      s.tf = new Map();
      for (const w of tt) s.tf.set(w, (s.tf.get(w) || 0) + 3);
      for (const w of tb) s.tf.set(w, (s.tf.get(w) || 0) + 1);
      s.len = tt.length * 3 + tb.length;
      s.tituloNorm = normalizar(s.titulo);
      total += s.len;
      for (const w of s.tf.keys()) this.df.set(w, (this.df.get(w) || 0) + 1);
    }
    this.N = this.secciones.length;
    this.avgdl = total / Math.max(1, this.N);
  }

  expandir(q) {
    const base = tokens(q), extra = [];
    for (const w of base) for (const [k, vs] of Object.entries(SINONIMOS)) if (w === k || (k.length > 4 && w.startsWith(k))) for (const v of vs) extra.push(raiz(normalizar(v)));
    return { base, extra: extra.filter((w) => !base.includes(w)) };
  }

  buscar(q, max = 8) {
    const { base, extra } = this.expandir(q);
    if (!base.length) return [];
    const k1 = 1.2, b = 0.75, qn = normalizar(q);
    const pesos = new Map();
    for (const w of base) pesos.set(w, 1);
    for (const w of extra) if (!pesos.has(w)) pesos.set(w, 0.45);
    const out = [];
    for (const s of this.secciones) {
      let sc = 0, hits = 0;
      for (const [w, p] of pesos) {
        let f = s.tf.get(w) || 0;
        if (!f && w.length >= 5) for (const [t, c] of s.tf) if (t.startsWith(w)) { f += c * 0.5; } // prefijo
        if (!f) continue;
        const df = this.df.get(w) || 1, idf = Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
        sc += p * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * s.len) / this.avgdl)));
        if (p === 1) hits++;
      }
      if (!sc) continue;
      sc *= 0.6 + 0.4 * (hits / base.length); // cobertura de la consulta
      if (qn.length > 6 && s.tituloNorm.includes(qn)) sc *= 1.8;
      if (s.archivo === "preguntas-frecuentes.md" && s.nivel === 3) sc *= 1.25;
      if (s.archivo === "glosario.md" && base.length <= 2) sc *= 1.3;
      out.push({ s, sc });
    }
    out.sort((a, b) => b.sc - a.sc);
    return out.slice(0, max).map((o) => ({ ...o.s, puntaje: o.sc, extracto: extracto(o.s.md, [...pesos.keys()]) }));
  }

  sugerencias(q) {
    const t = normalizar(q).replace(/ /g, " ");
    const plano = q.toLowerCase();
    return {
      calculadoras: CALC_INTENT.filter((c) => c.re.test(plano) || c.re.test(t)).map((c) => ({ id: c.id, nombre: c.nombre })),
      guias: GUIA_INTENT.filter((g) => g.re.test(plano) || g.re.test(t)).map((g) => g.id),
    };
  }
}

export function extracto(md, terminos, largo = 220) {
  const texto = md.replace(/```[\s\S]*?```/g, " ").replace(/[|#>*`_-]+/g, " ").replace(/\s+/g, " ").trim();
  // normalización que conserva la longitud, para que los índices coincidan con el texto original
  const n = [...texto].map((c) => { const d = c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); return /^[a-z0-9ñ]$/.test(d) ? d : " "; }).join("");
  let pos = -1;
  for (const w of terminos) { const i = n.indexOf(w); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  const ini = Math.max(0, pos - 60);
  return (ini > 0 ? "…" : "") + texto.slice(ini, ini + largo) + (texto.length > ini + largo ? "…" : "");
}
