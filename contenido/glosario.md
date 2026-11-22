# Glosario de metrología y calidad para el laboratorio clínico

> Definiciones explicativas basadas en el VIM (JCGM 200) y en el uso habitual del laboratorio clínico.
> Para documentos controlados, cite la definición literal del VIM vigente (documento público del BIPM).

### Mensurando
Magnitud que se pretende medir. Incluye la entidad, el sistema y la unidad: por ejemplo, "concentración
de sustancia de glucosa en plasma venoso, en mmol/L". Definirlo mal (decir solo "glucosa") hace que la
incertidumbre y la trazabilidad pierdan sentido.

### Exactitud de medida
Proximidad entre un valor medido y el valor verdadero del mensurando. Es un concepto **cualitativo** que
combina veracidad y precisión; no se expresa con un número.

### Veracidad
Proximidad entre la **media** de un número infinito de mediciones repetidas y un valor de referencia. Su
expresión cuantitativa (inversa) es el **sesgo**. Se evalúa con materiales de referencia, EEC conmutable
o comparación con un procedimiento de referencia.

### Sesgo
Estimación del error sistemático: la diferencia entre la media de los resultados y un valor de
referencia. Se expresa en unidades o en %. Puede ser constante (intercepto) o proporcional (pendiente).

### Precisión
Proximidad entre resultados de mediciones repetidas sobre el mismo objeto en condiciones especificadas.
Se expresa como DE o CV (**imprecisión**). Siempre indique las condiciones: repetibilidad, precisión
intermedia o reproducibilidad.

### Repetibilidad
Precisión en las mismas condiciones: mismo procedimiento, operador, equipo, lugar y corto intervalo de
tiempo (dentro de una corrida).

### Precisión intermedia (intralaboratorio, Rw)
Precisión dentro del laboratorio a lo largo del tiempo, incluyendo cambios de día, operador, calibración
y lotes. Es la que refleja la rutina, y la que se usa para el CIC y para la incertidumbre según
ISO/TS 20914.

### Reproducibilidad
Precisión entre laboratorios (condiciones distintas de lugar, operadores y sistemas de medida).

### Error total (ET)
Combinación de error sistemático y aleatorio que afecta un resultado individual: ET = |sesgo| + Z·CV.
Concepto de Westgard usado para planificar el control de calidad y calcular el Sigma.

### Error total admisible (ETa)
Límite máximo de error total aceptable para el uso clínico del resultado. Debe declararse su fuente:
variación biológica, CLIA, RiliBÄK o consenso.

### Incertidumbre de medida
Parámetro no negativo que caracteriza la dispersión de los valores atribuidos al mensurando, a partir de
la información utilizada. En el laboratorio clínico se estima con el enfoque top-down de ISO/TS 20914.

### Incertidumbre estándar (u)
Incertidumbre expresada como desviación estándar.

### Incertidumbre combinada (u_c)
Incertidumbre estándar del resultado obtenida al combinar los componentes (raíz de la suma de cuadrados,
ponderada por los coeficientes de sensibilidad).

### Incertidumbre expandida (U)
U = k·u_c. Define un intervalo que se espera abarque una fracción grande de los valores (≈ 95 % con
k = 2). Siempre se reporta con k.

### Factor de cobertura (k)
Número por el que se multiplica u_c para obtener U. k = 2 corresponde a ~95 % si la distribución es
aproximadamente normal y los grados de libertad son suficientes.

### Evaluación tipo A
Evaluación de un componente de incertidumbre por análisis estadístico de observaciones (p. ej. DE del
CIC).

### Evaluación tipo B
Evaluación por otros medios: certificados, especificaciones del fabricante, literatura. Exige convertir a
incertidumbre estándar (dividir por k, por √3 si la distribución es rectangular, etc.).

### MAU (incertidumbre máxima admisible)
Especificación de desempeño para la incertidumbre. Según EFLM, basada en la variación biológica: óptima
0,25·CVI, deseable 0,50·CVI y mínima 0,75·CVI (incertidumbre estándar).

### Trazabilidad metrológica
Propiedad de un resultado de poder relacionarse con una referencia mediante una cadena ininterrumpida y
documentada de calibraciones, cada una con su incertidumbre. En IVD la regula ISO 17511.

### Calibrador
Material de referencia usado para calibrar un sistema de medida. El valor asignado por el fabricante y
su incertidumbre (u(cal)) entran en la incertidumbre del resultado.

### Material de referencia certificado (MRC)
Material de referencia acompañado de un certificado con valor, incertidumbre y trazabilidad, emitido por
un productor competente (ISO 17034).

### Procedimiento de medida de referencia
Procedimiento aceptado para obtener resultados adecuados para evaluar la veracidad de otros
procedimientos o caracterizar materiales de referencia (ISO 15193; base JCTLM).

### Conmutabilidad
Propiedad de un material de referencia o de control de comportarse como las muestras de pacientes en los
procedimientos de medida comparados. Si un material no es conmutable, sus resultados no predicen el
comportamiento con pacientes.

### Calibración
Operación que establece la relación entre los valores con sus incertidumbres provistos por patrones y las
indicaciones correspondientes, y la usa para obtener resultados. No es lo mismo que ajuste ni que
verificación.

### Verificación
Aportación de evidencia objetiva de que un elemento satisface requisitos especificados. En ISO 15189:
confirmar que un método validado, usado sin modificar, reproduce el desempeño declarado.

### Validación
Verificación de que los requisitos especificados son adecuados para un uso previsto. En ISO 15189:
estudio completo para métodos no normalizados, desarrollados en casa o modificados.

### Intervalo de medida (intervalo analítico)
Conjunto de valores del mensurando que el procedimiento mide con la incertidumbre especificada. Se
evalúa con estudios de linealidad (CLSI EP06).

### Límite del blanco (LoB)
Valor más alto esperado en una muestra sin analito, con una probabilidad dada (típicamente 95 %).

### Límite de detección (LoD)
Menor cantidad de analito que se detecta de forma fiable, distinguible del LoB (CLSI EP17).

### Límite de cuantificación (LoQ)
Menor cantidad que se mide cumpliendo una meta de exactitud (ET o CV) definida por el laboratorio.

### Selectividad (especificidad analítica)
Capacidad del procedimiento de medir el mensurando sin interferencia de otras sustancias (CLSI EP07).

### Interferencia
Efecto de una sustancia o propiedad de la muestra que causa un sesgo clínicamente significativo
(hemólisis, ictericia, lipemia, fármacos, anticuerpos heterófilos).

### Arrastre (carry-over)
Contaminación de una muestra por la anterior en el analizador.

### Intervalo de referencia biológico
Intervalo que contiene el 95 % central de los valores de una población de referencia sana. No es lo mismo
que un límite de decisión clínica (CLSI EP28).

### Límite de decisión clínica
Valor a partir del cual se toma una decisión clínica (p. ej. HbA1c 6,5 % para diagnóstico de diabetes).
Es donde más importa el desempeño analítico.

### Variación biológica intraindividual (CVI)
Fluctuación de un analito alrededor del punto homeostático de un individuo.

### Variación biológica interindividual (CVG)
Variación entre los puntos homeostáticos de distintos individuos.

### Valor de referencia del cambio (RCV)
Diferencia mínima entre dos resultados seriados de un paciente para considerarla significativa:
√2·Z·√(CVa² + CVI²).

### Índice de individualidad (II)
CVI/CVG. Con II < 0,6 el intervalo de referencia poblacional es poco útil para seguir a una persona.

### Control interno de la calidad (CIC)
Procedimientos para monitorizar en tiempo real la estabilidad del sistema analítico, usando materiales
de control y reglas estadísticas (CLSI C24).

### Regla de control
Criterio para decidir si una corrida se acepta o se rechaza (p. ej. 1-3s, 2-2s, R-4s).

### Métrica Sigma
(ETa − |sesgo|)/CV. Cuántas desviaciones estándar caben entre el desempeño del método y el límite de
calidad. Un Sigma ≥ 6 es clase mundial; < 3, inaceptable.

### Evaluación externa de la calidad (EEC/EQA)
Evaluación del desempeño por comparación con otros laboratorios o con un valor asignado, mediante un
proveedor externo. Incluye los ensayos de aptitud (ISO/IEC 17043).

### Puntaje z
(x − X)/σpt en ensayos de aptitud. |z| ≤ 2 satisfactorio; 2 < |z| < 3 cuestionable; |z| ≥ 3
insatisfactorio (ISO 13528).

### Número En
(x − X)/√(U_lab² + U_ref²). Usa incertidumbres expandidas; |En| ≤ 1 es satisfactorio.

### PBRTQC
Control de calidad en tiempo real basado en resultados de pacientes (medias o medianas móviles, EWMA).

### Acreditación
Atestación de tercera parte de la **competencia técnica** de un laboratorio (ISO 15189, ISO/IEC 17025).
En Colombia la otorga ONAC.

### Certificación
Atestación de tercera parte de que un sistema de gestión cumple una norma (p. ej. ISO 9001). No evalúa
la competencia técnica.

### Habilitación
En Colombia, el cumplimiento de las condiciones mínimas obligatorias para prestar servicios de salud
(Resolución 3100 de 2019 y sus modificaciones).

### No conformidad
Incumplimiento de un requisito. Requiere corrección, análisis de causa raíz y acción correctiva con
verificación de eficacia (CAPA).

### Gestión del riesgo
Identificación, análisis, evaluación, control y seguimiento de los riesgos para el paciente en el ciclo
total del examen (ISO 22367).
