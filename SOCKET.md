# Socket.IO en CharacterUs

Referencia de la integración Socket.IO actual. Los contratos de esta capa se alinean con `backend.md`.

## Alcance actual

- `src/services/socket/socket.ts` crea una instancia singleton de `Socket` al primer `getSocket()`.
- `src/types/game.ts` es la fuente única de tipos de dominio Socket.IO.
- `src/services/socket/emitters/` y `listeners/` separan las emisiones de las suscripciones.
- Las pantallas V2 `/create`, `/join`, `/lobby` y `/game` usan esta capa.
- `useSocketGameEvents` se monta en `App.tsx` para no perder eventos, como `characterAssigned`, durante la navegación a `/game`.
- `/test` es un diagnóstico manual y debe usar este mismo contrato.

## Conexión

El acceso con Google intercambia primero la credencial por un JWT de CharacterUs mediante HTTP (`POST /api/auth/google`). Socket.IO sigue recibiendo exclusivamente el JWT de CharacterUs donde el contrato lo exige, con `user.username` del backend; nunca recibe el ID token de Google. `VITE_GOOGLE_CLIENT_ID` configura solo el botón de identidad, sin modificar la conexión socket.

```env
VITE_SOCKET_URL=http://localhost:3000
```

Si falta la variable, se usa `http://localhost:3000`. La configuración fuerza `transports: ["websocket"]`, conecta automáticamente y reintenta sin límite ante fallos de transporte. Una desconexión explícita del servidor no dispara otro `connect()` automático: puede revocar una conexión reemplazada y requiere reintento manual. `disconnectSocket()` elimina la instancia para que el siguiente `getSocket()` cree una nueva.

## Contratos declarados

No hay generación compartida de contratos. Al cambiar el backend se debe actualizar `src/types/game.ts`, sus emitters y listeners asociados.

Todos los acknowledgements responden con una de estas formas:

```ts
{ success: true, data?: T }
{ success: false, message: string, code: string }
```

### Emisiones de sala

| Evento | Función | Payload | Ack |
| --- | --- | --- | --- |
| `createRoom` | `emitCreateRoom` | `{ username, token, settings }` | `Ack<{ room, session }>` |
| `joinRoom` | `emitJoinRoom` | `{ code, username, token?, password? }` | `Ack<{ room, session }>` |
| `leaveRoom` | `emitLeaveRoom` | `{ roomId }` | `Ack<void>` |
| `startGame` | `emitStartGame` | `{ roomId }` | `Ack<{ room }>` |
| `kickPlayer` | `emitKickPlayer` | `{ roomId, targetId }` | `Ack<void>` |
| `debateReady` | `emitDebateReady` | `{ roomId }` | `Ack<void>` |
| `changeAvatar` | `emitChangeAvatar` | `{ roomId, avatarId }` | `Ack<void>` |
| `renewRoomInactivity` | `emitRenewRoomInactivity` | `{ roomId }` | `Ack<{ expiresAt }>` |
| `resumeRoom` | Controlador global de recuperación | `{ roomId, resumeToken }` | `Ack<RoomSnapshot>` (timeout 5 s) |
| `getGameState` | Sincronización de conexión ya vinculada | `{ roomId }` | `Ack<RoomSnapshot>` (timeout 5 s) |

`Room.id` es el UUID para acciones posteriores; `Room.code` es el PIN numérico de seis dígitos para unirse.

`session` contiene `{ roomId, playerId, resumeToken }` y se guarda exclusivamente en `sessionStorage` por pestaña (`characterus.room-session`). `playerId` permanece estable tras recargar aunque el DTO lo llame `socketId`. La recuperación nunca utiliza el nuevo ID de transporte para localizar al jugador. No loguear acks completos de creación/unión porque incluyen una credencial privada.

En cada `connect`, si hay credencial, se emite `resumeRoom` después de registrar listeners de sala y juego. Mientras espera, la pantalla “Recuperando partida” bloquea rutas y acciones. Los paquetes previos al ack se descartan; el snapshot se aplica sin intercalar otros paquetes y después se procesan los eventos siguientes. Se restaura el estado privado de personaje, pistas, voto propio, votantes, preparación, chat, resultados, ronda y vencimientos. Nunca se recupera usando `joinRoom` ni se vuelve a emitir `startGame`.

Un timeout o error transitorio conserva la credencial. `INVALID_SESSION` y `ROOM_NOT_FOUND` limpian la credencial y vuelven a `/join`; `ALREADY_IN_ROOM` intenta `getGameState` y solo acepta la misma identidad guardada. `NOT_IN_ROOM` o un snapshot de otra identidad muestran error sin reemplazar la sesión. Salir con ack satisfactorio, `playerKicked` del jugador local o `roomClosed` limpian credencial y stores. La gracia del backend es de 60 segundos desde la desconexión; los contadores nunca se reinician en el cliente.

`joinRoom` acepta un `token` opcional. Sin token, el backend registra al jugador como invitado y solo le permite unirse por código y participar de esa partida. El cliente nunca envía `isGuest` ni `userId`: el servidor los deriva de la sesión validada.

La ruta `/join/:code` y el QR del lobby usan este mismo `joinRoom`: omiten la escritura del código y solicitan nombre al invitado. Si el servidor rechaza por contraseña, se solicita y se reenvía conservando código y nombre. El enlace no contiene contraseña ni token y no omite la validación de acceso del backend.

### Emisiones de juego

| Evento | Función | Payload |
| --- | --- | --- |
| `submitWord` | `emitSubmitWord` | `{ roomId, word }` |
| `votePlayer` | `emitVotePlayer` | `{ roomId, targetId }` |
| `sendChatMessage` | `emitSendChatMessage` | `{ roomId, message }` |

### Palabras por turno

La asignación `characterAssigned` dura toda la partida. Sin ganador, la secuencia es `results` (5 segundos) → `roomUpdated` con nueva ronda y eliminados conservados → `phaseChanged: word` → `turnChanged` para cada vivo. Entrar en palabras limpia pistas, envío, votos, preparación y resultado de eliminación de la ronda anterior, conservando identidad privada. `totalRounds` sigue en el payload por compatibilidad; no determina el final ni se ofrece como límite en la UI.

Con ganador, `gameEnded` se guarda antes del `roomUpdated` de lobby. El frontend muestra el resultado y una acción “Volver al lobby”, sin emitir `leaveRoom`, desconectar ni borrar la sesión de sala. Si llega una sala `waiting` sin resultado guardado, navega directamente al lobby. El anfitrión reinicia mediante el mismo `startGame`: `gameStarted` limpia la partida anterior antes de recibir la nueva asignación. Los inocentes ganan al eliminar a todos los impostores; los impostores ganan al alcanzar paridad, según el servidor.

`submitWord` recibe una palabra de 1 a 20 caracteres después de `trim()` y un ack de éxito/error. El emisor espera hasta 5 segundos: el input no se vacía ni se marca enviado antes de confirmar éxito. Ante rechazo, la UI muestra `message` y conserva el texto; ante timeout pide revisar el estado de partida. Errores del servidor: `INVALID_PAYLOAD`, `INVALID_WORD`, `ROOM_NOT_FOUND`, `PLAYER_NOT_FOUND`, `INVALID_PHASE`, `PLAYER_NOT_ALIVE`, `INVALID_TURN` y `ALREADY_SUBMITTED`.

El servidor publica a todos, incluido el autor, `wordHintRevealed: { playerId, username, word, skipped }` y después `turnChanged: { playerId, username, turnIndex, total }`. `playerId` es siempre el `socketId`. Cada pista se muestra de inmediato durante `word` y se inserta/actualiza por ese ID. El evento del propio jugador deshabilita su input aunque el ack aún esté en tránsito.

Al terminar el último turno llegan `allWordsSubmitted: { hints }` y `phaseChanged: { phase: "debate" }`. El frontend reemplaza las pistas, limpia el turno y las mantiene visibles durante debate. Solo las limpia al comenzar otra ronda. Al vencer los 60 segundos del turno, el backend publica `"Sin palabra"` con `skipped: true` y avanza; el cliente no genera esa transición por su cuenta.

### Chat y actividad durante la partida

El panel permanece montado en todas las fases, lateral en escritorio y dentro de un diálogo desplegable en móvil. Cerrarlo conserva el borrador; el badge cuenta nuevas entradas permitidas por ID, excluye las propias y se limpia al abrir. Esta interacción es local y no añade eventos al protocolo. `sendChatMessage` solo se emite durante `debate` y `voting`, como permite el backend. El cliente espera el ack hasta 5 segundos, conserva el borrador ante rechazo/timeout y presenta el error (incluido `FLOOD_LIMIT`). No inserta un mensaje optimista: espera `chatMessage`, evitando ecos duplicados. Los mensajes `ghost` siguen limitados a eliminados por el servidor y también se filtran al presentar.

Solo `wordHintRevealed`/`allWordsSubmitted` (sin omisiones) y `voteUpdate` producen entradas locales de actividad con ID estable y metadatos `activity` exclusivos del frontend. La palabra identifica autor y texto; el voto público identifica votante y objetivo, mientras el oculto muestra solo “Ha votado”. No se interpretan nombres desde mensajes de texto. `chatMessage` conserva únicamente conversación humana y fantasmas: sus mensajes `system` se descartan para evitar duplicados, igual que los `system` del snapshot. Turnos, preparación, eliminaciones y resultados quedan en la pantalla principal. Estas entradas locales no cambian el protocolo ni se reenvían al backend; se pierden al recuperar la sesión.

### Revelación final

`gameEnded` incluye `{ winner: "innocent" | "impostor", rounds, players, impostorIds: string[] }`. El backend vecino agrega `impostorIds` antes de restablecer los roles y solo en este evento final. `RoomPublic`/`PlayerPublic` siguen sin exponer roles. El frontend conserva el resultado final separado del lobby, conserva `innocent` también en su estado interno y muestra nombres y avatares en grande. El campo se acepta como opcional para compatibilidad con servidores anteriores; si falta, solo se muestran identidades conocidas, sin inferirlas. El parche coordinado está en `docs/backend-game-reveal.patch`.

### Eventos escuchados

- Sala: `roomUpdated`, `playerJoined`, `playerLeft`, `playerKicked`, `roomClosed`, `roomInactivityWarning`, `roomInactivityRenewed`. `roomUpdated` también se emite tras un cambio de avatar.
- Juego: `gameStarted`, `characterAssigned`, `phaseChanged`, `turnChanged`, `wordHintRevealed`, `allWordsSubmitted`, `debateReadyUpdate`, `voteUpdate`, `playerEliminated`, `roundResults`, `gameEnded`, `chatMessage`, `reconnectTimeout`.

Los listeners retornan una función de cleanup y desuscriben el mismo callback que registraron.

El contrato actual de `changeAvatar` se verificó en `character-us-server/src/sockets/handlers/room.handlers.ts`: usa `avatarId` (`avatar-1` a `avatar-8`), valida disponibilidad y emite la sala completa en `roomUpdated`. La UI refleja ese estado confirmado y propaga errores del ack (incluidos `AVATAR_TAKEN`, `INVALID_AVATAR`, `GAME_IN_PROGRESS` y `GUEST_ACTION_FORBIDDEN`). El emisor deja de esperar después de 10 segundos y permite reintentar. El servidor asigna un avatar aleatorio disponible al crear/unirse; el avatar de perfil no determina el de sala.

## Uso diagnóstico

1. Inicia sesión en la pestaña anfitriona; el diagnóstico toma username y token de `useUserStore`.
2. Ejecuta el backend en el origen configurado; la carga de categorías requiere `GET /api/category`.
3. Ejecuta `npm run dev` y abre `/test` en dos pestañas.
4. Selecciona una categoría UUID, crea una sala, copia el código en la segunda pestaña, une al invitado e inicia la partida.
5. Revisa los payloads y la consola. La pantalla no contiene assertions ni produce un resultado automático pass/fail.

## Límites de seguridad y recuperación

- Los roles y el personaje son privados y autoritativos: `characterAssigned.character` es `null` para el impostor y el cliente nunca intenta obtenerlo.
- `visibleVotes` decide la presentación: con `false` se muestra que un jugador votó, no su objetivo.
- La UI restringe `/menu`, `/create`, `/public-rooms` y `/profile` a una sesión autenticada; un visitante solo inicia el flujo Socket.IO con `joinRoom` desde `/join`. El backend debe seguir validando el token de `createRoom`, pues los controles de ruta del cliente no sustituyen la autorización del servidor.
- Cinco minutos antes del timeout, `roomInactivityWarning` envía `{ roomId, expiresAt, remainingMs }`. El frontend muestra el contador sin cerrar la sala por cuenta propia y solo muestra la acción de renovación al anfitrión. `renewRoomInactivity` responde con `{ success: true, data: { expiresAt } }` o los códigos `NOT_HOST`, `ROOM_NOT_WAITING` y `ROOM_NOT_FOUND`; `roomInactivityRenewed` oculta el aviso para todos y `roomClosed` limpia el estado con el `reason` enviado por el backend.
- El socket no se autentica durante el handshake. La sesión JWT HTTP se persiste por pestaña en `sessionStorage`, se valida con `GET /api/auth/me` y se envía exclusivamente en `createRoom.token`; no se adjunta a query string, logs ni `auth` del handshake. El backend valida token, usuario, emisor y audiencia antes de crear la sala.
- `AUTH_REQUIRED` y `AUTH_INVALID` limpian la sesión y redirigen a login. `USERNAME_MISMATCH` nunca debe resolverse con un input editable: el cliente usa siempre `session.user.username`.
- `resumeRoom` permite recuperar cuentas e invitados durante la gracia de 60 segundos del backend, sin crear un segundo jugador. La credencial no autentica HTTP ni habilita otras funciones de cuenta. Las salas viven en un único proceso; reiniciar el backend o vencer la gracia impide recuperar la sesión.
