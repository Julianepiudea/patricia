// Lista de autoevaluación orientada a ISO 15189:2022. Preguntas de redacción propia para revisar
// evidencias; no reproduce texto normativo. La numeración es orientativa: confirme en la copia autorizada.

export const CHECKLIST = [
  { area: "4 · Generales", clausula: "4.1–4.3", items: [
    "Hay un análisis documentado de riesgos para la imparcialidad, revisado periódicamente.",
    "El personal y los externos con acceso a información firmaron compromisos de confidencialidad.",
    "Se informa a pacientes y usuarios sobre los servicios, las condiciones de toma y el manejo de quejas.",
  ]},
  { area: "5 · Estructura y gobernanza", clausula: "5.1–5.6", items: [
    "El laboratorio es una entidad legal identificable, con alcance de actividades declarado y actualizado.",
    "El director del laboratorio tiene responsabilidades, competencia y autoridad definidas, incluida la delegación.",
    "Existen objetivos de calidad medibles, alineados con la política y con seguimiento.",
    "El riesgo para el paciente se gestiona en todo el ciclo del examen (matriz de riesgos tipo ISO 22367).",
  ]},
  { area: "6 · Personal", clausula: "6.2", items: [
    "Hay perfiles de cargo con requisitos de formación, experiencia y competencia.",
    "Cada persona está autorizada formalmente para los exámenes y actividades que realiza.",
    "La competencia se evalúa periódicamente por examen (observación directa, muestras ciegas, EEC).",
    "Existe un programa de formación continua con registros.",
  ]},
  { area: "6 · Instalaciones y equipos", clausula: "6.3–6.4", items: [
    "Las condiciones ambientales críticas (temperatura, humedad, refrigeradores) se monitorean y registran, con acción ante desviaciones.",
    "Cada equipo tiene hoja de vida, verificación antes de uso, mantenimiento preventivo y registro de fallas.",
    "Los equipos fuera de servicio se identifican y se evalúa el efecto en los resultados previos.",
  ]},
  { area: "6 · Calibración y trazabilidad", clausula: "6.5", items: [
    "Los equipos auxiliares críticos (pipetas, termómetros, balanzas) tienen certificados con U y k de proveedores competentes.",
    "Se verificó que el alcance acreditado del proveedor de calibración cubre la magnitud y el intervalo calibrados.",
    "Se conserva la declaración de trazabilidad metrológica de cada calibrador (referencia de orden superior).",
    "Los calibradores se usan según el sistema validado (sin modificaciones que rompan la cadena).",
  ]},
  { area: "6 · Reactivos y proveedores", clausula: "6.6–6.8", items: [
    "Los lotes nuevos de reactivo se verifican antes de usarlos, con muestras de pacientes cuando aplica.",
    "Hay inventario con control de vencimientos y condiciones de almacenamiento.",
    "Los proveedores y los laboratorios de referencia se seleccionan y evalúan con criterios definidos.",
    "Existen acuerdos de servicio revisados con los usuarios y los laboratorios de remisión.",
  ]},
  { area: "7 · Preanalítica", clausula: "7.2", items: [
    "El manual de toma de muestras está disponible para quienes toman las muestras.",
    "Los criterios de aceptación y rechazo de muestras están definidos y se registran los rechazos.",
    "El transporte (tiempo, temperatura, bioseguridad) está controlado y monitoreado.",
    "La identificación inequívoca del paciente y la muestra se verifica en cada etapa.",
  ]},
  { area: "7 · Verificación y validación", clausula: "7.3.2–7.3.3", items: [
    "Cada examen del alcance tiene un reporte de verificación o validación aprobado.",
    "Las especificaciones de desempeño se fijaron antes del estudio, con su fuente declarada.",
    "La verificación incluye precisión, veracidad, intervalo de medida e intervalo de referencia (según aplique).",
    "Los métodos modificados o desarrollados en casa tienen una validación completa.",
  ]},
  { area: "7 · Incertidumbre e intervalos", clausula: "7.3.4–7.3.5", items: [
    "Se estimó la incertidumbre de cada mensurando cuantitativo y se comparó con una especificación (MAU).",
    "La estimación de incertidumbre se revisa periódicamente y está disponible para los usuarios.",
    "Los intervalos de referencia y los límites de decisión clínica tienen fuente documentada y verificación local.",
  ]},
  { area: "7 · Validez de resultados", clausula: "7.3.7", items: [
    "Hay un plan de CIC por analito (material, niveles, frecuencia, reglas) justificado por riesgo o Sigma.",
    "La media y la DE de los controles son propias del laboratorio, no del inserto.",
    "Los rechazos de CIC se investigan, con evaluación del impacto en pacientes.",
    "Se participa en EEC para todos los exámenes del alcance, o hay alternativas documentadas.",
    "Los resultados de EEC se analizan, incluidas las tendencias, con acciones registradas.",
    "Se demuestra la comparabilidad entre equipos o sedes que reportan el mismo examen.",
  ]},
  { area: "7 · Postanalítica e información", clausula: "7.4–7.6", items: [
    "Los resultados se revisan antes de liberarse; la autoverificación (si existe) está validada.",
    "La política de valores críticos define analitos, límites, tiempos y registro de la comunicación.",
    "Los informes corregidos se identifican y se comunica la corrección.",
    "El LIS y sus interfaces están validados; hay copias de seguridad y control de accesos.",
  ]},
  { area: "7 · No conformidades, quejas y continuidad", clausula: "7.5, 7.7, 7.8", items: [
    "El trabajo no conforme se identifica, se evalúa su impacto y se decide sobre los resultados afectados.",
    "Las quejas se registran, investigan y responden.",
    "Existe un plan de continuidad y emergencias, probado o simulado.",
  ]},
  { area: "8 · Sistema de gestión", clausula: "8.1–8.9", items: [
    "Los documentos están controlados (versión, aprobación, distribución, revisión).",
    "Los registros se conservan con tiempos de retención definidos.",
    "Las acciones correctivas incluyen análisis de causa raíz y verificación de eficacia.",
    "Hay un programa de auditorías internas que cubre todo el sistema y todos los exámenes del alcance.",
    "La revisión por la dirección analiza los indicadores, las auditorías, la EEC, las quejas y los riesgos, con decisiones registradas.",
  ]},
  { area: "Anexo A · POCT", clausula: "Anexo A", items: [
    "Existe una gobernanza POCT (comité o responsable) con alcance definido.",
    "Los operadores POCT están formados y autorizados, con evaluación periódica.",
    "Los equipos POCT tienen CIC y EEC, con supervisión del laboratorio.",
  ]},
];
