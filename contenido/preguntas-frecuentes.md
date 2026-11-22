# Preguntas frecuentes de metrología y calidad en el laboratorio clínico

> Respuestas orientativas para la práctica. Los criterios exactos de documentos de pago (ISO, CLSI) se
> confirman en la copia autorizada; la normativa colombiana, en la fuente oficial vigente.

## Incertidumbre de medida

### ¿Cómo calculo la incertidumbre de medida de un examen?
Use el enfoque top-down de **ISO/TS 20914**: u_c = √(u(Rw)² + u(cal)²) y U = 2·u_c.
- **u(Rw)** es el CV del control interno a largo plazo (idealmente ≥ 6 meses, incluyendo cambios de lote
  y recalibraciones), por nivel.
- **u(cal)** es la incertidumbre estándar del calibrador declarada por el fabricante. Si el certificado da
  U con k, divida por k.
- Compare la u_c con la **MAU** (deseable = 0,5·CVI según EFLM).
Calculadora: **Incertidumbre ISO/TS 20914**.

### ¿Debo sumar el sesgo a la incertidumbre?
Por defecto no. ISO/TS 20914 indica que el sesgo significativo debe corregirse o eliminarse. Si decide
incluirlo (p. ej. con el enfoque Nordtest: u(sesgo) = √(RMS_sesgo² + u(Cref)²)), declárelo y
justifíquelo en el documento.

### ¿Cada cuánto debo revisar la incertidumbre?
Al menos una vez al año y siempre que cambie algo relevante: nuevo método, calibrador, equipo o un
cambio sostenido del CIC.

### ¿La incertidumbre se informa en el reporte de resultados?
ISO 15189 exige que esté **disponible** para los usuarios que la soliciten y que se use al interpretar
resultados cerca de los límites de decisión. Informarla en cada reporte es una decisión del laboratorio
y de los clínicos.

### ¿Qué hago si la incertidumbre supera la MAU?
Identifique el componente dominante. Si es u(Rw), trabaje la imprecisión: mantenimiento, calibración,
lotes, operadores. Si es u(cal), consulte al fabricante. Documente el riesgo, informe a los clínicos si
afecta la interpretación y planifique la mejora.

## Control interno de la calidad

### ¿Puedo usar la media y la DE del inserto del control?
No para controlar. Los rangos del fabricante son amplios: sirven para verificar que su sistema está en el
rango esperado. Establezca su propia media y DE con al menos ~20 datos en días diferentes y actualícelas
con datos acumulados.

### ¿La regla 1-2s es de rechazo?
No. Es una regla de **alerta**: indica que se revisen las demás reglas. Usarla para rechazar produce
~9 % de falsos rechazos con 2 controles por corrida.

### ¿Qué reglas de Westgard debo usar?
Dependen del **Sigma** de cada analito. Con Sigma ≥ 6 basta 1-3s; con Sigma entre 4 y 5 se usa la
multirregla 1-3s/2-2s/R-4s/4-1s; con Sigma < 4 se necesita control máximo y mejorar el método.
Calculadora: **Sigma**.

### ¿Qué hago cuando se rechaza una corrida?
No libere resultados. Identifique el tipo de error con la regla violada (aleatorio: 1-3s, R-4s;
sistemático: 2-2s, 4-1s, 10x). Busque la causa, corrija, repita los controles, evalúe los resultados de
pacientes desde el último control aceptable y registre todo. Repetir el control "hasta que entre" sin
investigar es una no conformidad. Guía: **Rechazo de control interno**.

### ¿Cómo calculo el Sigma?
Sigma = (ETa − |sesgo|)/CV, todo en % y a la misma concentración. El sesgo sale de la EEC (varios
ciclos), de un material de referencia o de una comparación con un método de referencia. El CV, de la
precisión intermedia del CIC.

### ¿Con qué frecuencia debo correr controles?
Según el riesgo (CLSI C24): Sigma del método, gravedad del daño de un resultado erróneo, volumen y número
de pacientes afectados entre eventos de control (Max E(Nuf)). Además, siempre tras calibrar, tras un
mantenimiento mayor, tras un cambio de lote o una falla, y al reiniciar el sistema.

### ¿Cómo evalúo un cambio de lote de reactivo?
Con **muestras de pacientes** (los controles pueden no ser conmutables). Defina antes la diferencia
crítica a partir del sesgo admisible y lleve un registro acumulado de diferencias entre lotes (CLSI EP26).
Guía: **Cambio de lote de reactivo**.

## Verificación y validación

### ¿Cuál es la diferencia entre verificar y validar?
**Verificar**: confirmar que un método comercial validado, usado sin modificar, reproduce lo declarado
por el fabricante. **Validar**: estudio completo para métodos desarrollados en casa, modificados o usados
fuera del uso previsto. Guía: **¿Verificar o validar?**

### ¿Qué debo verificar en un método cuantitativo nuevo?
Como mínimo: precisión (EP15), veracidad o sesgo (EP15 o EP09), intervalo de medida (EP06) e intervalo
de referencia (EP28). Según el analito, también LoD/LoQ (EP17), interferencias (EP07) y arrastre. Fije
los criterios **antes** de recolectar datos.

### ¿Cuántas muestras necesito para comparar dos métodos?
CLSI EP09 recomienda en general al menos 40 muestras de pacientes distribuidas en todo el intervalo de
medida (confirme en la copia autorizada). Use Passing-Bablok o Deming, Bland-Altman, y evalúe el sesgo en
los límites de decisión clínica. Calculadora: **Comparación de métodos**.

### ¿Un r² de 0,99 demuestra que el método es lineal o que los métodos concuerdan?
No. El r² depende del rango y casi no detecta curvatura ni sesgo. Para linealidad, evalúe la desviación
respecto a la linealidad (EP06); para concordancia, el sesgo y los límites de acuerdo.

### ¿Cómo verifico la precisión declarada por el fabricante?
Diseño tipo EP15: 5 días × 5 réplicas por nivel. Calcule la repetibilidad y la DE intralaboratorio con
ANOVA. Si la DE observada supera la declarada, compárela con el **límite superior de verificación**
(χ²). Calculadora: **Verificación EP15**.

### ¿Cómo verifico un intervalo de referencia?
Transferencia tipo EP28: analice 20 individuos sanos de su población. Si ≤ 2 (10 %) caen fuera, el
intervalo se acepta; con 3–4 fuera, repita con otros 20. Para establecer uno propio se necesitan
≥ 120 individuos por partición. Calculadora: **Intervalos de referencia EP28**.

### ¿Cómo calculo el LoB y el LoD?
LoB = media de blancos + 1,645·DE (con corrección por grados de libertad), o el percentil 95 no
paramétrico. LoD = LoB + 1,645·DE de muestras de baja concentración. Calculadora: **LoB / LoD EP17**.

### ¿Cómo verifico una prueba cualitativa?
Concordancia con un método comparativo o estándar de referencia (sensibilidad, especificidad, PPA/NPA con
IC 95 %), con un panel que incluya positivos débiles cerca del valor de corte. Caracterice la imprecisión
del valor de corte (C5–C95) según CLSI EP12.

## Evaluación externa y trazabilidad

### Mi EEC salió "aceptable", ¿ya cumplí?
No necesariamente. Revise tendencias: desviaciones del mismo lado, z crecientes, un nivel con problemas.
Un sesgo persistente "aceptable" también requiere acción. Calculadora: **Puntajes EEC**.

### ¿Qué hago con un resultado de EEC insatisfactorio?
Investigue la causa raíz (preanalítica, transcripción, cálculo, calibración, reactivo, interpretación),
evalúe el impacto en los pacientes, tome una acción correctiva y verifique su eficacia en el siguiente
ciclo. Guía: **Resultado insatisfactorio de EEC**.

### ¿Qué hago si no existe un programa de EEC para un examen?
Use alternativas (CLSI QMS24): intercambio de muestras con otros laboratorios, comparación con un
laboratorio de referencia, materiales de referencia o reanálisis de muestras de pacientes. Documente la
elección y su frecuencia.

### ¿Qué significa que un resultado sea trazable?
Que puede relacionarse con una referencia (idealmente el SI) mediante una cadena documentada de
calibraciones con incertidumbres. En el laboratorio clínico la cadena la construye el fabricante; el
laboratorio conserva la declaración de trazabilidad y usa el sistema sin modificarlo.

### ¿Por qué no debo usar los controles para comparar dos equipos?
Porque los materiales de control suelen no ser **conmutables**: pueden mostrar diferencias que no existen
con pacientes, u ocultar diferencias reales. Use muestras de pacientes.

## Acreditación y normativa

### ¿Mi laboratorio se "certifica" en ISO 15189?
No: se **acredita**. La acreditación evalúa la competencia técnica por examen (en Colombia, ONAC). La
certificación (p. ej. ISO 9001) evalúa el sistema de gestión.

### ¿Qué cambió en ISO 15189:2022?
Enfoque en el paciente y en el riesgo, POCT integrado en un anexo, estructura alineada con ISO/IEC 17025,
menos documentos obligatorios, requisitos explícitos de incertidumbre, intervalos de referencia y
continuidad del servicio. La transición desde la edición 2012 terminó en diciembre de 2025.

### ¿La acreditación ISO 15189 reemplaza la habilitación?
No. En Colombia la habilitación (Resolución 3100 de 2019 y sus modificaciones) es obligatoria; la
acreditación ISO 15189 es voluntaria y evalúa otra cosa. Una no sustituye a la otra.

### ¿Qué indicadores de calidad debo medir?
Preanalíticos (muestras rechazadas, errores de identificación), analíticos (corridas rechazadas, EEC
insatisfactorias, Sigma) y postanalíticos (tiempo de respuesta, valores críticos comunicados a tiempo,
informes corregidos). Defina una especificación para cada uno y revíselos en la revisión por la dirección.

### ¿Qué debe tener un certificado de calibración de un equipo auxiliar?
Identificación del equipo, resultados, **incertidumbre expandida con k**, trazabilidad, método, condiciones
y fecha. El proveedor debe estar acreditado según ISO/IEC 17025 con un alcance que cubra la magnitud y el
intervalo calibrados (verifíquelo en el directorio de ONAC).

### ¿Qué es la reactivovigilancia?
El programa de vigilancia de los reactivos de diagnóstico in vitro (INVIMA, Decreto 3770 de 2004). El
laboratorio debe reportar los eventos e incidentes adversos asociados a reactivos.
