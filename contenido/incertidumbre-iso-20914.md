# Incertidumbre de medida en el laboratorio clínico (ISO/TS 20914:2019)

> Guía de razonamiento; no reproduce la especificación técnica. Confirme detalles (periodo mínimo de
> datos, tratamiento del sesgo, mensurandos especiales) en la copia autorizada.
> Calculadora: `scripts/incertidumbre_20914.py`. Para el enfoque GUM completo (*bottom-up*), Monte Carlo y
> el formateo del resultado, use `modulos/incertidumbre/`.

## 1. Idea central

El laboratorio clínico estima la incertidumbre con un enfoque **top-down**: usa datos de desempeño ya
disponibles (CIC a largo plazo y la información de trazabilidad del calibrador) en lugar de modelar
cada magnitud de entrada.

```
u_c(y) = √( u(Rw)² + u(cal)² )          U = k · u_c   (k = 2 → ~95 %)
```

- **u(Rw)**: DE o CV de **imprecisión intermedia a largo plazo** del CIC. Debe capturar las fuentes
  reales de variación: cambios de lote de reactivo y calibrador, recalibraciones, mantenimiento,
  operadores y condiciones ambientales. En la práctica se toman **≥ 6 meses** de datos o el periodo que
  la especificación técnica y la política del laboratorio justifiquen. Con pocos meses la u(Rw) queda
  subestimada.
- **u(cal)**: incertidumbre estándar del valor asignado al calibrador del usuario final. La declara el
  fabricante, que es responsable de la trazabilidad según ISO 17511. Si el certificado da U con k,
  **divida por k**. Si el fabricante no la declara, solicítela formalmente y registre la gestión.
- **Sesgo**: según ISO/TS 20914, el sesgo significativo con relevancia médica debe **corregirse o
  eliminarse**, normalmente por el fabricante. Por defecto no se suma a la incertidumbre. Si se decide
  incluirlo, use explícitamente el enfoque Nordtest (`--rms-sesgo`, `--u-cref`) y documente la
  justificación.

## 2. Qué **no** incluye

- **Variación preanalítica** (toma, transporte, conservación): se gestiona por control del proceso; no entra en u_c.
- **Variación biológica**: es otra fuente de variación; se usa en el RCV, no en la incertidumbre.
- **Errores groseros** (muestra equivocada, interferencias no detectadas).

## 3. Procedimiento recomendado por mensurando

1. **Defina el mensurando**: magnitud, matriz, unidades y procedimiento. "Glucosa" no basta; escriba,
   por ejemplo, "concentración de glucosa en plasma venoso (mmol/L), método hexoquinasa, equipo X".
2. **Reúna los datos de CIC** por nivel, cercanos a los **límites de decisión clínica**. Excluya solo los
   resultados de corridas rechazadas con causa asignada, y documente la exclusión.
3. **Calcule u(Rw)** como CV por nivel. Si los CV varían con la concentración, reporte la incertidumbre
   por nivel o modele CV(c). No promedie niveles con concentraciones muy distintas.
4. **Obtenga u(cal)** del fabricante.
5. **Combine** y **expanda** (k = 2).
6. **Compare con la especificación**, la incertidumbre máxima admisible (MAU):
   - MAU estándar derivada de la variación biológica (EFLM): **óptima 0,25·CVI; deseable 0,50·CVI; mínima 0,75·CVI**.
   - En el modelo de Milán por resultado clínico o por estado del arte, use la MAU correspondiente.
   - Si u_c > MAU: actúe (método, calibración, frecuencia de CIC) o documente la decisión por riesgo.
7. **Revise** periódicamente (al menos anual) y tras cambios relevantes (nuevo método, nuevo calibrador,
   cambio de equipo).
8. **Comunique**: disponible para el médico y el usuario a solicitud, con k y probabilidad de cobertura.

## 4. Ejemplo numérico (glucosa, nivel cercano a 7 mmol/L)

| Componente | Origen | Valor |
|---|---|---|
| u(Rw) | CV del CIC durante 8 meses, n = 230 | 1,9 % |
| u(cal) | Certificado del fabricante U = 1,6 %, k = 2 | 0,8 % |
| u_c | √(1,9² + 0,8²) | **2,06 %** |
| U (k = 2) | 2 × 2,06 | **4,1 %** → ±0,29 mmol/L a 7,0 mmol/L |
| MAU deseable | 0,50 × CVI (5,0 %) | 2,5 % → **cumple** |

```bash
py -3 scripts/incertidumbre_20914.py --cv-rw "7 mmol/L=1.9" --U-cal 1.6 --k-cal 2 --cvi 5.0 --analito Glucosa
```

## 5. Casos especiales

- **Cálculos derivados** (eGFR, LDL calculado, índices): propague la incertidumbre de las entradas con
  `modulos/incertidumbre/scripts/propagate_uncertainty.py`. Use Monte Carlo si la función es no lineal.
- **Resultados cerca del LoQ**: el CV aumenta. Use un nivel bajo de CIC o estime el perfil de precisión.
- **Pruebas cualitativas**: la incertidumbre del resultado binario no se expresa con U. Caracterice la
  incertidumbre del valor de corte (C5–C95, CLSI EP12) y el desempeño diagnóstico.
- **Hematología por conteo** (células raras, recuentos bajos): considere el componente de Poisson
  (CV ≈ 1/√N de eventos contados) además de la u(Rw).
- **Microbiología** (CMI): la incertidumbre se expresa en diluciones (±1 dilución) según la
  reproducibilidad. No aplique el modelo cuantitativo continuo.
- **Varios equipos para el mismo examen**: estime la incertidumbre por equipo y verifique su
  comparabilidad (EP31). Si los resultados se reportan indistintamente, considere un componente entre
  equipos.

## 6. Incertidumbre y reglas de decisión

Cuando un resultado se compara con un límite (de decisión clínica o legal, p. ej. alcoholemia o
dopaje), la incertidumbre afecta la decisión. Use JCGM 106: defina una **regla de decisión**
(aceptación simple, banda de guarda) y documéntela antes de aplicarla. Ver
`modulos/incertidumbre/references/reporting-rules.md`.

## 7. Errores frecuentes

1. Usar el CV de repetibilidad (una corrida) en lugar de la imprecisión intermedia a largo plazo.
2. Tomar la U del certificado del calibrador como si fuera estándar, sin dividir por k.
3. Sumar el sesgo "por si acaso" sin declarar el modelo.
4. Usar datos de CIC de un solo lote de reactivo.
5. Reportar U sin indicar k ni la probabilidad de cobertura.
6. Calcular la incertidumbre sin compararla nunca con una especificación.
7. Confundir la incertidumbre con el error total. Son modelos distintos (ver `especificaciones-desempeno.md`).
