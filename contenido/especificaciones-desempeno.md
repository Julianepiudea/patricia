# Especificaciones de desempeño analítico y variación biológica

> Calculadora: `scripts/especificaciones_vb.py`. Fuente de datos recomendada: base EFLM de variación
> biológica (biologicalvariation.eu), con estimaciones evaluadas por la lista BIVAC.

## 1. Consenso de Milán (EFLM, 2014): tres modelos

| Modelo | Base | Cuándo |
|---|---|---|
| 1. Resultado clínico | Efecto del desempeño analítico en las decisiones o resultados clínicos (estudios directos o simulación) | Analitos con límites de decisión bien definidos y papel central en el diagnóstico (p. ej. HbA1c, colesterol, troponina) |
| 2. Variación biológica | Componentes CVI y CVG | Analitos en estado estacionario homeostático (p. ej. electrolitos, enzimas) |
| 3. Estado del arte | El mejor desempeño alcanzable o el obtenido por una proporción de laboratorios | Cuando los anteriores no son aplicables o no son alcanzables |

El grupo EFLM *Task Finish Group* asignó analitos a modelos (Ceriotti et al., 2017). Antes de elegir,
justifique el modelo por analito.

## 2. Fórmulas del modelo de variación biológica

Con f = 0,25 (óptimo), 0,50 (deseable), 0,75 (mínimo):

```
Imprecisión:    CVa ≤ f · CVI
Sesgo:          |B| ≤ (f/2) · √(CVI² + CVG²)
Error total:    ETa = 1,65 · CVa + |B|      (con los máximos del mismo nivel)
MAU estándar:   u ≤ f · CVI                 (EFLM; expandida = 2·u)
```

**RCV** (valor de referencia del cambio entre dos resultados seriados):

```
RCV = √2 · Z · √(CVa² + CVI²)     Z = 1,96 (bidireccional 95 %) ; 1,645 (unidireccional 95 %)
Log-normal (asimétrico, preferible con CV altos):
  σ = √ln(1 + CVa² + CVI²)   (CV en fracción)
  RCV↑ = exp(+Z·√2·σ) − 1     RCV↓ = exp(−Z·√2·σ) − 1
```

**Índice de individualidad** II = CVI / CVG. Con II < 0,6 el intervalo de referencia poblacional es
poco útil para seguir a un individuo: priorice el RCV. Con II > 1,4 el intervalo poblacional funciona
bien.

## 3. Error total frente a incertidumbre

| | Error total (ET) | Incertidumbre (MU) |
|---|---|---|
| Modelo | Sesgo y imprecisión combinados linealmente (Westgard) | Se asume que el sesgo está corregido; combinación cuadrática (GUM, ISO/TS 20914) |
| Uso típico | Planificación del CIC, Sigma, aceptación de métodos | Expresar la calidad del resultado, exigido por ISO 15189 y por la trazabilidad |
| Especificación | ETa | MAU |

Son complementarios. No mezcle un ETa con una u_c en el mismo criterio sin declararlo.

## 4. Otras fuentes de ETa (declare siempre cuál se usa)

- **CLIA** (EE. UU.): criterios de aceptación de PT, actualizados (revise la versión vigente). Son
  límites regulatorios, a menudo más amplios que la meta biológica.
- **RiliBÄK** (Alemania): límites de desviación para EEC.
- **Programas de EEC**: límites del proveedor por analito.
- **Consensos nacionales o de sociedades científicas.**
- **Tablas antiguas de Ricós/Westgard**: úselas solo si la base EFLM no tiene el analito, e indíquelo.

## 5. Aplicación práctica

1. Elija el modelo de Milán y la fuente de especificación por analito, y regístrelo.
2. Fije las metas (CVa, sesgo, ETa, MAU) **antes** de verificar o validar el método.
3. Use las mismas metas en la verificación (EP15), en el CIC (Sigma), en la incertidumbre (MAU) y en la
   interpretación de la EEC: así el sistema es coherente.
4. Si el método no alcanza el nivel mínimo, documente el riesgo, comuníquelo a los clínicos cuando
   afecte la interpretación y planifique la mejora.

## 6. Precauciones

- Los datos de CVI dependen de la población y del diseño del estudio. Verifique que la estimación EFLM
  sea aplicable (sanos frente a enfermos, intervalo entre muestras).
- El RCV asume que CVa y CVI son constantes en el rango de interés.
- El modelo ETa = 1,65·CVa + |B| asume normalidad y un riesgo del 5 % unilateral. Algunos autores usan
  Z = 1,96 o 2: declare el factor.
