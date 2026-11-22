// Definición de las calculadoras para la interfaz: campos del formulario, columnas de datos,
// ejemplo cargable y función que ejecuta el cálculo. Sin DOM.
import * as C from "./calculos.js";

// Generador pseudoaleatorio reproducible para los ejemplos
function prng(semilla) {
  let s = semilla >>> 0;
  const u = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  return { u, g: (m = 0, d = 1) => m + d * Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u()) };
}
const f2 = (x, d = 2) => x.toFixed(d);

const lista = (txt) => String(txt || "").split(/[;\s]+/).map((s) => s.replace(",", ".")).map(Number).filter(Number.isFinite);
const pares = (txt) => String(txt || "").split(/[;\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => {
  const [n, v] = s.split("="); return { nombre: (n || "").trim(), cv: Number(String(v || "").replace(",", ".")) };
}).filter((p) => p.nombre && Number.isFinite(p.cv));
const v = (x) => (x === "" || x === undefined || x === null ? null : Number(String(x).replace(",", ".")));

export const CALCULADORAS = [
  {
    id: "mu", nombre: "Incertidumbre ISO/TS 20914", corto: "Incertidumbre", icono: "sigma", color: "teal",
    descripcion: "u_c y U a partir del CIC a largo plazo y del calibrador; comparación con la MAU de EFLM.",
    datosOpcionales: true,
    campos: [
      { id: "analito", etiqueta: "Analito / mensurando", tipo: "texto", ph: "p. ej. Glucosa en plasma (mmol/L)" },
      { id: "cvs", etiqueta: "CV de imprecisión intermedia por nivel (si no carga datos)", tipo: "texto", ph: "N1=1,9; N2=1,6", ayuda: "Formato nivel=CV%, separados por punto y coma." },
      { id: "UCal", etiqueta: "U del calibrador (%)", tipo: "num", ph: "1,6", ayuda: "Expandida, del certificado del fabricante." },
      { id: "kCal", etiqueta: "k del certificado", tipo: "num", ph: "2" },
      { id: "uCal", etiqueta: "…o u(cal) estándar (%)", tipo: "num", ph: "0,8" },
      { id: "cvi", etiqueta: "CVI (%) para la MAU", tipo: "num", ph: "5,0", ayuda: "Base EFLM de variación biológica." },
      { id: "k", etiqueta: "k del resultado", tipo: "num", valor: "2" },
      { id: "nordtest", etiqueta: "Incluir sesgo (modelo Nordtest)", tipo: "check" },
      { id: "rmsSesgo", etiqueta: "RMS del sesgo (%)", tipo: "num", siCheck: "nordtest" },
      { id: "uCref", etiqueta: "u(Cref) (%)", tipo: "num", siCheck: "nordtest" },
    ],
    columnas: [{ clave: "nivel", etiqueta: "Nivel", sinonimos: ["control", "lote", "level"], tipo: "texto" }, { clave: "valor", etiqueta: "Valor", sinonimos: ["resultado", "result", "value", "medida"], tipo: "num" }],
    ejemplo: () => { const r = prng(11); let t = "nivel;valor\n"; for (let i = 0; i < 180; i++) { const lote = i > 90 ? 0.06 : 0; t += `N1;${f2(r.g(5.5 + lote, 0.1), 3).replace(".", ",")}\nN2;${f2(r.g(16.4 + 2 * lote, 0.27), 3).replace(".", ",")}\n`; } return t; },
    ejecutar: (f, filas) => C.incertidumbre20914({ analito: f.analito, niveles: filas.length ? C.nivelesDesdeFilas(filas) : pares(f.cvs),
      UCal: v(f.UCal), kCal: v(f.kCal), uCal: v(f.UCal) != null ? null : v(f.uCal), cvi: v(f.cvi), k: v(f.k) || 2,
      rmsSesgo: f.nordtest ? v(f.rmsSesgo) : null, uCref: f.nordtest ? v(f.uCref) : null }),
  },
  {
    id: "sigma", nombre: "Métrica Sigma y reglas", corto: "Sigma", icono: "gauge", color: "violet",
    descripcion: "Sigma = (ETa − |sesgo|)/CV y selección de reglas de Westgard y número de controles.",
    datosOpcionales: true,
    campos: [
      { id: "analito", etiqueta: "Analito", tipo: "texto", ph: "Glucosa" },
      { id: "eta", etiqueta: "ETa (%)", tipo: "num", ph: "6,96" }, { id: "sesgo", etiqueta: "Sesgo (%)", tipo: "num", ph: "1,2" }, { id: "cv", etiqueta: "CV (%)", tipo: "num", ph: "1,4" },
    ],
    columnas: [{ clave: "analito", etiqueta: "Analito", sinonimos: ["prueba", "examen", "test"], tipo: "texto" }, { clave: "eta", etiqueta: "ETa %", sinonimos: ["tea", "etotal", "erroradmisible"], tipo: "num" },
      { clave: "sesgo", etiqueta: "Sesgo %", sinonimos: ["bias"], tipo: "num", opcional: true }, { clave: "cv", etiqueta: "CV %", sinonimos: ["imprecision", "cva"], tipo: "num" }, { clave: "nivel", etiqueta: "Nivel", tipo: "texto", opcional: true }],
    ejemplo: () => "analito;eta;sesgo;cv\nGlucosa;6,96;1,2;1,4\nColesterol;8,5;2,1;1,6\nCreatinina;8,9;3,0;2,4\nSodio;0,9;0,3;0,6\nALT;27;4,0;3,1\nTSH;23,7;5,0;3,9\nCalcio;2,4;0,8;1,3\nHbA1c;6,0;1,5;1,8",
    ejecutar: (f, filas) => C.sigma({ analitos: filas.length ? filas : [{ analito: f.analito, eta: v(f.eta), sesgo: v(f.sesgo) || 0, cv: v(f.cv) }] }),
  },
  {
    id: "westgard", nombre: "Westgard y Levey-Jennings", corto: "Westgard", icono: "activity", color: "rose",
    descripcion: "Evalúa cada corrida con las reglas elegidas y dibuja los gráficos de Levey-Jennings.",
    campos: [
      { id: "objetivos", etiqueta: "Media y DE objetivo por nivel", tipo: "texto", ph: "N1=5,2/0,12; N2=12,8/0,30", ayuda: "Formato nivel=media/DE. Vacío = calcular con los primeros N datos." },
      { id: "nPrimeros", etiqueta: "N datos para calcular objetivos (si no los da)", tipo: "num", valor: "20" },
      { id: "reglas", etiqueta: "Reglas", tipo: "multi", opciones: C.REGLAS_WESTGARD, valor: ["1-2s", "1-3s", "2-2s", "R-4s", "4-1s", "10x"] },
      { id: "entreNiveles", etiqueta: "Evaluar reglas también entre niveles", tipo: "check", valor: true },
    ],
    columnas: [{ clave: "corrida", etiqueta: "Corrida / fecha", sinonimos: ["fecha", "run", "dia", "date"], tipo: "texto" }, { clave: "nivel", etiqueta: "Nivel", sinonimos: ["control", "level"], tipo: "texto" },
      { clave: "valor", etiqueta: "Valor", sinonimos: ["resultado", "result", "value"], tipo: "num" }],
    obligatorioDatos: true,
    ejemplo: () => { const r = prng(5); let t = "corrida;nivel;valor\n"; for (let i = 1; i <= 40; i++) { const sh = i > 32 ? 0.3 : 0; t += `${i};N1;${f2(r.g(5.2 + sh, 0.12), 3).replace(".", ",")}\n${i};N2;${f2(r.g(12.8 + 2.5 * sh, 0.3), 3).replace(".", ",")}\n`; } return t; },
    ejecutar: (f, filas) => {
      let objetivos = {};
      for (const p of String(f.objetivos || "").split(/[;\n]+/).map((s) => s.trim()).filter(Boolean)) {
        const [n, mv] = p.split("="); const [m, s] = String(mv || "").split("/").map((x) => Number(String(x).replace(",", ".")));
        if (n && Number.isFinite(m) && Number.isFinite(s)) objetivos[n.trim()] = { media: m, de: s };
      }
      if (!Object.keys(objetivos).length) objetivos = C.objetivosDesdeDatos(filas, v(f.nPrimeros) || 20);
      return C.westgard({ filas, objetivos, reglas: f.reglas, entreNiveles: !!f.entreNiveles });
    },
  },
  {
    id: "ep15", nombre: "Verificación de precisión y veracidad (EP15)", corto: "EP15", icono: "crosshair", color: "sky",
    descripcion: "ANOVA días × réplicas, límite superior de verificación y sesgo frente a un valor asignado.",
    campos: [
      { id: "cvRDecl", etiqueta: "CV repetibilidad declarado (%)", tipo: "num" }, { id: "cvWLDecl", etiqueta: "CV intralaboratorio declarado (%)", tipo: "num" },
      { id: "niveles", etiqueta: "Nº de niveles evaluados", tipo: "num", valor: "2", ayuda: "Corrige α por comparaciones múltiples." },
      { id: "vo", etiqueta: "Valor objetivo del material (opcional)", tipo: "num" }, { id: "uVo", etiqueta: "u del valor objetivo", tipo: "num" },
    ],
    columnas: [{ clave: "dia", etiqueta: "Día", sinonimos: ["corrida", "run", "fecha", "day"], tipo: "texto" }, { clave: "valor", etiqueta: "Valor", sinonimos: ["resultado", "result"], tipo: "num" }],
    obligatorioDatos: true,
    ejemplo: () => { const r = prng(3); let t = "dia;valor\n"; for (let d = 1; d <= 5; d++) { const b = r.g(0, 1); for (let k = 0; k < 5; k++) t += `${d};${f2(r.g(100 + b, 1.0)).replace(".", ",")}\n`; } return t; },
    ejecutar: (f, filas) => C.ep15({ filas, cvRDecl: v(f.cvRDecl), cvWLDecl: v(f.cvWLDecl), niveles: v(f.niveles) || 1, vo: v(f.vo), uVo: v(f.uVo) || 0 }),
  },
  {
    id: "ep17", nombre: "LoB y LoD (EP17)", corto: "LoB/LoD", icono: "scan-search", color: "amber",
    descripcion: "Límite del blanco paramétrico y no paramétrico, y límite de detección con muestras bajas.",
    campos: [],
    columnas: [{ clave: "tipo", etiqueta: "Tipo (blanco/baja)", sinonimos: ["clase", "grupo"], tipo: "texto" }, { clave: "muestra", etiqueta: "Muestra", sinonimos: ["id", "sample"], tipo: "texto" },
      { clave: "valor", etiqueta: "Valor", sinonimos: ["resultado", "result"], tipo: "num" }],
    obligatorioDatos: true,
    ejemplo: () => { const r = prng(9); let t = "tipo;muestra;valor\n"; for (let m = 1; m <= 4; m++) for (let k = 0; k < 15; k++) t += `blanco;B${m};${f2(Math.abs(r.g(0.02, 0.03)), 4).replace(".", ",")}\n`; for (let m = 1; m <= 5; m++) for (let k = 0; k < 12; k++) t += `baja;L${m};${f2(r.g(0.15, 0.035), 4).replace(".", ",")}\n`; return t; },
    ejecutar: (f, filas) => {
      const esBlanco = (x) => /^(blanc|blank|cero|zero|0$)/i.test(String(x.tipo).trim());
      return C.ep17({ blancos: filas.filter(esBlanco), bajas: filas.filter((x) => !esBlanco(x)) });
    },
  },
  {
    id: "ep28", nombre: "Intervalos de referencia (EP28)", corto: "Intervalos", icono: "ruler", color: "emerald",
    descripcion: "Transferencia con 20 sanos locales o establecimiento no paramétrico con IC 90 %.",
    campos: [
      { id: "modo", etiqueta: "Qué desea hacer", tipo: "select", opciones: [["verificar", "Verificar / transferir un intervalo"], ["establecer", "Establecer un intervalo (n ≥ 120)"]], valor: "verificar" },
      { id: "li", etiqueta: "Límite inferior a verificar", tipo: "num", siSelect: ["modo", "verificar"] }, { id: "ls", etiqueta: "Límite superior a verificar", tipo: "num", siSelect: ["modo", "verificar"] },
    ],
    columnas: [{ clave: "valor", etiqueta: "Valor", sinonimos: ["resultado", "result"], tipo: "num" }],
    obligatorioDatos: true,
    ejemplo: () => { const r = prng(21); let t = "valor\n"; for (let i = 0; i < 20; i++) t += f2(r.g(4.3, 0.4)).replace(".", ",") + "\n"; return t; },
    ejecutar: (f, filas) => C.ep28({ valores: filas.map((x) => x.valor), modo: f.modo, li: v(f.li), ls: v(f.ls) }),
  },
  {
    id: "vb", nombre: "Especificaciones por variación biológica", corto: "Variación biológica", icono: "heart-pulse", color: "pink",
    descripcion: "CVa, sesgo, ETa y MAU admisibles; RCV normal y log-normal; índice de individualidad.",
    sinDatos: true,
    campos: [
      { id: "analito", etiqueta: "Analito", tipo: "texto", ph: "Glucosa" },
      { id: "cvi", etiqueta: "CVI (%)", tipo: "num", ph: "5,0" }, { id: "cvg", etiqueta: "CVG (%)", tipo: "num", ph: "7,5" },
      { id: "cva", etiqueta: "CV analítico de su método (%)", tipo: "num", ayuda: "Opcional: evalúa qué nivel alcanza." }, { id: "sesgo", etiqueta: "Sesgo de su método (%)", tipo: "num" },
      { id: "prob", etiqueta: "Probabilidad del RCV", tipo: "select", opciones: [["0.95", "95 %"], ["0.99", "99 %"], ["0.90", "90 %"]], valor: "0.95" },
      { id: "unilateral", etiqueta: "RCV unidireccional", tipo: "check" },
    ],
    ejecutar: (f) => C.especificacionesVB({ analito: f.analito, cvi: v(f.cvi), cvg: v(f.cvg), cva: v(f.cva), sesgo: v(f.sesgo), prob: Number(f.prob), unilateral: !!f.unilateral }),
  },
  {
    id: "comparacion", nombre: "Comparación de métodos (EP09)", corto: "Comparación", icono: "scale", color: "indigo",
    descripcion: "Passing-Bablok, Deming, Bland-Altman, sesgo en límites de decisión y equivalencia TOST.",
    campos: [
      { id: "nombreX", etiqueta: "Método comparativo (X)", tipo: "texto", valor: "Comparativo" }, { id: "nombreY", etiqueta: "Método nuevo (Y)", tipo: "texto", valor: "Nuevo" },
      { id: "decisiones", etiqueta: "Límites de decisión clínica", tipo: "texto", ph: "7; 11,1", ayuda: "Separados por punto y coma." },
      { id: "sesgoAdm", etiqueta: "Sesgo admisible (%)", tipo: "num" }, { id: "delta", etiqueta: "δ de Deming (razón de varianzas del error)", tipo: "num", valor: "1" },
      { id: "relativo", etiqueta: "Bland-Altman en %", tipo: "check" }, { id: "margen", etiqueta: "Margen de equivalencia TOST (opcional)", tipo: "num" },
    ],
    columnas: [{ clave: "x", etiqueta: "Comparativo (X)", sinonimos: ["referencia", "reference", "comparativo", "actual", "metodo1", "a"], tipo: "num" },
      { clave: "y", etiqueta: "Nuevo (Y)", sinonimos: ["nuevo", "test", "candidato", "metodo2", "b"], tipo: "num" }],
    obligatorioDatos: true,
    ejemplo: () => { const r = prng(17); let t = "comparativo;nuevo\n"; for (let i = 0; i < 50; i++) { const x = 3 + r.u() * 22; t += `${f2(x + r.g(0, 0.25)).replace(".", ",")};${f2(1.03 * x + 0.1 + r.g(0, 0.3)).replace(".", ",")}\n`; } return t; },
    ejecutar: (f, filas) => C.comparacionMetodos({ pares: filas, delta: v(f.delta) || 1, relativo: !!f.relativo, decisiones: lista(f.decisiones), sesgoAdm: v(f.sesgoAdm), margen: v(f.margen), nombreX: f.nombreX || "Comparativo", nombreY: f.nombreY || "Nuevo" }),
  },
  {
    id: "eec", nombre: "Puntajes de EEC (z, z', En)", corto: "EEC", icono: "award", color: "orange",
    descripcion: "Puntajes según ISO 13528, calificación y detección de sesgo persistente entre ciclos.",
    datosOpcionales: true,
    campos: [
      { id: "x", etiqueta: "Su resultado (x)", tipo: "num" }, { id: "X", etiqueta: "Valor asignado (X)", tipo: "num" }, { id: "spt", etiqueta: "σpt (DE para la evaluación)", tipo: "num" },
      { id: "uX", etiqueta: "u(X) (opcional, para z')", tipo: "num" }, { id: "Ulab", etiqueta: "U del laboratorio (para En)", tipo: "num" }, { id: "Uref", etiqueta: "U del valor de referencia", tipo: "num" },
    ],
    columnas: [{ clave: "analito", etiqueta: "Analito / ciclo", sinonimos: ["muestra", "ciclo", "prueba"], tipo: "texto", opcional: true }, { clave: "x", etiqueta: "Resultado", sinonimos: ["resultado", "lab", "valor"], tipo: "num" },
      { clave: "X", etiqueta: "Asignado", sinonimos: ["asignado", "objetivo", "target", "media", "consenso"], tipo: "num" }, { clave: "spt", etiqueta: "σpt", sinonimos: ["de", "sd", "sigma", "desviacion"], tipo: "num", opcional: true },
      { clave: "uX", etiqueta: "u(X)", sinonimos: ["ux", "incertidumbreasignado"], tipo: "num", opcional: true }, { clave: "Ulab", etiqueta: "U lab", sinonimos: ["ulab"], tipo: "num", opcional: true }, { clave: "Uref", etiqueta: "U ref", sinonimos: ["uref"], tipo: "num", opcional: true }],
    ejemplo: () => "ciclo;resultado;asignado;de\nGlucosa 2026-1;5,42;5,30;0,16\nGlucosa 2026-2;7,95;7,80;0,23\nGlucosa 2026-3;10,9;10,6;0,32\nGlucosa 2026-4;6,30;6,10;0,18\nGlucosa 2026-5;4,61;4,50;0,14",
    ejecutar: (f, filas) => C.puntajesEEC({ filas: filas.length ? filas : [{ analito: "Resultado", x: v(f.x), X: v(f.X), spt: v(f.spt), uX: v(f.uX), Ulab: v(f.Ulab), Uref: v(f.Uref) }] }),
  },
];
