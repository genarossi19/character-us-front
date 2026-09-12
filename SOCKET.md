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

```env
VITE_SOCKET_URL=http://localhost:3000
```

Si falta la variable, se usa `http://localhost:3000`. La configuración fuerza `transports: ["websocket"]`, conecta automáticamente y reintenta sin límite. `disconnectSocket()` elimina la instancia para que el siguiente `getSocket()` cree una nueva.

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
| `createRoom` | `emitCreateRoom` | `{ username, token, settings, avatarUrl? }` | `Ack<{ room }>` |
| `joinRoom` | `emitJoinRoom` | `{ code, username, isGuest, avatarUrl?, userId?, password? }` | `Ack<{ room }>` |
| `leaveRoom` | `emitLeaveRoom` | `{ roomId }` | `Ack<void>` |
| `startGame` | `emitStartGame` | `{ roomId }` | `Ack<{ room }>` |
| `kickPlayer` | `emitKickPlayer` | `{ roomId, targetId }` | `Ack<void>` |
| `debateReady` | `emitDebateReady` | `{ roomId }` | `Ack<void>` |
| `changeAvatar` | `emitChangeAvatar` | `{ roomId, avatarUrl }` | `Ack<void>` |

`Room.id` es el UUID para acciones posteriores; `Room.code` es el PIN numérico de seis dígitos para unirse.

### Emisiones de juego

| Evento | Función | Payload |
| --- | --- | --- |
| `submitWord` | `emitSubmitWord` | `{ roomId, word }` |
| `votePlayer` | `emitVotePlayer` | `{ roomId, targetId }` |
| `sendChatMessage` | `emitSendChatMessage` | `{ roomId, message }` |

### Eventos escuchados

- Sala: `roomUpdated`, `playerJoined`, `playerLeft`, `playerKicked`, `roomClosed`. `roomUpdated` también se emite tras un cambio de avatar.
- Juego: `gameStarted`, `characterAssigned`, `phaseChanged`, `turnChanged`, `wordHintRevealed`, `allWordsSubmitted`, `debateReadyUpdate`, `voteUpdate`, `playerEliminated`, `roundResults`, `gameEnded`, `chatMessage`, `reconnectTimeout`.

Los listeners retornan una función de cleanup y desuscriben el mismo callback que registraron.

## Uso diagnóstico

1. Inicia sesión en la pestaña anfitriona; el diagnóstico toma username y token de `useUserStore`.
2. Ejecuta el backend en el origen configurado; la carga de categorías requiere `GET /api/category`.
3. Ejecuta `npm run dev` y abre `/test` en dos pestañas.
4. Selecciona una categoría UUID, crea una sala, copia el código en la segunda pestaña, une al invitado e inicia la partida.
5. Revisa los payloads y la consola. La pantalla no contiene assertions ni produce un resultado automático pass/fail.

## Límites de seguridad y recuperación

- Los roles y el personaje son privados y autoritativos: `characterAssigned.character` es `null` para el impostor y el cliente nunca intenta obtenerlo.
- `visibleVotes` decide la presentación: con `false` se muestra que un jugador votó, no su objetivo.
- El socket no se autentica durante el handshake. La sesión JWT HTTP se persiste por pestaña en `sessionStorage`, se valida con `GET /api/auth/me` y se envía exclusivamente en `createRoom.token`; no se adjunta a query string, logs ni `auth` del handshake. El backend valida token, usuario, emisor y audiencia antes de crear la sala.
- `AUTH_REQUIRED` y `AUTH_INVALID` limpian la sesión y redirigen a login. `USERNAME_MISMATCH` nunca debe resolverse con un input editable: el cliente usa siempre `session.user.username`.
- El backend no define todavía un reingreso de sala desde una página recargada. El aviso `reconnectTimeout` se muestra durante la partida, pero no reemplaza ese contrato pendiente.
