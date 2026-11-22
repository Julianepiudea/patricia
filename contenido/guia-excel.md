# Guía de Excel para verificación de métodos y control de calidad

> Fórmulas para Excel en español. En la configuración regional de Colombia los argumentos se separan con
> **punto y coma (;)** y los decimales con **coma**. Si su Excel usa coma como separador de argumentos,
> cambie `;` por `,`. En los ejemplos, los datos están en `C15:C34`; ajuste el rango a su hoja.

## Fórmulas básicas

### ¿Cómo calculo la media, la DE y el CV en Excel?
- Media: `=PROMEDIO(C15:C34)`
- Desviación estándar muestral: `=DESVEST.M(C15:C34)`. En versiones antiguas es `=DESVEST(C15:C34)`.
- CV %: `=DESVEST.M(C15:C34)/PROMEDIO(C15:C34)*100`
- Número de datos: `=CONTAR(C15:C34)`

Escriba **solo el rango**. Una fórmula como `=PROMEDIO(C15:C34;C16;C17;…)` cuenta dos veces las celdas
sueltas y distorsiona el resultado. Verifique que el rango empiece en la primera fila de datos (las celdas
combinadas del encabezado pueden engañar).

### ¿DESVEST, DESVEST.M, DESVEST.P o DESVESTA?
- `DESVEST.M` (o `DESVEST`) es la desviación estándar de una **muestra**, con n − 1. Es la que se usa
  en verificación y en control de calidad.
- `DESVEST.P` es la de una población completa, con n. No la use para estos estudios.
- `DESVESTA` cuenta los textos y los VERDADERO/FALSO como valores. Si se cuela un texto, cambia el
  resultado sin avisar.

### ¿Cómo hago que Excel diga si cumple o no cumple?
`=SI(G24<=G25*0,25;"Cumple";"No cumple")`. Combínelo con formato condicional (Inicio → Formato
condicional → Reglas para resaltar celdas → Texto que contiene «No cumple», en rojo).

### ¿Cómo calculo el sesgo y el error total en Excel?
- Sesgo absoluto: `=PROMEDIO(datos)-valor_objetivo`
- Sesgo %: `=(PROMEDIO(datos)-valor_objetivo)/valor_objetivo*100`
- Error total % de un nivel: `=1,65*CV+ABS(sesgo%)`

Calcule el sesgo **por nivel**, nunca un único promedio de todos los niveles, y use `ABS()`: un sesgo
negativo no reduce el error total.

### ¿Cómo calculo la incertidumbre en Excel?
Con el enfoque ISO/TS 20914, trabajando todo en %:
- u(Rw): CV de precisión intermedia a largo plazo, `=DESVEST.M(datos)/PROMEDIO(datos)*100`
- u(cal): incertidumbre del calibrador, `=U_certificado/k_certificado`
- u_c: `=RAIZ(uRw^2+ucal^2)`
- U (k = 2): `=2*u_c`, y en unidades `=U%*media/100`

Compare la u_c con la MAU deseable: `=0,5*CVI`. Calculadora: **Incertidumbre ISO/TS 20914**.

### ¿Cómo calculo la pendiente y el intercepto en Excel?
- `=PENDIENTE(Y;X)` y `=INTERSECCION.EJE(Y;X)`. El primer argumento es **Y**, el método a validar.
- `=COEFICIENTE.R2(Y;X)` da R²; `=COEF.DE.CORREL(Y;X)` da r. No los confunda en los rótulos.
- Estas funciones son regresión por mínimos cuadrados, que supone que X no tiene error y es sensible a
  valores extremos. Excel no trae Passing-Bablok ni Deming: use la calculadora **Comparación de
  métodos** de PatricIA y anote la pendiente con su IC 95 %.

## Gráficos

### ¿Cómo hago un gráfico de Levey-Jennings en Excel?
1. Junto a los resultados cree columnas con valores fijos: `Media`, `+1DE`, `−1DE`, `+2DE`, `−2DE`,
   `+3DE`, `−3DE`. Por ejemplo, `=$G$22+2*$G$23`, copiada hacia abajo.
2. Seleccione la columna de número de corrida o fecha, los resultados y las columnas de límites →
   **Insertar → Línea con marcadores**.
3. Dé formato a las series de límites: línea discontinua sin marcadores (±2DE en ámbar, ±3DE en rojo,
   la media en verde).
4. En el eje vertical (**Dar formato al eje**), fije el mínimo y el máximo en media ± 4 DE.
5. Use la media y la DE propias del laboratorio, no las del inserto.

### ¿Cómo hago un gráfico de dispersión con línea de regresión en Excel?
1. Seleccione primero la columna X (método de comparación) y luego la Y (método a validar). Excel toma
   la primera como eje X.
2. **Insertar → Dispersión (solo marcadores)**.
3. Clic en un punto → **Agregar línea de tendencia → Lineal** → marque *Presentar ecuación en el gráfico*
   y *Presentar el valor R cuadrado*.
4. Para la línea de identidad y = x: agregue una serie con los puntos (mínimo; mínimo) y (máximo;
   máximo), con línea discontinua.

### ¿Cómo hago un gráfico de Bland-Altman en Excel?
1. Cree dos columnas: `Promedio = (Y+X)/2` y `Diferencia = Y−X`, o en % `=(Y−X)/X*100`.
2. Calcule: sesgo `=PROMEDIO(dif)`, límite superior `=sesgo+1,96*DESVEST.M(dif)` y límite inferior
   `=sesgo−1,96*DESVEST.M(dif)`.
3. **Insertar → Dispersión** con Promedio en X y Diferencia en Y.
4. Agregue tres series horizontales (sesgo, superior e inferior), cada una con dos puntos en el
   promedio mínimo y máximo, en línea discontinua.
5. Si la diferencia crece con la concentración, use la diferencia en %.

### ¿Por qué mi gráfico de Excel no se actualiza o "no grafica bien"?
Haga clic en la serie y mire la barra de fórmulas. Si dice `=SERIE(…;{10,2;11,7;…};{…};1)`, con números
**entre llaves**, la serie tiene datos copiados como valores fijos y no está conectada a las celdas.

Para corregirla:
1. Clic derecho en el gráfico → **Seleccionar datos** → elija la serie → **Editar**.
2. En *Valores X* y *Valores Y* seleccione los rangos de la tabla.
3. Repita con cada serie y guarde la plantilla.

Esto pasa al copiar un gráfico de otro libro, o al pegar como imagen o valores.

## Errores de Excel

### ¿Qué significa #¡REF! y cómo lo corrijo?
La fórmula apuntaba a una celda, fila, columna u hoja que se eliminó o movió. Seleccione la celda, mire
la barra de fórmulas y reemplace `#¡REF!` por la referencia correcta. Por ejemplo, en el error total del
nivel II: `=1,65*'PRESIC. INTERMEDIA'!O24+ABS(sesgo_nivel_II)`.

Para evitarlo, no borre filas ni columnas que usan otras hojas; use **Ocultar** en su lugar.

### ¿Qué significa #¡DIV/0! en el formato?
Hay una división por cero, normalmente porque las celdas de datos están vacías (es normal en una
plantilla sin llenar). Para que la plantilla se vea limpia: `=SI(CONTAR(C15:C34)<2;"";DESVEST.M(C15:C34))`.

### ¿Por qué no debo dividir por un número fijo como /60?
`=SUMA(D10:D69)/60` solo es correcta si hay exactamente 60 datos. Use `=PROMEDIO(D10:D69)`, que se
adapta al número real de datos e ignora las celdas vacías.

### ¿Cómo protejo las fórmulas de la plantilla?
1. Seleccione las celdas de captura de datos → **Formato de celdas → Proteger** → desmarque *Bloqueada*.
2. **Revisar → Proteger hoja**.

Así el personal llena los datos sin borrar fórmulas por accidente. En un formato controlado del SGC,
documente la versión y valide las fórmulas cuando cambie la plantilla.
