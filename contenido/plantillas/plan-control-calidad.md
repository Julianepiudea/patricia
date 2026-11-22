# Plan de control interno de la calidad por analito

> BORRADOR. Revisar al menos anualmente y tras cambios de método, equipo o desempeño.

| Analito | Equipo | Material de control (fabricante, independiente sí/no) | Niveles (conc.) | Media/DE propias (periodo, n) | ETa (fuente) | Sesgo (fuente) | CV | Sigma | Reglas | N por evento | Frecuencia / tamaño de corrida | Riesgo clínico (gravedad) | PBRTQC | Responsable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Eventos de control obligatorios adicionales
- Después de calibrar, de un mantenimiento mayor, de un cambio de lote de reactivo o de una falla, y
  antes de reportar tras una parada del sistema.

## Acción ante rechazo
1. Detener la liberación de resultados.
2. Identificar el tipo de error (aleatorio o sistemático) según la regla violada.
3. Investigar la causa y corregirla; repetir los controles.
4. Evaluar los resultados de pacientes desde el último control aceptable; repetir las muestras según el riesgo.
5. Registrar todo en el formato [ ] y, si procede, abrir una no conformidad o CAPA.

## Herramientas
- `py -3 scripts/sigma_cic.py --csv analitos.csv` (Sigma y selección de reglas)
- `py -3 scripts/westgard.py -i cic.csv --objetivos objetivos.csv --entre-niveles` (evaluación de corridas)
