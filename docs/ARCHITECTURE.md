# Arquitectura del frontend

## Puntos de entrada

| Área | Código |
| --- | --- |
| Router, listeners globales y recuperación | [`src/App.tsx`](../src/App.tsx) |
| Login, registro, creación, unión, lobby y partida | [`src/pages/`](../src/pages/), pantallas V2 |
| HTTP | [`src/services/api/`](../src/services/api/), Axios público y autenticado |
| Socket.IO | [`src/services/socket/`](../src/services/socket/), conexión única, emitters y listeners |
| Tipos del protocolo | [`src/types/game.ts`](../src/types/game.ts) |
| Acciones y listeners de React | [`src/hooks/`](../src/hooks/), `useSocketRoom`, `useSocketRoomEvents`, `useSocketGame`, `useRoomRecovery` |

Las pantallas V2 activas consumen REST y Socket.IO. `/public-rooms` muestra un listado simulado y usa la unión real por código. Las pantallas V1 son prototipos. `/test` monta un diagnóstico manual.

## Estado e identidad

| Dueño | Responsabilidad |
| --- | --- |
| `useUserStore` | Sesión JWT por pestaña en `sessionStorage` (`characterus.session`) |
| `useRoomSessionStore` | Credencial privada por pestaña (`characterus.room-session`) |
| `useRoomStore` | Sala, jugadores y preparación |
| `useGameStore` | Fase, turno, asignación privada, pistas, votos, chat y resultados |

- Login, registro y Google devuelven la misma sesión de CharacterUs. El token de Google solo se envía por HTTP en `POST /api/auth/google`; el cliente autenticado usa el JWT de CharacterUs y valida la restauración con `GET /api/auth/me`. El SDK de Google se inicializa una vez y retira el callback al desmontar.
- Los invitados se unen por código. Los usuarios envían el JWT en `createRoom` o `joinRoom` según corresponda. La recuperación de sala no habilita funciones de cuenta.
- `Room.id` identifica acciones; `Room.code` identifica invitaciones. `Player.socketId` es el ID estable del jugador. La conexión Socket.IO tiene su propio `socket.id`.

## Recuperación

`roomRecovery.ts` pide `resumeRoom` al conectar y espera el snapshot antes de desbloquear acciones. `eventDelivery.ts` descarta eventos previos cubiertos por el snapshot y procesa los posteriores en orden. `roomClosed` y `playerKicked` se atienden incluso durante la espera. Un ACK previo no puede restaurar una sesión invalidada. Si la conexión ya está vinculada, `getGameState` solo se acepta para la misma sala y jugador.

Los timeouts transitorios conservan la credencial. `INVALID_SESSION`, `ROOM_NOT_FOUND`, cierre, expulsión propia y salida confirmada la limpian. El backend conserva el jugador 60 s tras desconectarse. Los plazos restaurados se muestran con referencia a `serverTime`; el cliente espera eventos para avanzar.

## Lobby y partida

- La preparación y la pertenencia se sincronizan con `roomUpdated`. `gameStarted` abre la partida. La selección de avatar anticipa solo la vista local y revierte ante rechazo, salvo que el servidor ya haya confirmado el cambio.
- En línea, las pistas llegan por `wordHintRevealed`. En presencial, el ACK de creación debe confirmar `playMode: "in_person"`. `completeTurn` confirma el turno oral y `turnCompleted` registra actividad. Solo `turnChanged` y `phaseChanged` avanzan la vista. `mode`, `playMode` y privacidad son independientes.
- El chat muestra conversación humana y mensajes de fantasmas autorizados. La actividad deriva de eventos estructurados y los mensajes `system` se descartan para evitar duplicados. En presencial, la columna muestra actividad pública sin chat.
- Una nueva ronda limpia la interacción del ciclo y conserva roles, personaje y eliminados. `gameEnded` conserva el resultado y los impostores revelados aunque llegue el estado de lobby. Volver al lobby solo navega; el siguiente `gameStarted` limpia el resultado. `totalRounds` se conserva por compatibilidad.

Los payloads y el orden de entrega se documentan en el [contrato del servidor](https://github.com/genarossi19/character-us-server/blob/developer/frontend.md). Contrastá los cambios con el backend local.
