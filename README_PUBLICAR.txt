TRADEMASTER PRO — PWA V1.0.0
============================

Aplicación web instalable para Android y otros sistemas compatibles.
No necesita servidores propios, cuentas ni conexión con exchanges.

ARCHIVOS PARA GITHUB
-------------------
index.html                 pantalla principal
styles.css                 diseño claro y oscuro
app.js                     interfaz, idiomas y datos locales
trade-math.js              cálculos financieros (estimativos)
manifest.json              configuración de instalación
service-worker.js          funcionamiento sin conexión y actualizaciones
icons/                     imágenes e íconos necesarios

PUBLICACIÓN EN GITHUB PAGES
---------------------------
1) Descomprimí el ZIP. Los archivos sueltos (index.html, etc.)
   deben ir en la RAÍZ del repositorio, no dentro de una subcarpeta.
   La carpeta «icons» sí se sube como carpeta completa.
2) Creá un repositorio nuevo (por ejemplo: trademaster-pro).
3) Subí los archivos descomprimidos al repositorio (rama main).
4) En GitHub: Settings > Pages > Build and deployment.
   Elegí «Deploy from a branch», rama «main», carpeta «/(root)».
5) GitHub mostrará la dirección HTTPS de tu app.
6) Abrí esa dirección desde el teléfono > menú del navegador
   > «Instalar aplicación» o «Añadir a pantalla de inicio».

ACTUALIZACIONES
---------------
- Para cambiar la app, subí los archivos actualizados con los MISMOS
  nombres y rutas al MISMO repositorio; GitHub versiona los cambios.
- El service worker usa «network first» para comprobar cambios al
  abrir o refrescar la app. Puede haber un intervalo de publicación
  o caché del navegador antes de que se vean.
- No hace falta desinstalar para recibir cambios.
- El service worker puede incrementar su constante VERSION para forzar
  la renovación ordenada de caché cuando cambie mucho la aplicación.
- Conservá la misma dirección web y el mismo identificador de la PWA.

DATOS LOCALES
-------------
- Las preferencias (idioma, tema) y los valores ingresados se guardan
  en localStorage de ese navegador/dispositivo.
- Normalmente sobreviven a las actualizaciones de GitHub Pages.
- Se pueden perder al borrar datos del sitio, restablecer el navegador,
  desinstalar ciertas apps, cambiar de dominio/origen o en modo privado.
- No se sincronizan entre dispositivos ni se almacenan en una cuenta.

FUNCIONAMIENTO Y AVISOS IMPORTANTES
----------------------------------
- Funciona sin conexión una vez que se abre correctamente y se instalan
  sus recursos. Para instalarla inicialmente se necesita HTTPS.
- La liquidación es una aproximación matemática sencilla. NO tiene en
  cuenta margen de mantenimiento, tarifas de liquidación, funding,
  márgenes aislados/cruzados ni reglas particulares de cada exchange.
- Las comisiones, si se activan, se estiman en 0,04 % a la entrada
  y 0,04 % a la salida. Ajustar el cálculo si cambia el exchange.
- El gestor de riesgo ignora comisiones, deslizamientos y gaps.
- No ejecuta operaciones ni toca fondos reales.
- «ESPACIO PUBLICIDAD» es solo un marcador: no hay anuncios reales.

NOTA: Para probar la instalación PWA usá la URL HTTPS de GitHub Pages.
Abrir index.html desde el explorador de archivos permite revisar
la interfaz, pero no registra el service worker ni instala la PWA.
