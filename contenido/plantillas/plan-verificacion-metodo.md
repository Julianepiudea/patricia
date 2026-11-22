# Plan y reporte de verificación del método — [ANALITO / EQUIPO]

> BORRADOR. Los criterios de aceptación se fijan y aprueban **antes** de recolectar datos.

## 1. Identificación
- Examen, matriz, unidades: [ ]
- Método, reactivo (registro INVIMA), calibrador, equipo: [ ]
- Tipo de estudio: [verificación (método sin modificar) / validación (modificado o LDT)]
- Responsables y periodo: [ ]

## 2. Especificaciones de desempeño (fuente declarada)
| Característica | Declaración del fabricante | Especificación del laboratorio | Fuente |
|---|---|---|---|
| CV repetibilidad | [ ] | [ ] | [ ] |
| CV intralaboratorio | [ ] | [ ] | [EFLM deseable = 0,5·CVI] |
| Sesgo | [ ] | [ ] | [ ] |
| ETa | — | [ ] | [ ] |
| Intervalo de medida | [ ] | [ ] | — |
| LoD / LoQ (si aplica) | [ ] | [ ] | — |
| Intervalo de referencia | [ ] | [ ] | [inserto / bibliografía] |

## 3. Diseño
| Característica | Documento | Diseño | Materiales | Herramienta |
|---|---|---|---|---|
| Precisión | CLSI EP15 | [5 días × 5 réplicas × ≥2 niveles] | [ ] | `scripts/verificacion_ep15.py` |
| Veracidad | EP15 / EP09 | [material con valor asignado / ≥40 pacientes] | [ ] | `verificacion_ep15.py` / `compare_methods.py` |
| Linealidad | EP06 | [5–7 niveles × 2–3 réplicas] | [ ] | `check_response.py` |
| Intervalo de referencia | EP28 | [20 sanos locales] | [ ] | `scripts/intervalos_ep28.py verificar` |
| Otros | [ ] | [ ] | [ ] | [ ] |

## 4. Resultados (adjuntar datos crudos trazables)
| Característica | Resultado (IC) | Criterio | ¿Cumple? |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |

Sigma resultante = (ETa − |sesgo|)/CV = [ ] → reglas de CIC propuestas: [ ] (`scripts/sigma_cic.py`)

## 5. Desviaciones del plan y justificación
[ ]

## 6. Conclusión
[El método (cumple / no cumple) las especificaciones para el uso previsto. Condiciones o restricciones: ]

| Elaboró | Revisó | Aprobó (director/a del laboratorio) | Fecha |
|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] |
