# Compuertas lógicas

Material interactivo para aprender compuertas lógicas. Son páginas HTML estáticas, sin dependencias ni paso de compilación, publicadas con GitHub Pages.

- **`index.html`**: portada.
- **`compuertas-logicas.html`**: banco de pruebas con las siete compuertas (AND, OR, NOT, NAND, NOR, XOR, XNOR), sus tablas de verdad, los circuitos de interruptores equivalentes y un reto para adivinar la compuerta.
- **`juego-compuertas.html`**: taller con dos juegos.
  - *Enciende la salida*: el circuito ya está armado y tú mueves los interruptores.
  - *Arma el circuito*: eliges la compuerta de cada hueco hasta reproducir una tabla de verdad.
  - Cada juego tiene 10 niveles con estrellas y un **modo sin final** que genera circuitos nuevos, cada vez más difíciles, con puntos, rachas y récord.
- **`PRESENTACION EJEMPLOS COMPUERTAS LOGICAS/`**: presentación interactiva de 15 diapositivas con las siete compuertas aplicadas a máquinas electromecánicas: compresor, banda transportadora, tanque, bombas en paralelo, tablero con anunciador, nave con interruptores de 3 vías y sincronización de un generador. Cada escena se simula en vivo, con inercia y partículas de flujo, y trae escenarios de un clic, tabla de verdad, Ladder con flujo de corriente, diagrama de compuertas (símbolo o armado con básicas) con su ecuación booleana en vivo, y cronograma. Incluye además un caso integrador de arranque directo, con corriente de arranque y disparo térmico, y una actividad final. Se navega con ← →, el control remoto o deslizando. `N` abre las notas del docente, `O` el índice, `S` activa el sonido, `T` pausa el cronómetro y `F` activa la pantalla completa. Arriba a la derecha hay un cronómetro que arranca al pasar a la diapositiva 2, con un límite configurable (30 a 60 min) y avisos cuando quedan 5 y 1 minuto. Los archivos son `index.html`, `deck.css`, `core.js`, `scenes-*.js`, `gates.js`, `logic.js`, `app.js` y `timer.js`.

## Verlo en local

Abre `index.html` en el navegador. No hace falta servidor.

## Publicar

En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, rama `main`, carpeta `/ (root)`.
