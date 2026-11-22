# PatricIA

Asistente experto en metrología y calidad para el laboratorio clínico. Es una aplicación web instalable
(PWA): funciona sin conexión, no usa inteligencia artificial generativa y procesa los datos solo en el
dispositivo del usuario.

## Funciones

- **Preguntar**: un buscador experto en español (BM25, sinónimos y siglas) sobre la base de conocimiento.
  Responde con la sección precisa, la fuente, herramientas relacionadas y lectura en voz alta. Acepta
  preguntas por voz donde el navegador lo permite.
- **Guías**: 7 árboles de decisión (verificar o validar, rechazo de CIC, EEC insatisfactoria, qué
  documento CLSI aplica, elección de especificación, cambio de lote, incertidumbre).
- **Calculadoras**, con datos desde Excel, CSV o pegados de Excel:
  - incertidumbre ISO/TS 20914 (y Nordtest);
  - Sigma con selección de reglas;
  - Westgard con gráficos de Levey-Jennings;
  - EP15, EP17 (LoB/LoD) y EP28;
  - especificaciones por variación biológica, con RCV;
  - comparación de métodos (Passing-Bablok, Deming, Bland-Altman, TOST);
  - puntajes de EEC (z, z', En).

  Cada resultado se puede exportar a CSV e imprimir o guardar como PDF.
- **Autoevaluación ISO 15189:2022**: lista de chequeo que se guarda en el dispositivo y se puede
  exportar.
- **Biblioteca, glosario y plantillas.**

## Estructura

```
index.html            página única
manifest.webmanifest  datos de instalación (nombre, iconos)
sw.js                 service worker (uso sin conexión)
css/app.css           estilos (temas claro y oscuro)
js/app.js             interfaz y enrutado
js/buscador.js        motor de búsqueda
js/calculos.js        calculadoras (funciones puras)
js/estadistica.js     distribuciones t, χ², binomial y normal (verificadas contra SciPy)
js/definiciones.js    formularios, columnas y ejemplos de cada calculadora
js/guias.js           árboles de decisión
js/checklist.js       autoevaluación ISO 15189
js/datos.js           lectura de Excel/CSV y mapeo de columnas
contenido/*.md        base de conocimiento (Markdown)
vendor/, fuentes/     librerías y tipografías locales
```

## Cómo actualizar el contenido

1. Edite o agregue archivos `.md` en `contenido/`. Las secciones `##` y `###` son las unidades que
   devuelve el buscador.
2. Si agrega un documento, regístrelo en `DOCUMENTOS` (en `js/buscador.js`) y en `ARCHIVOS` (en `sw.js`).
3. **Siempre** incremente `VERSION` en `sw.js` (p. ej. `patricia-v1.0.1`) para que los dispositivos
   instalados descarguen la versión nueva.
4. Publique los cambios: `git add -A && git commit -m "..." && git push`.

## Probar en el computador

```
py -3 -m http.server 8765
```

Luego abra http://127.0.0.1:8765. Abrir `index.html` con doble clic no funciona, porque los navegadores
bloquean la carga de contenido desde archivos locales.

## Aviso

Los resultados son borradores técnicos para revisión del responsable autorizado del laboratorio. Las
normas ISO y CLSI tienen derechos de autor: PatricIA explica su aplicación sin reproducir su texto.

## Licencias de terceros

Chart.js (MIT), SheetJS Community Edition (Apache 2.0), marked (MIT), Lucide (ISC), Inter y Sora
(SIL Open Font License). Parte del conocimiento metodológico se apoya en *Scientific Agent Skills* de
K-Dense (MIT).
