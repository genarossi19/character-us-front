# Arquitectura del frontend

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
- Los avatares de sala se reciben del backend: `useRoomStore.setRoom` sincroniza `room.players`, `players` y `currentPlayer`. El selector deriva su selección de `currentPlayer.avatarUrl`, espera el ack de `changeAvatar` y muestra sus errores; no sobrescribe `roomUpdated` con una selección local pendiente.
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

`GameScreenV2` organiza exclusivamente la partida: cabecera con fases y ronda, tablero desplazable y chat permanente. En pantallas pequeñas, el chat se apila debajo del tablero. `RoleCard` conserva la asignación privada durante palabras, debate y votación; `ClueBoard` muestra autor, avatar, palabra y estado de turno, incluso si el autor de una pista aceptada abandona la sala. `DebatePhase` conserva la acción de marcar listo y `VotingPhase` muestra las pistas al elegir un voto.

`useSocketGameEvents` deriva entradas de actividad solo de eventos públicos confirmados de turno, pistas, preparación, eliminación y fin. Las asignaciones privadas no entran al chat; fases de debate/votación y votos conservan los mensajes del servidor sin duplicarlos. Los IDs de actividad son estables por ronda/acción/jugador, y los mensajes se insertan/actualizan por ID. Estas entradas de presentación viven en memoria del cliente: el snapshot recupera el chat del servidor, no el historial derivado anterior a la reconexión.

`useGameStore.finalResult` conserva el payload final, incluidos los jugadores e `impostorIds`, aunque el siguiente `roomUpdated` restablezca el lobby. `GameEnd` solo revela identidades confirmadas. No infiere roles por supervivencia, votos ni avatar. El backend publica los IDs únicamente en `gameEnded`, antes de limpiar roles. El ganador `innocent` se normaliza a `crew` en el adaptador del frontend; no cambia el valor del contrato externo.

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

El ciclo de inactividad también pertenece al servidor: `roomInactivityWarning` entrega `roomId`, `expiresAt` y `remainingMs` cinco minutos antes del cierre; `renewRoomInactivity` solo puede emitirlo el anfitrión y extiende 40 minutos tras un ack satisfactorio; `roomInactivityRenewed` oculta el aviso para todos. Ante `roomClosed`, el cliente limpia stores y credencial, muestra el motivo y vuelve a `/join`.

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
