# Arquitectura del frontend

Modo presencial: `settings.playMode` separa `online` de `in_person` sin alterar `mode`. El frontend incorpora selección, turnos orales con Listo (`completeTurn`/`turnCompleted`), actividad de solo lectura y debate oral; votos/resultados se mantienen en la app. El backend aún debe implementar y confirmar este contrato: no hay simulación de avance local. Ver [contrato presencial](PRESENTIAL_MODE.md).

Invitaciones en Render: los nuevos enlaces/QR usan `/?code=123456` (en producción, `https://characterus-front.onrender.com/?code=123456`) y abren el mismo formulario de unión, con código validado y sin incluir contraseña/token. `/join/:code` se conserva para enlaces anteriores. El frontend necesita un rewrite `/*` → `/index.html` para aperturas y recargas de rutas de BrowserRouter. Ver [despliegue en Render](RENDER.md).

`WaitingRoomV2` presenta únicamente los jugadores presentes, un solo contador de ocupación, una etiqueta de anfitrión y estado confirmado de cada participante. No renderiza placeholders de jugadores ni acciones de invitación por lugar. `LobbyAvatarPicker` es una tira visible de selección directa para usuarios e invitados, con estado ocupado y foco de teclado, sin indicador de carga; no abre un diálogo. `WaitingRoomV2` anticipa localmente el avatar propio en selector y tarjeta. Mantiene esa vista hasta que `roomUpdated` la confirma, incluso si llegan actualizaciones ajenas. Ante rechazo restaura la vista anterior y el selector muestra `toast.error`. Un timeout posterior a un `roomUpdated` que ya confirmó el avatar no lo revierte. El store canónico y los demás clientes siguen dependiendo del servidor. `RoomInvite` reúne código, QR, copia y Web Share cuando existe, con alternativa visible de selección del enlace/código si falla el portapapeles. Nunca comparte contraseña o credenciales. Invitación, categoría y reglas comparten un único panel lateral. El enlace seleccionable se muestra cuando falla la copia; código y QR están siempre visibles. Categoría y reglas derivan de la sala; un fallo del catálogo permite reintentar sin afectar el lobby.

Las solicitudes de preparación, inicio, salida y expulsión tienen bloqueo local de doble envío y errores junto a la acción. Expulsar requiere confirmación dentro de la UI y espera el ack, sin quitar participantes localmente. Salir conserva la sesión ante timeout/rechazo; solo el ack exitoso la limpia. El inicio mantiene el evento global `gameStarted` como dueño de la navegación a partida, y no habilita iniciar si falta el mínimo o hay participantes pendientes/desconectados. Los listeners globales y la propiedad del estado no cambian.

`CreateRoomPageV2` conserva `RoomSettings` local y el envío canónico mediante `useSocketRoom.createRoom`. Organiza el formulario en tres secciones y usa selección segmentada para capacidad (4/6/8), contador para impostores (1–3), selectores de categoría/modalidad e interruptores para conocimiento y votos. El resumen deriva directamente de `settings`, es sticky en escritorio y se apila en móvil; nunca muestra la contraseña ni inventa un PIN antes de crear. La preparación exige una categoría del listado y contraseña si la privacidad es privada; cambiar a pública elimina esa contraseña. Se mantiene `totalRounds` por compatibilidad, sin presentarlo como límite. El selector Virtual/Presencial anterior se retira: sobrescribía `mode` y el backend no tiene un campo independiente para ese concepto. Categorías vacías permiten reintentar y las respuestas de cargas anteriores se descartan al desmontar. Un ref bloquea envíos duplicados mientras se espera el ack.

`useAuthNavigation` conecta los enlaces Login/Registrarse mediante View Transition API en escritorio: captura panel visual, marco y formulario; usa `flushSync` únicamente dentro de la integración de captura del navegador. El barrido dura 600 ms, bloquea solicitudes de navegación repetidas hasta terminar y devuelve el foco al nuevo título. La navegación sigue siendo BrowserRouter sobre el mismo documento. Las páginas anteriores se desmontan normalmente, sin duplicar instancias de Google; se suprimen sus animaciones de entrada durante el barrido. En móvil, movimiento reducido o API ausente se usa navegación SPA con la entrada normal de la pantalla. El bloqueo y el atributo HTML temporales se limpian también si el navegador omite la animación.

`SignupScreenV2` comparte la base visual del login y sus componentes de acciones; invierte la disposición en escritorio y usa `SignupIllustration` (mesa de juego con personaje oculto y tarjeta de jugador) en lugar de una pareja de avatares. La ilustración refleja el nombre local como decoración, sin emitir credenciales ni modificar datos de cuenta. El bloque de 400 px agrupa los cuatro campos en dos columnas en escritorio y una en móvil. Conserva Zod, términos, Google y payload REST existentes; solo la visibilidad de cada contraseña, el error inline y la carga son estado de presentación. El formulario y Google permanecen montados/inertes durante el envío y conservan sus datos ante rechazo.

`LoginScreenV2` presenta un panel de acceso con una zona lateral de marca/personajes y el formulario al lado en escritorio, con título, Google, campos apilados y acción alineados en una columna de hasta 400 px. En móvil conserva una columna y una franja de marca sencilla. Las ventanas de escritorio bajas reducen solo la ilustración decorativa. Mantiene el verde agua como acento principal, campos con la misma escala de Registrarse (Input base de 48 px y fuente de 16 px), animación de entrada breve, autocomplete y mostrar/ocultar contraseña. Conserva los mismos handlers REST/Google y sesión. Durante la carga mantiene montado e inerte el formulario y el botón oficial de Google; ante rechazo conserva las credenciales ingresadas, muestra el error inline y enfoca el aviso. La visibilidad de contraseña y los errores de presentación son estado efímero local.

Las convenciones de tamaños, variantes y componentes compartidos están en [la guía de interfaz](UI_GUIDELINES.md). El login es la referencia para los botones de formularios y navegación.

La pantalla de unión conserva su flujo de código, identidad y contraseña condicional en un único panel centrado con una cabecera de marca, un avatar decorativo y un indicador contextual del campo actual. Presenta instrucciones breves, código de sala visible al avanzar, carga y errores accesibles. Solo usa una transición de opacidad entre pasos, respetando movimiento reducido. Los emisores, payloads, recuperación y reglas de acceso permanecen bajo la integración existente.

## Ritmo visual compartido

`src/index.css` centraliza `--page-gutter` (24–64 px), `--page-width` (1280 px), `--page-space` (24–40 px), `--panel-space` (24–32 px) y `--section-space` (64–112 px). `page-container` aplica ancho máximo y márgenes automáticos; `page-gutter` alinea pantallas/cabeceras y `page-padding` añade el espacio vertical general. Las pantallas activas reutilizan estos márgenes exteriores; formularios y paneles conservan anchos internos según su función.

`HomePage` tiene presentación, pasos de juego, ejemplo interactivo y cierre con avatares. Usa Motion para apariciones al hacer scroll, flotación y microinteracciones, respeta movimiento reducido y permite pausar la flotación. Los estados `selected`/`revealed` del ejemplo son exclusivamente locales e ilustrativos: no representan jugadores, roles ni votos reales, ni emiten eventos.


## Preparación de la sala e interacción

`useRoomStore` sigue siendo dueño de la vista pública de la sala. `Player.isLobbyReady`, recibido en `roomUpdated` y en el snapshot de recuperación, determina el estado de cada tarjeta y la habilitación de inicio. `WaitingRoomV2` solo conserva los estados transitorios de solicitud; `useSocketRoom.lobbyReady` espera el ack sin marcar al jugador listo de forma optimista. La preparación de sala es independiente de `isDebateReady` y de `isAlive`.

El anfitrión también confirma preparación antes de usar su acción separada de inicio. El servidor valida la regla, limpia preparación al terminar la partida y al desconectarse en espera. El frontend acepta la ausencia del campo como pendiente para compatibilidad de DTOs, pero el flujo nuevo requiere el backend coordinado. El lobby aprovecha hasta 1280 px de contenido y se apila en móvil. Login mantiene montado el formulario mientras presenta la carga por correo o Google, bloquea interacción y conserva los datos ante error.

## Objetivo del producto

CharacterUs coordina salas para un juego social por rondas. El backend Express debe ser la autoridad de sala, participantes, personaje asignado, impostores, votos y resultado; PostgreSQL en Supabase persiste los datos que correspondan. El frontend presenta ese estado y mantiene solo interacción efímera de UI.

Las pantallas V2 de creación, unión, lobby y juego están conectadas al contrato de `backend.md`. Las salas públicas permanecen mock porque el backend todavía no expone un listado.

## Entrada y navegación

`GoogleSignInButton` carga Google Identity Services con `VITE_GOOGLE_CLIENT_ID` y entrega la credencial a `useUserStore.loginWithGoogle`. `POST /api/auth/google` devuelve el JWT de CharacterUs, que sigue el manejo existente de sesión y restauración. La credencial de Google nunca se almacena. El perfil conserva `name` para presentación y usa `username` para contratos del juego. Ver `docs/GOOGLE_LOGIN.md`.

- `src/main.tsx` monta React en `StrictMode`, `BrowserRouter` y el toaster global.
- `src/App.tsx` declara todas las rutas y envuelve la aplicación con `ThemeProvider`.
- `/join/:code` precarga un PIN válido y omite el formulario de código. El invitado ingresa su nombre; el usuario autenticado confirma su identidad. Ambos continúan a contraseña si `joinRoom` la requiere. El QR del lobby contiene únicamente la URL completa con el PIN, sin credenciales.
- `App.tsx` monta una sola vez los listeners globales de juego y sala antes del controlador de recuperación. `useSocketRoom` solo expone acciones; ya no registra listeners por pantalla.
- Los stores de Zustand contienen la vista local del estado autoritativo recibido por Socket.IO.
- Los avatares de sala se reciben del backend: `useRoomStore.setRoom` sincroniza `room.players`, `players` y `currentPlayer`. El store conserva el avatar de `roomUpdated`; el lobby superpone una vista inmediata solo para el jugador local mientras espera `changeAvatar`, con rollback y toast ante rechazo.
- La sesión JWT se conserva por pestaña en `sessionStorage` mediante `useUserStore`. Al arrancar, `App.tsx` valida el token con `GET /api/auth/me`; solo entonces habilita `/menu`, `/create`, `/public-rooms` y `/profile`. Un visitante no autenticado se redirige a `/join` y solo puede acceder a lobby y juego tras unirse con código o recuperar su propia sesión de sala.
- `RoomInactivityWarning`, montado en `App.tsx`, escucha el ciclo de inactividad de la sala. Solo presenta el tiempo restante; el backend decide el cierre y autoriza la renovación del anfitrión.

El flujo visible actual no es un único flujo de datos:

```text
Login/Signup --REST + JWT--> Menu
Menu --> Create --createRoom--> Lobby --gameStarted--> Game
Menu --> Join --joinRoom--> Lobby --gameStarted--> Game
Menu --> Public rooms (mock) --joinRoom--> Lobby
Visitor --room code--> Join --joinRoom--> Lobby --gameStarted--> Game
```

El flujo objetivo descrito por el dominio sería:

```text
identidad -> crear/unirse -> lobby sincronizado -> asignación privada
          -> palabras/chat -> votación -> eliminación/resultado -> siguiente ronda
```

No debe documentarse el segundo flujo como implementado hasta que las páginas consuman estado autoritativo del servidor.

## Límites principales

### Presentación

- `src/pages/`: pantallas asociadas a rutas.
- `src/components/`: componentes de producto compartidos.
- `src/components/ui/`: primitives Radix/shadcn; siguen aliases de `components.json`.
- `src/components/animate-ui/`: componentes incorporados desde el registry Animate UI.
- `src/index.css`: Tailwind CSS 4, tokens y estilos globales.

`GameScreenV2` organiza exclusivamente la partida: cabecera compacta con ronda, fase y tiempo; identidad privada reducida y una acción principal por fase. `ClueBoard` muestra autor, avatar, palabra y turno; en votación las pistas se integran en las opciones y no se repite el tablero. En escritorio el chat es lateral; por debajo de 1024 px se abre desde la cabecera como diálogo nativo con foco contenido, cierre por botón/Escape y borrador conservado. El contador local considera IDs nuevos de mensajes y actividad permitida, excluye mensajes propios y se limpia al abrir. No se persiste ni modifica contratos del servidor.

El chat solo deriva actividad de palabras enviadas y votos confirmados, con metadatos locales tipados. Las palabras tienen autor y palabra destacada en un bloque con separadores punteados; los votos públicos muestran autor y objetivo y los ocultos solo “Ha votado”. Los mensajes humanos usan globos y avatares; los fantasmas llevan una franja violeta y la etiqueta “Fantasmas · solo eliminados”. Turnos, preparación, omisiones, eliminaciones y resultados quedan en el tablero. Los mensajes de sistema de texto del servidor se omiten, también al recuperar el snapshot, para evitar duplicados e información redundante; no se analizan nombres ni votos a partir de texto.

`useSocketGameEvents` deriva entradas de actividad únicamente de `wordHintRevealed`/`allWordsSubmitted` y `voteUpdate`. Las asignaciones privadas no entran al chat. Los IDs son estables por ronda/acción/jugador, y se insertan/actualizan por ID. Estas entradas de presentación viven en memoria del cliente: al recuperar se restaura la conversación humana permitida del snapshot, sin el historial de actividad derivado anterior a la reconexión.

`useGameStore.finalResult` conserva el payload final, incluidos los jugadores e `impostorIds`, aunque el siguiente `roomUpdated` restablezca el lobby. `GameEnd` solo revela identidades confirmadas. No infiere roles por supervivencia, votos ni avatar. El backend publica los IDs únicamente en `gameEnded`, antes de limpiar roles. El ganador `innocent` se conserva en el estado del frontend; no cambia el valor del contrato externo.

La continuidad entre rondas mantiene personaje, impostores y eliminados. `roomUpdated` controla número de ronda y participantes; `phaseChanged: word` limpia únicamente interacción de ronda. Tras una victoria se puede revisar `GameEnd` antes de volver al mismo lobby. Ese botón solo navega; `gameStarted` es quien limpia resultado, roles e historial anteriores. La credencial de recuperación se conserva durante todo este ciclo. `totalRounds` permanece en los tipos por compatibilidad y deja de presentarse como límite.

### Integración

- `src/services/socket/`: singleton, emitters y listeners Socket.IO; `src/types/game.ts` define los contratos.
- `src/services/api/client.ts`: instancias Axios pública y autenticada. Solo la segunda añade `Authorization: Bearer <token>` mediante interceptor.
- `src/services/api/auth.ts`: login y registro con JWT a través del cliente público, y validación de sesión con `GET /auth/me` mediante el cliente autenticado.
- `src/services/auth/accessToken.ts`: puente de token entre el store y el interceptor, sin dependencia circular.
- `src/services/api/category.ts`: acceso HTTP a categorías y personajes.
- `src/hooks/`: adaptadores React para socket y visibilidad.

La URL Socket.IO admite `VITE_SOCKET_URL` y HTTP admite `VITE_API_URL`; ambas son independientes.

### Diagnóstico

`src/test` contiene componentes manuales, no tests automatizados. Solo `CompleteFlowTest` se renderiza desde `/test`; los demás archivos no tienen una ruta propia. Al estar bajo `src`, todos participan en lint y compilación de producción.

El diagnóstico prueba un backend real y requiere dos pestañas para dos sockets. No usa mocks, assertions ni fixtures y no ofrece garantía de regresión.

## Estado y persistencia

| Estado | Dueño actual | Persistencia |
| --- | --- | --- |
| Tema | `ThemeProvider` | `localStorage`: `vite-ui-theme` |
| Sesión | `useUserStore` | `sessionStorage`: `characterus.session` (token, claims JWT, usuario y avatar local) |
| Credencial privada de sala | `useRoomSessionStore` | `sessionStorage`: `characterus.room-session` (`roomId`, `playerId`, `resumeToken`) |
| Sala/lobby | `useRoomStore` | Se reconstruye desde el snapshot de `resumeRoom` |
| Partida, roles, votos y chat | `useGameStore` | Se reconstruyen desde el snapshot privado; no se persisten en storage |
| Salas públicas | Array mock temporal | Ninguna |

El `playerId` de la sesión es estable aunque cambie el transporte. Los DTOs públicos todavía lo llaman `socketId`; no usar el nuevo `socket.id` para identificar al jugador local. La credencial de sala no se incorpora a la sala pública, URLs, logs, QR ni a la sesión HTTP.

## Flujo de datos externo

### HTTP

`src/services/api/client.ts` expone dos instancias Axios:

- `publicApi` para rutas sin credenciales, como `POST /api/auth/signup` y `POST /api/auth/login`.
- `authenticatedApi` para rutas protegidas. Su interceptor lee el token actual de sesión y agrega el header Bearer.

El store decodifica el JWT recibido y comprueba `exp` como filtro local. Al restaurar una pestaña, `GET /auth/me` confirma que el token y la cuenta siguen siendo válidos. Esta decodificación no verifica la firma: el backend conserva toda la autoridad de autorización.

`src/services/api/category.ts` expone:

- `GET /api/category`
- `GET /api/category/:id`
- `GET /api/character/category/:categoryId`
- `GET /api/character/random/:categoryId`

La API de autenticación propaga errores HTTP tipados. Los helpers de categorías aún retornan `[]` o `null` ante un fallo.

### Tiempo real

Socket.IO modela creación/unión de sala, actualizaciones de participantes y el juego completo. `useSocketGameEvents` se monta en `App.tsx`; los listeners registran cleanup explícito y el juego no crea fases ni roles localmente. El handshake no lleva JWT: `createRoom` envía el token en su payload y el backend responde con acks tipados, incluidos los códigos de autenticación.

Durante `word`, `wordHintRevealed` inserta o actualiza por `playerId` (el `socketId`, incluidos invitados) y marca al jugador local como enviado. `WordSubmission` muestra inmediatamente el texto y deriva el título y permiso de escritura de `currentTurnPlayerId`; `turnChanged` reemplaza ese ID. `allWordsSubmitted` reemplaza el resumen y limpia el turno; abandonar `word` también limpia el turno. Las pistas se conservan en debate y se limpian al entrar en una nueva fase de personaje/palabras. El input mantiene texto y estado de error hasta el ack de `submitWord`; solo un ack satisfactorio lo vacía. Los listeners globales siguen montados únicamente en `App.tsx` y retiran los mismos callbacks.

`node --test tests/word-flow.test.mjs` ejecuta regresiones focalizadas con los stores, listeners, emitters y handlers reales bajo dependencias de React/socket simuladas. No sustituye una prueba de dos navegadores contra el backend.

El ciclo de inactividad también pertenece al servidor: `roomInactivityWarning` entrega `roomId`, `expiresAt` y `remainingMs` cinco minutos antes del cierre; `renewRoomInactivity` solo puede emitirlo el anfitrión y extiende 40 minutos tras un ack satisfactorio; `roomInactivityRenewed` oculta el aviso para todos. Ante `roomClosed`, el cliente limpia stores y credencial, muestra el motivo y vuelve a `/menu` si mantiene una sesión HTTP autenticada o a `/join` si era visitante.

`createRoomRecovery` registra `connect`, `disconnect` y `connect_error`, emite `resumeRoom` con timeout de 5 segundos y bloquea la UI hasta completar la hidratación de ambos stores y la navegación (`playing` → `/game`; otros estados → `/lobby`). `eventDelivery` descarta los eventos recibidos antes del ack porque quedan cubiertos por el snapshot más reciente; los posteriores se procesan en orden. Los eventos terminales (`roomClosed`, `playerKicked`) se atienden incluso durante la recuperación. Generaciones de intento y la identidad de la credencial impiden que un ack viejo restaure una sesión cancelada.

El snapshot restaura pistas, asignación privada, voto propio, quién votó, preparación, chat permitido y resultados. `hydrateSnapshot` no invoca `setPhase` para evitar borrar las pistas restauradas. Los vencimientos usan `serverTime` como referencia; el contador es solo visual y no avanza fases. `ALREADY_IN_ROOM` consulta `getGameState` y solo admite el mismo `roomId` y `playerId` guardados. Las desconexiones explícitas del servidor requieren reintento manual para evitar que dos conexiones revocadas se recuperen mutuamente en bucle.

`RoomPublic` incluye `name`, pero el payload documentado de `createRoom` no lo recibe. Por tanto, el nombre es actualmente responsabilidad del backend; si debe configurarlo el usuario, el contrato debe añadir un campo explícito.

## Patrones que conviene preservar

- La conexión Socket.IO está centralizada para evitar conexiones accidentales por componente.
- Emitters y listeners están separados por dominio y los listeners exponen cleanup explícito.
- Formularios de login/signup son controlados y presentan validación y atributos de accesibilidad.
- La configuración de sala mantiene la invariante de que el modo presencial sea privado.
- Lobby, filtros de salas y resumen de votos derivan datos de estado existente en lugar de duplicarlos.
- `GameScreen` conserva estado de votación y `VotingPanel` funciona como componente controlado.
- Los timers revisados limpian sus timeouts/intervals al desmontarse.
- Tema y primitives visuales están centralizados.

## Despliegue

- `npm run build` ejecuta primero TypeScript y solo genera `dist/` si esa fase finaliza.
- `BrowserRouter` requiere fallback del hosting hacia `index.html` para accesos directos y recargas.
- El backend debe permitir el origen del frontend y aceptar conexiones WebSocket.
- El plugin de desarrollo `room-invite-network-origin` de Vite inserta un meta con el origen Network y el puerto real del servidor. `RoomInvite` lo utiliza al compartir desde `localhost`; para otros hosts y builds usa `window.location.origin`. Reiniciar Vite al cambiar la configuración y recargar la página al cambiar de red.
- No hay configuración de CI, contenedores, codegen, migraciones ni despliegue en este repositorio.
- `ClassDiagram.mmd` describe un modelo de backend, pero este frontend no permite verificar que coincida con el esquema real de Supabase.
