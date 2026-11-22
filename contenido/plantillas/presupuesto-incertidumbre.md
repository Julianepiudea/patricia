# Estimación de la incertidumbre de medida — [ANALITO]

> BORRADOR para revisión y aprobación por el responsable autorizado. Código: [ ] Versión: [ ] Fecha: [ ]

## 1. Mensurando
- Magnitud y unidades: [p. ej. concentración de sustancia de glucosa en plasma venoso, mmol/L]
- Procedimiento de medida / principio: [ ]
- Equipo(s) y número de serie: [ ]
- Calibrador (fabricante, lote) y declaración de trazabilidad: [referencia de orden superior, ISO 17511]
- Límites de decisión clínica relevantes: [ ]

## 2. Especificación (fijada antes del cálculo)
- Modelo de Milán: [resultado clínico / variación biológica / estado del arte]. Justificación: [ ]
- MAU estándar: [ ] % (fuente: [EFLM, CVI = ] )

## 3. Datos
| Fuente | Periodo | n | Lotes de reactivo | Lotes de calibrador | Exclusiones (causa) |
|---|---|---|---|---|---|
| CIC nivel 1 | [ ] | [ ] | [ ] | [ ] | [ ] |
| CIC nivel 2 | [ ] | [ ] | [ ] | [ ] | [ ] |

## 4. Presupuesto (ISO/TS 20914, enfoque top-down)
| Componente | Tipo | Valor | Divisor | u relativa (%) | Aporte a la varianza (%) |
|---|---|---|---|---|---|
| u(Rw), nivel [ ] | A (CIC) | CV = [ ] % | 1 | [ ] | [ ] |
| u(cal) | B (certificado del fabricante) | U = [ ] %, k = [ ] | k | [ ] | [ ] |
| [u(sesgo), solo si se justifica el modelo Nordtest] | | | | | |
| **u_c** | | | | **[ ]** | 100 |
| **U (k = 2, ~95 %)** | | | | **[ ]** | |

Comando de cálculo: `py -3 scripts/incertidumbre_20914.py --cic [archivo] --U-cal [ ] --k-cal [ ] --cvi [ ]`

## 5. Evaluación
- ¿u_c ≤ MAU? [sí/no por nivel]. Si no: acción o análisis de riesgo [ ].
- Componente dominante y oportunidad de mejora: [ ]

## 6. Expresión y comunicación
- Ejemplo: "Glucosa 7,0 mmol/L; incertidumbre expandida U = 0,29 mmol/L (k = 2, ~95 %)".
- Disponible a solicitud de: [clínicos, usuarios]. Medio: [ ]

## 7. Revisión
- Frecuencia: [anual / tras cambios]. Próxima revisión: [ ]

| Elaboró | Revisó | Aprobó |
|---|---|---|
| [ ] | [ ] | [ ] |
