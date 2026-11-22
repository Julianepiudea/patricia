# Control interno de la calidad (CIC): reglas de Westgard, Sigma y planificación basada en riesgo

> Calculadoras: `scripts/westgard.py` (evalúa corridas), `scripts/sigma_cic.py` (Sigma y selección de
> reglas). Marco normativo: ISO 15189 (aseguramiento de la validez, CIC), CLSI C24 (control estadístico)
> y CLSI EP23 (plan de control basado en riesgo). Confirme los detalles en las copias autorizadas.

## 1. Establecer media y DE objetivo

- **Media y DE propias**, no las del inserto (los rangos del fabricante son amplios y sirven para
  verificar, no para controlar).
- Con un **lote nuevo de control**: ≥ 20 resultados en ≥ 20 días (o el mínimo que la política del
  laboratorio justifique), en paralelo con el lote vigente. Luego actualice con datos acumulados.
- La DE debe reflejar la **imprecisión intermedia** (entre días, entre calibraciones). Una DE calculada
  sobre una sola corrida es demasiado pequeña y dispara rechazos falsos.
- Use material de control **independiente del fabricante del reactivo** cuando sea posible (control de
  tercera opinión), en niveles cercanos a los límites de decisión clínica.

## 2. Reglas de Westgard (multirregla)

| Regla | Definición | Detecta |
|---|---|---|
| 1-2s | 1 control fuera de ±2 DE | **Solo alerta**: activa la inspección con las demás reglas. Como regla de rechazo genera ~9 % de falsos rechazos con 2 controles. |
| 1-3s | 1 control fuera de ±3 DE | Error aleatorio (o sistemático grande) |
| 2-2s | 2 controles consecutivos del mismo lado, más allá de 2 DE (en la misma corrida entre niveles o en el mismo nivel en corridas consecutivas) | Error sistemático |
| R-4s | En una corrida, un control > +2 DE y otro < −2 DE | Error aleatorio |
| 4-1s | 4 consecutivos del mismo lado, más allá de 1 DE | Error sistemático pequeño |
| 2 de 3 2s | 2 de 3 controles del mismo lado, más allá de 2 DE | Sistemático (diseños con 3 niveles) |
| 3-1s | 3 consecutivos del mismo lado, más allá de 1 DE | Sistemático (3 niveles) |
| 8x / 10x / 12x | 8, 10 o 12 consecutivos del mismo lado de la media | Sistemático pequeño o tendencia |

**Ante un rechazo:** no libere resultados. Identifique el tipo de error con la regla violada, busque la
causa (calibración, reactivo, lote, mantenimiento, muestra de control), corrija, repita los controles,
**evalúe el impacto en los pacientes** desde el último control aceptable (repita muestras si procede) y
registre todo. Repetir el control "hasta que entre" sin investigar es una no conformidad.

## 3. Métrica Sigma

```
Sigma = (ETa − |sesgo|) / CV          ΔSEc = Sigma − 1,65
```

- **ETa**: error total admisible. Declare la fuente (variación biológica, CLIA, RiliBÄK, consenso
  nacional) y por qué es adecuada (modelos de Milán; ver `especificaciones-desempeno.md`).
- **Sesgo**: de la EEC (promedio de varios ciclos frente al grupo par o al valor de referencia), de un
  material de referencia o de una comparación con un método de referencia. Declare la fuente.
- **CV**: imprecisión intermedia del CIC a la misma concentración que el sesgo y el ETa.

### Selección de reglas (Westgard Sigma Rules, 2 niveles)

| Sigma | Reglas | N (controles) / R (corridas) |
|---|---|---|
| ≥ 6 | 1-3s | N = 2, R = 1 |
| 5 – < 6 | 1-3s / 2-2s / R-4s | N = 2, R = 1 |
| 4 – < 5 | 1-3s / 2-2s / R-4s / 4-1s | N = 4, R = 1 o N = 2, R = 2 |
| 3 – < 4 | 1-3s / 2-2s / R-4s / 4-1s / 8x | N = 4, R = 2 o N = 2, R = 4; control máximo y mejora del método |
| < 3 | El CIC no garantiza la calidad | Mejorar o cambiar el método; revisar el ETa; considerar PBRTQC y repeticiones |

Para cálculos formales de probabilidad de rechazo (Ped, Pfr) y de cartas OPSpecs, use herramientas
dedicadas o la copia de C24.

## 4. Plan de CIC basado en riesgo (C24 y EP23)

Un plan completo define, por analito: **número de controles por evento**, **frecuencia** (o tamaño de
la corrida entre controles), **reglas** y **acción** ante rechazo. Los factores son:

1. El desempeño del método (Sigma).
2. La **gravedad del daño** de un resultado erróneo (uso clínico).
3. El **número esperado de resultados de pacientes no confiables** si ocurre un fallo entre dos
   eventos de control: el modelo de Parvin, **Max E(Nuf)**. Un Sigma alto permite corridas más largas.
4. La estabilidad del sistema, el volumen de trabajo y la posibilidad de corregir informes.
5. Los controles de riesgo del fabricante y del propio laboratorio (EP23: mapa de procesos, AMFE,
   mitigaciones).

**Momentos obligatorios de control**, además de la frecuencia de rutina: después de calibrar, de un
mantenimiento mayor, de un cambio de lote de reactivo o de una falla, y antes de reportar si el sistema
estuvo detenido.

## 5. Complementos del CIC convencional

- **PBRTQC** (control en tiempo real basado en pacientes: medias móviles, mediana móvil, EWMA). Útil en
  analitos de alto volumen y Sigma bajo, y para detectar desplazamientos entre eventos de control.
  Requiere configuración y validación (recomendaciones de IFCC).
- **Delta checks** (CLSI EP33): detectan errores de identificación y cambios no plausibles.
- **Autoverificación**: reglas validadas en el LIS, con auditoría periódica.

## 6. Cambio de lote de reactivo (CLSI EP26)

- Use **muestras de pacientes**, no solo controles: los controles pueden no ser conmutables y ocultar o
  inventar diferencias entre lotes.
- Defina antes del estudio la **diferencia crítica** (basada en el sesgo admisible) y el número de
  muestras necesario para detectarla.
- Lleve un registro acumulado de las diferencias entre lotes: pequeños desplazamientos sucesivos se
  acumulan (*drift*).

## 7. Errores frecuentes

1. Usar la DE del inserto o una DE de una sola corrida.
2. Usar 1-2s como regla de rechazo.
3. Aplicar las mismas reglas a todos los analitos, sin considerar el Sigma.
4. Recalcular la media con cada dato y absorber así el desplazamiento.
5. Un control único por día en un analito de Sigma bajo y alto volumen.
6. No evaluar el impacto retrospectivo en los pacientes tras un rechazo.
7. Calcular el Sigma con el sesgo y el CV a concentraciones diferentes, o con un ETa no declarado.
