// Guías interactivas (árboles de decisión). Cada nodo es una pregunta con opciones o un resultado.
// En los resultados: md (Markdown), calcs (ids de calculadoras) y leer (consulta sugerida al buscador).

export const GUIAS = {
  verificarValidar: {
    titulo: "¿Verificar o validar?", icono: "git-branch", descripcion: "Decida qué estudio exige ISO 15189 para un método nuevo o modificado.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿El método es comercial, con registro sanitario INVIMA (o marcado CE/FDA), y lo usará exactamente según el inserto?", opciones: [
        { texto: "Sí, sin ninguna modificación", ir: "q2" }, { texto: "Es comercial pero lo modifiqué o lo uso distinto", ir: "q3" }, { texto: "Lo desarrollamos en el laboratorio (LDT) o no es normalizado", ir: "rVal" }] },
      q2: { pregunta: "¿Es un método cuantitativo o cualitativo?", opciones: [{ texto: "Cuantitativo", ir: "rVerCuant" }, { texto: "Cualitativo / semicuantitativo", ir: "rVerCual" }] },
      q3: { pregunta: "¿Qué cambió respecto al uso previsto?", opciones: [
        { texto: "Otro tipo de muestra o matriz (p. ej. orina en vez de suero)", ir: "rValParcial" }, { texto: "Amplié el intervalo de medida o cambié la dilución", ir: "rValParcial" },
        { texto: "Lo uso en otro equipo no previsto por el fabricante", ir: "rValParcial" }, { texto: "Solo cambié de equipo del mismo modelo o de sede", ir: "rComparab" }] },
      rVerCuant: { resultado: true, tipo: "ok", titulo: "Corresponde una VERIFICACIÓN (método cuantitativo)", md:
        "Debe demostrar que reproduce las declaraciones del fabricante en su laboratorio. Plan mínimo:\n\n| Característica | Documento | Diseño orientativo |\n|---|---|---|\n| Precisión | CLSI EP15 | 5 días × 5 réplicas, ≥ 2 niveles |\n| Veracidad / sesgo | EP15 o EP09 | material con valor asignado, o ≥ 40 pacientes |\n| Intervalo de medida | EP06 | 5–7 niveles |\n| Intervalo de referencia | EP28 | 20 sanos locales |\n| Según el analito | EP17, EP07 | LoD/LoQ, interferencias |\n\n**Antes de empezar**, fije y apruebe las especificaciones (CVa, sesgo y ETa admisibles) y su fuente.",
        calcs: ["ep15", "comparacion", "ep28", "ep17", "vb"], leer: "plan mínimo de verificación de un método cuantitativo" },
      rVerCual: { resultado: true, tipo: "ok", titulo: "Corresponde una VERIFICACIÓN (método cualitativo)", md:
        "Según CLSI EP12, verifique:\n\n- **Concordancia** con un método comparativo o un estándar de referencia: sensibilidad y especificidad (o PPA/NPA), con IC 95 %.\n- Un **panel** que incluya positivos débiles cerca del valor de corte, no solo positivos francos.\n- La **imprecisión cerca del valor de corte** (C5–C95), si el fabricante la declara.\n\nDefina antes el número de muestras y los criterios de aceptación.",
        leer: "métodos cualitativos EP12" },
      rVal: { resultado: true, tipo: "alerta", titulo: "Corresponde una VALIDACIÓN completa", md:
        "Para un método desarrollado en casa o no normalizado debe establecer todas las características pertinentes: precisión (EP05), veracidad, intervalo de medida (EP06), LoB/LoD/LoQ (EP17), selectividad e interferencias (EP07), arrastre, estabilidad de la muestra, intervalos de referencia (EP28) y, si aplica, desempeño diagnóstico.\n\n- Use un **protocolo** con criterios de aceptación aprobados antes de recolectar datos.\n- Si el método es de biología molecular o de espectrometría de masas, considere guías específicas (p. ej. CLSI C62, ICH M10 como referencia).",
        calcs: ["ep15", "ep17", "comparacion", "ep28"], leer: "verificar o validar" },
      rValParcial: { resultado: true, tipo: "alerta", titulo: "Corresponde VALIDAR los aspectos modificados", md:
        "La modificación sale del uso validado por el fabricante. Valide **lo que el cambio puede afectar**: por ejemplo, una nueva matriz exige veracidad (comparación con muestras pareadas), precisión, interferencias propias de la matriz y estabilidad; una ampliación del intervalo exige linealidad y verificación de la dilución (EP34).\n\nDocumente la justificación del alcance de la validación.",
        calcs: ["comparacion", "ep15"], leer: "validación método modificado" },
      rComparab: { resultado: true, tipo: "info", titulo: "Verificación más COMPARABILIDAD", md:
        "Verifique el desempeño en el nuevo equipo (precisión y veracidad) y demuestre que los resultados son **comparables** con el equipo de referencia usando muestras de pacientes en los límites de decisión clínica (EP09 o EP31), con un criterio basado en el sesgo admisible definido de antemano.",
        calcs: ["comparacion", "ep15"], leer: "comparabilidad interna varios equipos" },
    },
  },

  rechazoCIC: {
    titulo: "Rechazo de control interno", icono: "siren", descripcion: "Qué hacer, paso a paso, cuando una corrida viola una regla de Westgard.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Qué regla se violó?", opciones: [
        { texto: "Solo 1-2s (un control entre 2 y 3 DE)", ir: "r12s" }, { texto: "1-3s o R-4s", ir: "rAleat" }, { texto: "2-2s, 4-1s, 10x u 8x", ir: "rSist" }] },
      r12s: { resultado: true, tipo: "info", titulo: "1-2s es una ALERTA, no un rechazo", md:
        "Inspeccione los datos con las demás reglas de su plan (1-3s, 2-2s, R-4s, 4-1s, 10x). Si ninguna se viola, **la corrida se acepta** y se liberan los resultados.\n\nRepetir el control por cada 1-2s genera trabajo innecesario y puede esconder problemas. Si las alertas son frecuentes, revise que la DE objetivo sea la intermedia propia (no una DE de una sola corrida).",
        calcs: ["westgard"] },
      rAleat: { resultado: true, tipo: "mal", titulo: "Rechazo por error ALEATORIO", md:
        "1. **No libere** resultados de la corrida.\n2. Busque causas aleatorias: burbujas o coágulos, pipeteo, problema de la muestra de control (mal reconstituida o evaporada), lámpara, temperatura, electrodos, error de transcripción.\n3. Corrija la causa y **repita los controles** (no repita sin haber investigado).\n4. Si los controles se aceptan, **evalúe los pacientes** desde el último control aceptable: repita una selección de muestras según el riesgo.\n5. **Registre** la regla violada, la causa, la acción y la decisión sobre los pacientes. Si hubo resultados ya informados afectados, gestione un trabajo no conforme.",
        calcs: ["westgard"] },
      rSist: { resultado: true, tipo: "mal", titulo: "Rechazo por error SISTEMÁTICO", md:
        "1. **No libere** resultados.\n2. Busque causas sistemáticas: calibración vencida o defectuosa, **cambio de lote** de reactivo o calibrador, deterioro del reactivo, cambio de lote del control, mantenimiento, desplazamiento del instrumento.\n3. Corrija (recalibre, cambie el reactivo) y repita los controles.\n4. Evalúe los pacientes desde el inicio de la tendencia, no solo desde la última corrida: con 4-1s o 10x el problema empezó varias corridas atrás.\n5. Registre y, si el desplazamiento es recurrente, abra una acción correctiva (CAPA).\n\nCalcule el **Sigma** del analito: si es bajo, las reglas y la frecuencia de su plan pueden ser insuficientes.",
        calcs: ["westgard", "sigma"] },
    },
  },

  eecInsatisfactorio: {
    titulo: "Resultado insatisfactorio de EEC", icono: "flag", descripcion: "Investigación de un resultado de evaluación externa fuera de criterio.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "Revise primero errores administrativos: ¿el resultado se transcribió, convirtió de unidades y asignó a la muestra correcta?", opciones: [
        { texto: "Encontré un error administrativo o de transcripción", ir: "rAdmin" }, { texto: "No, el dato reportado es el que dio el equipo", ir: "q2" }] },
      q2: { pregunta: "¿Cómo fue el CIC del día en que se analizó la muestra de EEC?", opciones: [
        { texto: "Hubo alertas o tendencia ese día", ir: "rCIC" }, { texto: "El CIC estaba estable", ir: "q3" }] },
      q3: { pregunta: "¿Cómo se ven los resultados de EEC anteriores para este analito?", opciones: [
        { texto: "Las desviaciones de varios ciclos van del mismo lado", ir: "rSesgo" }, { texto: "Es un hecho aislado", ir: "rAislado" }] },
      rAdmin: { resultado: true, tipo: "alerta", titulo: "Error postanalítico o administrativo", md:
        "Aunque el analizador midió bien, es una **no conformidad**: el proceso de reporte falló y el mismo error puede ocurrir con pacientes. Analice la causa (formulario, unidades, doble digitación), corrija el proceso y verifique la eficacia. Revise si hay informes de pacientes con el mismo tipo de error." },
      rCIC: { resultado: true, tipo: "mal", titulo: "El sistema ya estaba fuera de control", md:
        "El CIC no detectó o no se actuó sobre la señal. Investigue por qué se liberó la corrida, **evalúe los pacientes de ese periodo** y revise si las reglas y la frecuencia de control son adecuadas para el Sigma del analito.",
        calcs: ["westgard", "sigma"] },
      rSesgo: { resultado: true, tipo: "mal", titulo: "Probable sesgo sistemático persistente", md:
        "Cuantifique el sesgo promedio de varios ciclos y compárelo con el sesgo admisible. Revise la calibración, el lote de calibrador y la conmutabilidad del material de EEC (¿el grupo par muestra el mismo sesgo?). Si el sesgo es real: recalibre, contacte al fabricante y evalúe el impacto en los pacientes, sobre todo cerca de los límites de decisión clínica.",
        calcs: ["eec", "vb", "sigma"] },
      rAislado: { resultado: true, tipo: "alerta", titulo: "Error aislado: investigue la muestra y el analito", md:
        "Considere la manipulación de la muestra de EEC (reconstitución, estabilidad, temperatura), las interferencias de la matriz y la posibilidad de un error aleatorio grande. Si conserva material, reanalícelo. Documente la investigación, la causa más probable, la acción y la verificación en el siguiente ciclo.",
        calcs: ["eec"] },
    },
  },

  queEP: {
    titulo: "¿Qué documento CLSI aplica?", icono: "book-open", descripcion: "Encuentre el documento CLSI según lo que quiere evaluar.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Qué quiere evaluar?", opciones: [
        { texto: "Precisión", ir: "q2" }, { texto: "Sesgo / comparación con otro método", ir: "rEP09" }, { texto: "Linealidad / intervalo de medida", ir: "rEP06" },
        { texto: "Límites bajos (LoB, LoD, LoQ)", ir: "rEP17" }, { texto: "Interferencias", ir: "rEP07" }, { texto: "Intervalos de referencia", ir: "rEP28" },
        { texto: "Prueba cualitativa", ir: "rEP12" }, { texto: "Cambio de lote de reactivo", ir: "rEP26" }, { texto: "Control de calidad", ir: "rC24" }] },
      q2: { pregunta: "¿Usted establece la precisión (fabricante o LDT) o verifica la declarada?", opciones: [{ texto: "Verifico lo declarado", ir: "rEP15" }, { texto: "Establezco (estudio completo)", ir: "rEP05" }] },
      rEP15: { resultado: true, tipo: "ok", titulo: "CLSI EP15 — verificación de precisión y estimación de sesgo", md: "Diseño típico de 5 días × 5 réplicas por nivel; compara la DE observada con la declarada mediante el límite superior de verificación. Permite además estimar el sesgo con un material de valor asignado.", calcs: ["ep15"] },
      rEP05: { resultado: true, tipo: "info", titulo: "CLSI EP05 — evaluación de precisión", md: "Estudio de establecimiento (p. ej. 20 días × 2 corridas × 2 réplicas) para estimar la repetibilidad y la precisión intralaboratorio con más grados de libertad. Lo usan fabricantes y laboratorios con LDT." },
      rEP09: { resultado: true, tipo: "ok", titulo: "CLSI EP09 — comparación de métodos con muestras de pacientes", md: "En general ≥ 40 muestras distribuidas en el intervalo de medida; gráficos de diferencias, regresión de Deming o Passing-Bablok y sesgo en los límites de decisión clínica.", calcs: ["comparacion"] },
      rEP06: { resultado: true, tipo: "ok", titulo: "CLSI EP06 — evaluación de la linealidad", md: "Mezclas en 5–7 niveles con réplicas; la desviación respecto a la linealidad se compara con una no linealidad admisible definida por el laboratorio. Un r² alto no demuestra linealidad." },
      rEP17: { resultado: true, tipo: "ok", titulo: "CLSI EP17 — límites de detección y cuantificación", md: "LoB con blancos y LoD con muestras de baja concentración, en varios días y lotes; LoQ según una meta de exactitud.", calcs: ["ep17"] },
      rEP07: { resultado: true, tipo: "ok", titulo: "CLSI EP07 (y EP37) — interferencias", md: "Pruebas de adición (paired difference) y estudios con muestras naturales para hemólisis, ictericia, lipemia y fármacos; EP37 lista concentraciones de prueba recomendadas." },
      rEP28: { resultado: true, tipo: "ok", titulo: "CLSI EP28 — intervalos de referencia", md: "Transferencia con 20 sanos locales (≤ 10 % fuera) o establecimiento no paramétrico con ≥ 120 individuos por partición.", calcs: ["ep28"] },
      rEP12: { resultado: true, tipo: "ok", titulo: "CLSI EP12 — pruebas cualitativas y semicuantitativas", md: "Concordancia con el método comparativo, desempeño diagnóstico con IC 95 % e imprecisión cerca del valor de corte (C5–C95)." },
      rEP26: { resultado: true, tipo: "ok", titulo: "CLSI EP26 — evaluación de lotes de reactivo", md: "Comparación del lote nuevo con el vigente usando muestras de pacientes, con una diferencia crítica y un número de muestras definidos de antemano.", calcs: ["comparacion"] },
      rC24: { resultado: true, tipo: "ok", titulo: "CLSI C24 (y EP23) — control de calidad", md: "C24: control estadístico de la calidad (reglas, número de controles, frecuencia, riesgo del paciente). EP23: plan de control basado en la gestión de riesgos.", calcs: ["sigma", "westgard"] },
    },
  },

  especificacion: {
    titulo: "Elegir la especificación de calidad", icono: "target", descripcion: "Seleccione el modelo de Milán y la fuente del ETa o la MAU.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿El analito tiene un papel central en una decisión clínica con límites bien definidos y estudiados (p. ej. HbA1c, colesterol LDL, troponina, glucosa diagnóstica)?", opciones: [{ texto: "Sí", ir: "rM1" }, { texto: "No / no estoy seguro", ir: "q2" }] },
      q2: { pregunta: "¿Está en estado estacionario homeostático y existen datos de variación biológica de calidad (base EFLM)?", opciones: [{ texto: "Sí", ir: "rM2" }, { texto: "No", ir: "rM3" }] },
      rM1: { resultado: true, tipo: "ok", titulo: "Modelo 1: resultado clínico", md: "Use especificaciones derivadas del impacto clínico: guías de la sociedad científica, estudios de simulación o requisitos de programas (p. ej. NGSP/IFCC para HbA1c). Complemente con la variación biológica para el RCV.", calcs: ["vb"] },
      rM2: { resultado: true, tipo: "ok", titulo: "Modelo 2: variación biológica", md: "Calcule las metas con CVI y CVG de la base EFLM: CVa ≤ 0,5·CVI (deseable), sesgo ≤ 0,25·√(CVI²+CVG²), ETa = 1,65·CVa + sesgo, MAU = 0,5·CVI. Si el método no alcanza el nivel deseable, use el mínimo y documente el riesgo.", calcs: ["vb", "sigma", "mu"] },
      rM3: { resultado: true, tipo: "info", titulo: "Modelo 3: estado del arte", md: "Use el mejor desempeño alcanzable: la dispersión de los programas de EEC (p. ej. el percentil 20–50 de los participantes), los límites de programas o regulatorios (CLIA, RiliBÄK) o el desempeño de métodos de referencia. Declare la fuente y revísela periódicamente.", calcs: ["sigma"] },
    },
  },

  cambioLote: {
    titulo: "Cambio de lote de reactivo", icono: "repeat", descripcion: "Evalúe un nuevo lote antes de usarlo con pacientes.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Tiene muestras de pacientes disponibles con el lote vigente y el nuevo en paralelo?", opciones: [{ texto: "Sí", ir: "q2" }, { texto: "Solo tengo controles", ir: "rSoloCtrl" }] },
      q2: { pregunta: "¿Definió de antemano la diferencia crítica (basada en el sesgo admisible) y el número de muestras?", opciones: [{ texto: "Sí", ir: "rOK" }, { texto: "Todavía no", ir: "rDefinir" }] },
      rSoloCtrl: { resultado: true, tipo: "alerta", titulo: "Los controles no bastan", md: "Los materiales de control a menudo **no son conmutables**: pueden mostrar un desplazamiento inexistente con pacientes o esconder uno real. Consiga muestras de pacientes (residuales, de distintas concentraciones, idealmente cerca de los límites de decisión) y analícelas con ambos lotes." },
      rDefinir: { resultado: true, tipo: "info", titulo: "Defina el criterio antes de analizar", md: "1. Diferencia crítica: p. ej. el sesgo admisible deseable de la variación biológica o una fracción del ETa.\n2. Número de muestras: según la imprecisión del método y la diferencia a detectar (CLSI EP26 ofrece tablas).\n3. Concentraciones: incluya los límites de decisión clínica.\n4. Regla de decisión: qué hará si la diferencia supera el criterio.", calcs: ["vb"] },
      rOK: { resultado: true, tipo: "ok", titulo: "Analice y decida", md: "Analice las muestras con ambos lotes en la misma corrida, calcule la diferencia (media y por concentración) y compárela con la diferencia crítica. Registre el resultado en un **historial acumulado de lotes**: pequeños desplazamientos sucesivos aceptados se acumulan (deriva). Actualice la media del CIC si el nuevo lote la desplaza.", calcs: ["comparacion"] },
    },
  },

  incertidumbreGuia: {
    titulo: "Estimar la incertidumbre", icono: "sigma", descripcion: "Ruta para estimar la incertidumbre de un examen según su tipo.",
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Qué tipo de examen es?", opciones: [
        { texto: "Cuantitativo medido directamente (química, inmunoensayo, hematología)", ir: "q2" }, { texto: "Calculado (eGFR, LDL calculado, índices)", ir: "rCalc" },
        { texto: "Cualitativo (positivo/negativo)", ir: "rCual" }, { texto: "Microbiología (CMI)", ir: "rMicro" }] },
      q2: { pregunta: "¿Tiene al menos 6 meses de datos de CIC que incluyan cambios de lote y recalibraciones?", opciones: [{ texto: "Sí", ir: "rTopDown" }, { texto: "No, tengo menos", ir: "rPocos" }] },
      rTopDown: { resultado: true, tipo: "ok", titulo: "Enfoque top-down ISO/TS 20914", md: "1. Calcule el CV del CIC por nivel: u(Rw).\n2. Pida al fabricante la incertidumbre del calibrador (si da U con k, divida por k): u(cal).\n3. u_c = √(u(Rw)² + u(cal)²); U = 2·u_c.\n4. Compare con la MAU (deseable 0,5·CVI).\n5. Documente y revise anualmente.", calcs: ["mu", "vb"] },
      rPocos: { resultado: true, tipo: "alerta", titulo: "Estimación provisional", md: "Estime con los datos disponibles, declárela **provisional** y prográmele una revisión cuando complete el periodo. Con pocos meses la u(Rw) suele quedar subestimada porque no captura las fuentes de variación a largo plazo (lotes, calibraciones).", calcs: ["mu"] },
      rCalc: { resultado: true, tipo: "info", titulo: "Propague la incertidumbre de las entradas", md: "Estime la incertidumbre de cada magnitud medida (top-down) y propáguela por la fórmula, con coeficientes de sensibilidad; use Monte Carlo si la función es no lineal (enfoque GUM / JCGM 101). Las constantes de la ecuación (p. ej. del CKD-EPI) suelen tratarse como exactas, y se declara." },
      rCual: { resultado: true, tipo: "info", titulo: "No se expresa como U", md: "Para resultados binarios caracterice la incertidumbre del **valor de corte** (C5–C95, CLSI EP12) y el desempeño diagnóstico (sensibilidad y especificidad con IC 95 %). Si la prueba tiene una señal cuantitativa subyacente (índice S/CO), puede estimar la imprecisión de esa señal cerca del corte." },
      rMicro: { resultado: true, tipo: "info", titulo: "Incertidumbre en diluciones", md: "Para las CMI, la incertidumbre se expresa como la reproducibilidad en diluciones dobles (habitualmente ±1 dilución), evaluada con cepas de control de calidad. No aplique el modelo cuantitativo continuo." },
    },
  },
};
