# ISO 15189:2022 — mapa de requisitos para el laboratorio clínico

> Numeración orientativa de la edición 2022 para navegar. Confirme cada numeral y su redacción en la
> copia autorizada (ISO/ICONTEC). No se reproduce texto normativo. El detalle de evidencias de
> acreditación y las plantillas están en `modulos/acreditacion/` (perfil `iso-15189`).

## Cambios de la edición 2022 frente a la 2012 que más pesan en la práctica

1. **Enfoque en el paciente y en el riesgo.** La gestión del riesgo es transversal (riesgo para el paciente y
   para el laboratorio). Use ISO 22367 como guía de implementación.
2. **POCT integrado.** Los requisitos de pruebas en el punto de atención están en un anexo de la propia
   norma, y ISO 22870 dejó de ser la referencia. Defina explícitamente el alcance POCT ante el organismo
   de acreditación.
3. **Estructura alineada con ISO/IEC 17025:2017.** Las cláusulas van de la 4 a la 8 y los requisitos del
   sistema de gestión tienen una opción equivalente a ISO 9001.
4. **Menos prescriptiva en documentos.** Pide menos procedimientos obligatorios y más demostración de que los
   procesos se controlan.
5. **Incertidumbre, intervalos de referencia y límites de decisión clínica** con requisitos propios.
6. **Continuidad del servicio y preparación ante emergencias** como requisito explícito.

## Mapa de cláusulas y qué evidencia buscar

| Cláusula (orientativa) | Tema | Evidencia típica | Apoyo en la skill |
|---|---|---|---|
| 4.1–4.3 | Imparcialidad, confidencialidad, requisitos relativos a los pacientes | Análisis de riesgos de imparcialidad, acuerdos de confidencialidad, información a pacientes | `modulos/acreditacion` |
| 5.1–5.5 | Entidad legal, director del laboratorio, actividades, estructura, objetivos | Organigrama, perfiles de cargo, alcance declarado | plantilla de alcance `medical-laboratory-scope-intake-template.json` |
| 5.6 | Gestión del riesgo | Matriz de riesgos del ciclo total de examen (ISO 22367) | — |
| 6.2 | Personal: competencia, formación, autorización, evaluación continua | Matriz de competencias por examen, registros de evaluación | — |
| 6.3 | Instalaciones y condiciones ambientales | Monitoreo de temperatura y humedad, separación de áreas | — |
| 6.4 | Equipos: aceptación, uso, mantenimiento | Hoja de vida, verificación inicial, mantenimiento preventivo | — |
| **6.5** | **Calibración de equipos y trazabilidad metrológica** | Certificados de calibración con U y k, cadena de trazabilidad de calibradores (declaración del fabricante según ISO 17511) | `trazabilidad-eqa.md`, `modulos/acreditacion/scripts/check_supplier_controls.py` |
| 6.6 | Reactivos y consumibles: recepción, verificación de lotes, inventario | Registros de aceptación de lote, comparación entre lotes (EP26) | `control-calidad-interno.md` |
| 6.7–6.8 | Acuerdos de servicio y productos/servicios externos (laboratorios de referencia, proveedores, calibración) | Evaluación de proveedores, contratos, laboratorios de remisión | `check_supplier_controls.py` |
| 7.2 | Procesos preanalíticos: solicitud, toma, transporte, recepción, rechazo | Manual de toma de muestras, criterios de rechazo, indicadores preanalíticos | — |
| **7.3.2** | **Verificación de métodos** (métodos validados usados sin modificar) | Plan y reporte de verificación por examen (precisión, veracidad, intervalo, IR) | `verificacion-validacion-clinica.md`, `scripts/verificacion_ep15.py` |
| **7.3.3** | **Validación de métodos** (no normalizados, desarrollados en casa, modificados o fuera del uso previsto) | Protocolo con criterios previos, estudio completo | `modulos/validacion/` |
| **7.3.4** | **Evaluación de la incertidumbre de medida** | Estimación por mensurando, revisión periódica, comparación con la MAU, disponible a solicitud del usuario | `incertidumbre-iso-20914.md`, `scripts/incertidumbre_20914.py` |
| **7.3.5** | **Intervalos de referencia biológicos y límites de decisión clínica** | Fuente, verificación o transferencia (EP28), revisión periódica | `scripts/intervalos_ep28.py` |
| 7.3.6 | Documentación de los procedimientos de examen | POE controlados | — |
| **7.3.7.2** | **Control interno de la calidad** | Plan de CIC por analito: material, frecuencia, reglas, justificación por riesgo y Sigma | `control-calidad-interno.md`, `scripts/westgard.py`, `scripts/sigma_cic.py` |
| **7.3.7.3** | **Evaluación externa de la calidad (EEC/EQA)** | Inscripción por examen, análisis de resultados, acciones; alternativa cuando no hay programa | `trazabilidad-eqa.md` |
| **7.3.7.4** | **Comparabilidad de resultados** (varios equipos o sitios, métodos) | Comparaciones periódicas con criterios previos | EP31, `compare_methods.py` |
| 7.4 | Postanalítica: revisión, informe, valores críticos, informes corregidos | Política de valores críticos con tiempos, autoverificación validada | — |
| 7.5 | Trabajo no conforme | Registro, evaluación de impacto en pacientes, retirada de informes | — |
| 7.6 | Control de datos y sistemas de información (LIS), incluida la validación de interfaces | Validación del LIS, copias de seguridad, ciberseguridad | — |
| 7.7 | Quejas | Registro y análisis | — |
| 7.8 | Continuidad y preparación ante emergencias | Plan de continuidad probado | — |
| 8.2–8.4 | Documentación, control de documentos y control de registros | Listado maestro, retención | `modulos/acreditacion/scripts/audit_document_records.py` |
| 8.5–8.7 | Riesgos y oportunidades, mejora, no conformidades y acciones correctivas | Registros CAPA con verificación de eficacia | `modulos/acreditacion/scripts/check_capa.py` |
| 8.8–8.9 | Auditorías internas, revisión por la dirección | Programa de auditoría, actas con entradas y salidas definidas | — |
| Anexo A | POCT | Gobernanza POCT, formación de operadores, CIC/EEC POCT | — |

## Indicadores de calidad sugeridos (modelo IFCC WG-LEPS / MQI)

- **Preanalíticos:** muestras rechazadas (hemólisis, coagulación, volumen insuficiente), identificación
  errónea, solicitudes incompletas, tiempos de transporte.
- **Analíticos:** corridas de CIC rechazadas, EEC insatisfactorias (porcentaje de |z| ≥ 3), Sigma por
  analito, tasa de repeticiones.
- **Postanalíticos:** tiempo de respuesta (TAT) por prioridad, valores críticos comunicados a tiempo,
  informes corregidos.

Defina la especificación de cada indicador (p. ej. los niveles de desempeño del modelo IFCC) y revíselos
en la revisión por la dirección.

## Errores frecuentes en auditoría

1. Decir "certificado en ISO 15189": el término correcto es **acreditado** (ver `modulos/acreditacion/references/assurance-lanes.md`).
2. Verificar solo la precisión y omitir la veracidad, el intervalo de medida o los intervalos de referencia.
3. Calcular la incertidumbre una vez y no revisarla, o calcularla sin compararla con una especificación (MAU).
4. Usar como objetivos del CIC la media y la DE del inserto en lugar de las propias.
5. Aplicar 1-2s como regla de rechazo, lo que dispara repeticiones innecesarias y oculta la causa.
6. No evaluar el impacto en los pacientes desde el último control aceptable tras un rechazo.
7. Recibir la EEC sin analizar la tendencia de los resultados ni actuar sobre los "aceptables" con sesgo persistente.
8. Comparar varios equipos sin criterio de aceptación definido de antemano.
9. Un alcance de acreditación que no detalla examen, matriz, método y equipo.
