# Verificación y validación de métodos en el laboratorio clínico

> Puente entre ISO 15189 (verificación y validación de métodos) y la serie CLSI EP. Las herramientas
> genéricas (ICH Q2, USP, M10, estadística de linealidad, TOST) están en `modulos/validacion/`. Las
> calculadoras específicas para el laboratorio clínico están en `scripts/`. Los diseños, réplicas y
> criterios exactos vienen de la copia autorizada de cada documento CLSI.

## 1. ¿Verificar o validar?

| Situación | Qué corresponde |
|---|---|
| Método comercial con marcado o registro sanitario (INVIMA), usado según el inserto | **Verificación**: confirmar que el laboratorio reproduce las declaraciones del fabricante |
| Método comercial **modificado** (otra matriz, otro intervalo, otro tipo de muestra, otro equipo) | **Validación** de los aspectos modificados |
| Prueba desarrollada en el laboratorio (LDT), método no normalizado, uso fuera del previsto | **Validación** completa |
| Transferencia a otro equipo o sede | Verificación más **comparabilidad** (EP09 o EP31) |

Antes de diseñar, fije las **especificaciones de desempeño** (ver `especificaciones-desempeno.md`). Un
criterio fijado después de ver los datos no es un criterio de aceptación.

## 2. Plan mínimo de verificación de un método cuantitativo

| Característica | Documento | Diseño orientativo (confirme en la copia) | Herramienta |
|---|---|---|---|
| Precisión (repetibilidad e intralaboratorio) | EP15 | 5 días × 5 réplicas por nivel, ≥ 2 niveles | `scripts/verificacion_ep15.py` |
| Veracidad / sesgo | EP15 (material con valor asignado) o EP09 (pacientes frente al método comparativo) | Material de referencia o EEC con valor asignado; o ≥ 40 muestras de pacientes en todo el intervalo | `verificacion_ep15.py --valor-objetivo`, `modulos/validacion/scripts/compare_methods.py` |
| Intervalo de medida analítico (linealidad) | EP06 | 5–7 niveles por mezcla, 2–3 réplicas | `modulos/validacion/scripts/check_response.py` |
| Límites bajos (si es clínicamente relevante: troponina hs, TSH, PSA) | EP17 | Blancos y muestras bajas, varios días y lotes | `scripts/lob_lod_ep17.py` |
| Intervalos de referencia | EP28 | Transferencia con 20 sanos locales | `scripts/intervalos_ep28.py verificar` |
| Interferencias (hemólisis, ictericia, lipemia y fármacos relevantes) | EP07 / EP37 | Si el uso local difiere de lo declarado | — |
| Arrastre (*carry-over*) | — | Secuencia alto-alto-alto / bajo-bajo-bajo | — |

**Sobre la linealidad (EP06):** la edición actual de EP06 evalúa la **desviación respecto a la
linealidad** frente a una no linealidad admisible definida por el laboratorio, comparando ajustes
polinomiales. `check_response.py` usa la prueba de falta de ajuste y los residuos; es un buen
diagnóstico, pero para un reporte EP06 compare además la desviación en cada nivel con el criterio
admisible. Un r² alto **no** demuestra linealidad.

**Sobre la comparación de métodos (EP09):**
- Grafique primero (diferencias de Bland-Altman y dispersión); después haga la regresión.
- Use regresión de Deming (si conoce la razón de varianzas) o Passing-Bablok. Evite la regresión por
  mínimos cuadrados ordinarios cuando ambos métodos tienen error.
- Estime el sesgo **en los límites de decisión clínica**, con su IC, y compárelo con el sesgo admisible.
- El coeficiente de correlación no evalúa la concordancia.
- "p > 0,05, no hay diferencia" no prueba equivalencia: use TOST con un margen definido de antemano (`compare_methods.py --margin`).

## 3. Interpretación de la verificación de precisión (EP15)

- Si la DE observada es ≤ la declarada, queda verificada.
- Si la DE observada es mayor que la declarada pero ≤ al **límite superior de verificación (LSV)**,
  también queda verificada: la diferencia es compatible con la variación de muestreo.
- Si la DE observada es mayor que el LSV, **no queda verificada**: investigue la causa (diseño, equipo,
  reactivo) o compare con la especificación de calidad del laboratorio, que es lo clínicamente
  relevante.

La corrección de α por número de niveles en el script es conservadora (Bonferroni). Confirme el factor
exacto en EP15.

## 4. Métodos cualitativos (EP12)

- **Concordancia** con el método comparativo o el estándar de referencia: tabla 2×2, sensibilidad y
  especificidad diagnósticas, o acuerdo positivo y negativo (PPA/NPA) si el comparativo no es un
  estándar de referencia. Siempre con IC 95 % (Wilson o Clopper-Pearson). Use kappa solo como
  complemento.
- **Imprecisión del valor de corte**: el intervalo C5–C95 (concentraciones con 5 % y 95 % de resultados
  positivos).
- **Panel de verificación**: incluya positivos débiles cerca del valor de corte, no solo positivos francos.

## 5. Microbiología y biología molecular

- **Identificación y antibiograma comerciales** (CLSI M52): concordancia categórica, errores muy mayores,
  mayores y menores frente al método de referencia, con los criterios de la copia autorizada.
- **PCR cuantitativa**: linealidad sobre log10, eficiencia, LoD por probit, precisión en log10.
  `check_detection_limits.py` incluye enfoques para qPCR (ver `modulos/validacion/references/ich-q2r2.md`).

## 6. Reporte de verificación (estructura)

Use `modulos/validacion/assets/validation-report-template.md` o `plantillas/plan-verificacion-metodo.md`
con esta estructura:

1. Mensurando, método, equipo, lotes, periodo y responsables.
2. Especificaciones de desempeño y su fuente, fijadas **antes**.
3. Diseño y datos crudos trazables.
4. Resultados por característica, con sus intervalos de confianza.
5. Comparación con las declaraciones y las especificaciones.
6. Conclusión con firma del responsable autorizado.
7. Desviaciones del plan y su justificación.
