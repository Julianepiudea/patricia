# Mapa normativo del laboratorio clínico (metrología y calidad)

> Base de investigación: noviembre de 2026. Las ediciones cambian: **confirme siempre la edición vigente**
> en el catálogo del editor (iso.org, clsi.org, bipm.org) antes de citarla en un documento controlado.
> Las normas ISO y CLSI tienen derechos de autor: resuma el proceso propio y cite la copia autorizada;
> no reproduzca texto de cláusulas.

## 1. Normas de requisitos (auditables)

| Documento | Objeto | Notas de uso |
|---|---|---|
| **ISO 15189:2022** | Requisitos de calidad y competencia de laboratorios clínicos | Edición 4. Integró los requisitos POCT (antes ISO 22870) en un anexo. La transición desde la edición 2012 cerró en dic-2025. Ver `sistema-gestion-iso-15189.md`. |
| ISO/IEC 17025:2017 | Competencia de laboratorios de ensayo y calibración | Para laboratorios de calibración que dan servicio al laboratorio clínico, o laboratorios no médicos. |
| ISO 9001:2015 | Sistema de gestión de la calidad (certificación) | Se **certifica** una organización. Un laboratorio se **acredita** (ISO 15189). No son equivalentes. |
| ISO 13485:2016 | SGC de fabricantes de dispositivos (incluye IVD) | Relevante para pruebas desarrolladas en casa con lógica de fabricante y para evaluar proveedores. |
| ISO 35001:2019 | Gestión del biorriesgo | Complementa la bioseguridad del laboratorio. |
| ISO 15190:2020 | Requisitos de seguridad del laboratorio clínico | |

## 2. Metrología fundamental (gratuitas, JCGM/BIPM)

| Documento | Uso |
|---|---|
| **JCGM 200 (VIM)** | Vocabulario: mensurando, veracidad, exactitud, precisión, incertidumbre, trazabilidad, conmutabilidad. Use la terminología del VIM en todo documento controlado. |
| **JCGM 100:2008 (GUM)** | Evaluación de la incertidumbre (enfoque *bottom-up*). Módulo `modulos/incertidumbre/`. |
| JCGM 101:2008 | Propagación por Monte Carlo. |
| JCGM 106:2012 | Evaluación de la conformidad y reglas de decisión con incertidumbre. |
| Nordtest TR 537 | Incertidumbre a partir de datos de CIC y EEC (alternativa *top-down* con sesgo). |
| EURACHEM/CITAC QUAM, guía *Fitness for Purpose* | Incertidumbre y validación en química analítica. |

## 3. Metrología aplicada al laboratorio clínico (ISO/TC 212)

| Documento | Objeto |
|---|---|
| **ISO/TS 20914:2019** | Guía práctica para estimar la incertidumbre de medida en laboratorios clínicos (*top-down*). Ver `incertidumbre-iso-20914.md`. |
| **ISO 17511:2020** | Trazabilidad metrológica de valores asignados a calibradores, materiales de control de veracidad y muestras humanas. Ver `trazabilidad-eqa.md`. |
| ISO 15193 | Requisitos de procedimientos de medida de referencia. |
| ISO 15194 | Requisitos de materiales de referencia certificados y su documentación. |
| ISO 15195 | Requisitos de laboratorios de calibración que usan procedimientos de referencia. |
| ISO 21151 | Protocolos internacionales de armonización cuando no hay trazabilidad al SI. |
| ISO 22367:2020 | Gestión del riesgo en el laboratorio clínico (aplicación al ciclo total de examen). |
| ISO 20658 | Recolección y transporte de muestras (preanalítica). |
| Serie ISO 20166/20184/20186/20387… | Procesos preanalíticos para análisis moleculares y biobancos. |
| ISO/TS 22583:2019 | Guía para supervisores y operadores de POCT. |
| ISO 18113 (serie) | Información del fabricante en el etiquetado de IVD (lo que debe declarar el inserto). |
| ISO 23640 | Evaluación de la estabilidad de reactivos IVD. |
| ISO/IEC 17043:2023 | Requisitos para proveedores de ensayos de aptitud / EEC. |
| ISO 13528:2022 | Métodos estadísticos para ensayos de aptitud (puntaje z, z', En). |
| ISO 17034:2016 | Competencia de productores de materiales de referencia. |
| ISO 5725 (serie) | Exactitud (veracidad y precisión) de métodos y resultados. |

## 4. CLSI (serie EP y otras) — verificación, validación y control

Confirme la edición vigente en clsi.org; las indicadas son orientativas.

| Documento | Tema | Herramienta en esta skill |
|---|---|---|
| EP05 | Evaluación de precisión (establecimiento, fabricante; diseño 20×2×2) | `modulos/validacion/scripts/check_accuracy_precision.py` |
| **EP15** | Verificación de precisión y estimación de sesgo por el usuario (5×5) | `scripts/verificacion_ep15.py` |
| EP06 | Linealidad / intervalo de medida | `modulos/validacion/scripts/check_response.py` (con advertencia, ver `verificacion-validacion-clinica.md`) |
| EP07 / EP37 | Interferencias / tablas de interferentes | — |
| **EP09** | Comparación de métodos y estimación de sesgo con muestras de pacientes | `modulos/validacion/scripts/compare_methods.py` |
| EP10 | Evaluación preliminar de procedimientos cuantitativos | — |
| EP12 | Evaluación de pruebas cualitativas y semicuantitativas | ver referencia (sensibilidad/especificidad, concordancia, C5–C95) |
| **EP17** | LoB, LoD, LoQ | `scripts/lob_lod_ep17.py` |
| EP19 | Marco para usar documentos CLSI en evaluación de métodos | — |
| EP21 | Error analítico total | `scripts/especificaciones_vb.py`, `scripts/sigma_cic.py` |
| EP23 | Plan de control de calidad basado en gestión de riesgos | `control-calidad-interno.md` |
| EP25 | Estabilidad de reactivos IVD | — |
| EP26 | Evaluación de cambio de lote de reactivo | `control-calidad-interno.md` |
| **EP28** | Intervalos de referencia (establecer, transferir, verificar) | `scripts/intervalos_ep28.py` |
| EP29 | Expresión de la incertidumbre de medida en el laboratorio | `incertidumbre-iso-20914.md` |
| EP31 | Comparabilidad de resultados dentro de un sistema de salud (varios equipos) | `trazabilidad-eqa.md` |
| EP32 | Trazabilidad metrológica y su implementación | `trazabilidad-eqa.md` |
| EP33 | Uso de delta checks | — |
| EP34 | Extensión del intervalo de medida por dilución | — |
| EP35 | Equivalencia de tipos de muestra | — |
| **C24** | Control estadístico de la calidad para procedimientos cuantitativos | `scripts/westgard.py`, `scripts/sigma_cic.py` |
| C62 | Métodos de espectrometría de masas por cromatografía líquida | — |
| GP41 / GP44 | Venopunción / manejo y procesamiento de muestras de sangre | preanalítica |
| QMS01 y serie QMS | Modelo de sistema de gestión de la calidad del laboratorio | — |
| QMS24 | Uso de ensayos de aptitud y evaluación alternativa | `trazabilidad-eqa.md` |
| H-series | Hematología y hemostasia (p. ej. H26 analizadores hematológicos, H21 muestras de coagulación) | — |
| M100 / M52 | Puntos de corte de sensibilidad antimicrobiana / verificación de sistemas comerciales de identificación y antibiograma | — |

## 5. Especificaciones de calidad y variación biológica

| Fuente | Uso |
|---|---|
| Consenso de Milán (EFLM, 2014) | Tres modelos para fijar especificaciones: resultado clínico, variación biológica, estado del arte. |
| **Base de datos EFLM de variación biológica** (biologicalvariation.eu) | CVI, CVG con evaluación BIVAC. Prefiérala a tablas antiguas (Ricós/Westgard). |
| EFLM Task Finish Group (Ceriotti et al., 2017) | Asignación de cada analito al modelo de Milán más adecuado. |
| CLIA (EE. UU., criterios de aceptación de PT actualizados) | Límites regulatorios de EEC; útiles como ETa de referencia, no como meta de calidad clínica. |
| RiliBÄK (Alemania) | Límites de desviación de EEC. |
| Westgard QC (westgard.com) | Reglas multirregla, Sigma, OPSpecs, gráficas de decisión del método. |

## 6. Organismos y recursos

- **JCTLM** (bipm.org/jctlm): base de datos de materiales de referencia de orden superior, procedimientos de referencia y servicios de laboratorios de referencia. Consúltela para la trazabilidad.
- **IFCC**: grupos de trabajo sobre conmutabilidad, armonización, incertidumbre y PBRTQC.
- **Global ACI** (Global Accreditation Cooperation Inc.): sustituyó a ILAC e IAF desde 2026-01-01. La política de incertidumbre en calibración, antes ILAC P14, se publica ahora como documento Global ACI. La política de trazabilidad, antes ILAC P10, también migró: verifique su código actual.
- Organismos nacionales: ver `contexto-colombia.md`.

## Regla de uso

Si una pregunta depende del texto literal de una norma (un número de réplicas, un criterio de aceptación,
una nota de cláusula), dígalo explícitamente y pida al usuario el dato de su copia autorizada. Nunca
invente umbrales atribuidos a una norma de pago.
