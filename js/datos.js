// Lectura de datos: CSV/TXT, Excel (SheetJS local) o texto pegado desde Excel.
// Detección de separador y de coma decimal, y mapeo automático de columnas.

export const normCol = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");

export function numero(v) {
  if (typeof v === "number") return v;
  let s = String(v ?? "").trim().replace(/\s/g, "");
  if (!s) return NaN;
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function parsearTexto(texto) {
  const lineas = texto.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lineas.length) throw new Error("No hay datos.");
  // Separador: el primero (tab > ; > ,) que da el mismo número de columnas (≥ 2) en las primeras líneas
  const prueba = lineas.slice(0, 10);
  const columnasCon = (c) => prueba.map((l) => l.split(c).length);
  const sep = ["\t", ";", ","].find((c) => { const n = columnasCon(c); return n[0] >= 2 && n.every((x) => x === n[0]); })
    ?? ["\t", ";", ","].sort((a, b) => columnasCon(b)[0] - columnasCon(a)[0])[0];
  const partir = (l) => {
    if (sep !== ",") return l.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    const out = []; let cur = "", q = false;
    for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur.trim()); cur = ""; } else cur += ch; }
    out.push(cur.trim()); return out;
  };
  let cab = partir(lineas[0]);
  let cuerpo = lineas.slice(1);
  // Sin encabezado: si la primera fila es numérica, se generan nombres
  if (cab.every((c) => Number.isFinite(numero(c)))) { cuerpo = lineas; cab = cab.map((_, i) => (cab.length === 1 ? "valor" : `col${i + 1}`)); }
  const filas = cuerpo.map((l) => { const v = partir(l); return Object.fromEntries(cab.map((c, i) => [c || `col${i + 1}`, v[i] ?? ""])); });
  return { columnas: cab, filas };
}

export async function leerArchivo(archivo) {
  const nombre = archivo.name.toLowerCase();
  if (/\.(xlsx|xlsm|xls|ods)$/.test(nombre)) {
    if (!window.XLSX) throw new Error("El lector de Excel no está disponible.");
    const wb = window.XLSX.read(await archivo.arrayBuffer(), { type: "array" });
    const hojas = wb.SheetNames.map((n) => {
      const filas = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "", raw: true });
      return { nombre: n, columnas: filas.length ? Object.keys(filas[0]) : [], filas };
    }).filter((h) => h.filas.length);
    if (!hojas.length) throw new Error("El libro no tiene hojas con datos.");
    return { hojas };
  }
  const texto = await archivo.text();
  return { hojas: [{ nombre: archivo.name, ...parsearTexto(texto) }] };
}

// campos: [{ clave, etiqueta, sinonimos: [], tipo: "num"|"texto", opcional }]
export function autoMapear(columnas, campos) {
  const usadas = new Set(), mapa = {};
  for (const c of campos) {
    const cands = [c.clave, ...(c.sinonimos || [])].map(normCol);
    let col = columnas.find((k) => !usadas.has(k) && cands.includes(normCol(k)));
    if (!col) col = columnas.find((k) => !usadas.has(k) && cands.some((x) => x.length > 2 && normCol(k).includes(x)));
    if (col) { mapa[c.clave] = col; usadas.add(col); }
  }
  // Si falta un campo numérico obligatorio y sobra una sola columna numérica, se asigna
  const faltan = campos.filter((c) => !mapa[c.clave] && !c.opcional);
  const libres = columnas.filter((k) => !usadas.has(k));
  if (faltan.length === 1 && libres.length === 1) mapa[faltan[0].clave] = libres[0];
  return mapa;
}

export function aplicarMapa(filas, mapa, campos) {
  const out = [];
  for (const f of filas) {
    const o = {};
    let ok = true;
    for (const c of campos) {
      const col = mapa[c.clave];
      if (!col) { if (!c.opcional) ok = false; continue; }
      const v = f[col];
      if (c.tipo === "num") { const n = numero(v); if (!Number.isFinite(n)) { if (!c.opcional) ok = false; continue; } o[c.clave] = n; }
      else { const s = String(v ?? "").trim(); if (!s && !c.opcional) ok = false; o[c.clave] = s; }
    }
    if (ok) out.push(o);
  }
  return out;
}
