# Trazabilidad metrológica, conmutabilidad, EEC y comparabilidad

## 1. Trazabilidad metrológica (ISO 17511:2020)

La trazabilidad es la **propiedad de un resultado** de poder relacionarse con una referencia mediante
una cadena ininterrumpida y documentada de calibraciones, cada una con su incertidumbre (VIM). En el
laboratorio clínico, la cadena la construye **el fabricante** hasta el calibrador del usuario final. El
laboratorio:

1. Obtiene y archiva la **declaración de trazabilidad** del fabricante (a qué referencia, con qué
   procedimiento) y la **u(cal)**.
2. Usa el calibrador y el procedimiento **tal como fueron validados**: si los modifica, rompe la cadena.
3. Verifica la veracidad con EEC conmutable, materiales de referencia o comparación con un laboratorio
   de referencia.
4. Calibra con proveedores competentes (ISO/IEC 17025 con alcance adecuado) los equipos auxiliares
   que afectan el resultado: pipetas, termómetros, balanzas, centrífugas si aplica.

**Jerarquías de calibración en ISO 17511** (de mayor a menor orden metrológico; confirme la tipificación
exacta en la norma):

- Hay un **procedimiento de medida de referencia** y un **material de referencia primario** trazables
  al SI (p. ej. electrolitos, glucosa, creatinina, colesterol, cortisol).
- Hay un procedimiento de referencia internacional convencional, sin trazabilidad al SI (p. ej. HbA1c
  IFCC).
- Hay un **calibrador internacional convencional** (p. ej. estándares internacionales de la OMS para
  proteínas y marcadores; unidades UI).
- Hay un **protocolo de armonización** internacional (ISO 21151).
- Solo existe el calibrador del fabricante ("trazabilidad al calibrador interno del fabricante"): los
  resultados no son comparables entre métodos.

Consulte la **base JCTLM** para saber qué referencias de orden superior existen por mensurando.

**Equipos auxiliares:** la política de trazabilidad de Global ACI (antes ILAC P10) exige calibración por
laboratorios acreditados, institutos nacionales de metrología con CMC publicadas, o alternativas
justificadas. El certificado debe declarar U y k. Use
`modulos/acreditacion/scripts/check_supplier_controls.py` para estructurar la evaluación del proveedor.

## 2. Conmutabilidad

Un material es **conmutable** si se comporta como las muestras de pacientes en los procedimientos
comparados. Muchos materiales de control y de EEC no lo son (matriz liofilizada, aditivos). Por eso:

- La diferencia frente al **grupo par** (mismo método) no informa sobre la veracidad frente a la
  referencia.
- Un material no conmutable puede mostrar diferencias entre métodos que no existen con pacientes, o
  esconder diferencias reales.
- Al cambiar de lote o comparar equipos, use **muestras de pacientes**.

## 3. Evaluación externa de la calidad (EEC/EQA, ensayos de aptitud)

**Categorías de programa** (Miller et al., 2011), de mayor a menor capacidad de evaluar la veracidad:

| Categoría | Material conmutable | Valor asignado | Evalúa |
|---|---|---|---|
| 1 | Sí | Procedimiento de referencia o material certificado | Veracidad absoluta, reproducibilidad, comparabilidad entre métodos |
| 2 | Sí | Consenso de todos los métodos | Comparabilidad entre métodos y reproducibilidad |
| 3–4 | No o desconocido | Consenso por grupo par | Desempeño frente a laboratorios con el mismo método |
| 5–6 | No, sin réplicas | Consenso por grupo par | Solo grueso; poca información |

Prefiera programas acreditados según **ISO/IEC 17043**.

**Puntajes** (ISO 13528):

```
z  = (x − X) / σ_pt         |z| ≤ 2 satisfactorio; 2 < |z| < 3 cuestionable; |z| ≥ 3 insatisfactorio
z' = (x − X) / √(σ_pt² + u(X)²)   cuando u(X) no es despreciable
En = (x − X) / √(U_lab² + U_ref²) |En| ≤ 1 satisfactorio (usa las incertidumbres expandidas)
SDI = (x − media_grupo) / DE_grupo
```

**Análisis que exige ISO 15189**, más allá de "aprobado/no aprobado":

1. Investigar todo resultado insatisfactorio: causa raíz (preanalítica, transcripción, calibración,
   reactivo, interpretación), impacto en los pacientes y acción correctiva verificada.
2. Revisar las **tendencias**: varios resultados del mismo lado o un sesgo persistente aunque
   "aprobado", z creciente, problemas en un solo nivel.
3. Usar la EEC como **fuente de sesgo** para el Sigma y, si se usa Nordtest, para la incertidumbre.
   Promedie varios ciclos y considere la conmutabilidad.
4. La participación debe cubrir el **alcance**: todos los exámenes acreditados y, en lo posible, todos
   los equipos.

**Cuando no existe programa** (alternativas, CLSI QMS24): intercambio de muestras con otros
laboratorios, comparación con un laboratorio de referencia, materiales de referencia, re-análisis de
muestras de pacientes, correlación clínica. Documente la elección y su frecuencia.

## 4. Comparabilidad interna (varios equipos o sedes; CLSI EP31)

- Si dos equipos reportan el mismo examen a los mismos pacientes, los resultados deben ser
  intercambiables dentro de un **criterio definido de antemano** (habitualmente basado en el sesgo
  admisible).
- Use muestras de pacientes en los límites de decisión, con una frecuencia según el riesgo (p. ej.
  semestral, y siempre tras recalibración mayor o cambio de lote si el sistema lo amerita).
- Para comparaciones puntuales: `modulos/validacion/scripts/compare_methods.py` con `--margin`.
- Si no son comparables: armonice (factor de corrección validado, con aprobación del director y
  comunicación a los clínicos) o reporte con intervalos de referencia distintos e identifique el método
  en el informe.

## 5. Errores frecuentes

1. Confundir trazabilidad con calibración: calibrar no garantiza trazabilidad si se ignora la cadena.
2. Interpretar el puntaje frente al grupo par como veracidad.
3. Archivar la EEC "aprobada" sin revisar el sesgo y las tendencias.
4. Usar controles no conmutables para comparar lotes o equipos.
5. Certificados de calibración de equipos auxiliares sin U, sin k o fuera del alcance acreditado del proveedor.
