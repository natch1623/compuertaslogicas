# Compuertas lógicas

Material interactivo para aprender compuertas lógicas. Son páginas HTML estáticas, sin dependencias ni paso de compilación, publicadas con GitHub Pages.

- **`index.html`**: portada, con acceso al banco de pruebas, al taller y a la presentación.
- **`compuertas-logicas.html`**: banco de pruebas con las siete compuertas (AND, OR, NOT, NAND, NOR, XOR, XNOR), sus tablas de verdad, los circuitos de interruptores equivalentes y un reto para adivinar la compuerta.
- **`juego-compuertas.html`**: taller con dos juegos.
  - *Enciende la salida*: el circuito ya está armado y tú mueves los interruptores.
  - *Arma el circuito*: eliges la compuerta de cada hueco hasta reproducir una tabla de verdad.
  - Cada juego tiene 10 niveles con estrellas y un **modo sin final** que genera circuitos nuevos, cada vez más difíciles, con puntos, rachas y récord.
- **`presentacion/`**: presentación interactiva de 16 diapositivas (la primera es una pantalla en negro de espera) con las siete compuertas aplicadas a máquinas electromecánicas: compresor, banda transportadora, tanque, bombas en paralelo, tablero con anunciador, nave con interruptores de 3 vías y sincronización de un generador. Cada escena se simula en vivo, con inercia y partículas de flujo, y trae escenarios de un clic, y un panel de lógica con dos pestañas: «Tabla + compuertas» (tabla de verdad, diagrama de compuertas y ecuación booleana en vivo) y «Ladder + cronograma». Incluye además un caso integrador de arranque directo, con corriente de arranque, disparo térmico y su circuito en compuertas (con la realimentación de la autorretención) o en Ladder, y una actividad final. Se navega con ← →, el control remoto o deslizando. `N` abre las notas del docente, `O` el índice, `S` activa el sonido, `T` pausa el cronómetro y `F` activa la pantalla completa; al proyectar en pantalla completa la barra inferior se oculta sola y reaparece al bajar el mouse al borde de abajo. Arriba a la derecha hay un cronómetro que arranca al pasar de la pantalla en negro a la portada, con un límite configurable (30 a 60 min) y avisos cuando quedan 5 y 1 minuto. Los archivos son `index.html`, `deck.css`, `deck-v3.css` (capa estética «tablero en vivo»), `motion.css` (transiciones y microinteracciones), `neon.css` (acabado neón), `core.js`, `scenes-*.js`, `gates.js`, `logic.js`, `app.js` y `timer.js`.

La presentación se abre en `https://natch1623.github.io/compuertaslogicas/presentacion/` y también desde el enlace «Presentación» del banco de pruebas y del taller. La carpeta `PRESENTACION EJEMPLOS COMPUERTAS LOGICAS/` solo redirige a la ruta nueva, para no romper el enlace anterior.

## Verlo en local

Abre `index.html` en el navegador. No hace falta servidor.

## Publicar

En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, rama `main`, carpeta `/ (root)`.
