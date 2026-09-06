# Socket.IO en CharacterUs

Referencia de la infraestructura existente en el frontend. Describe el código actual, no implica que las pantallas de producto ya estén integradas con el backend.

## Alcance actual

- `src/services/socket/socket.ts` crea una instancia singleton de `Socket` al primer `getSocket()`.
- `src/services/socket/emitters/` agrupa emisiones de sala y juego.
- `src/services/socket/listeners/` registra listeners y devuelve funciones de desuscripción.
- `src/hooks/` ofrece wrappers React sobre la conexión, emisión y escucha.
- Las páginas `/create`, `/join`, `/lobby` y `/game` todavía no usan estos servicios.
- `/test` es un diagnóstico manual. Usa `createRoom`, `joinRoom`, `startGame`, `updatePlayers` y `gameStarted` contra un backend real.
- No existe un contrato ni un evento de chat implementado en esta capa.

## Conexión

```env
VITE_SOCKET_URL=http://localhost:3000
```

Si falta la variable, se usa `http://localhost:3000`. La configuración fuerza transporte WebSocket, conecta automáticamente y reintenta sin límite. `disconnectSocket()` elimina la instancia para que el siguiente `getSocket()` cree una nueva.

El cliente configura actualmente `secure: false` y `rejectUnauthorized: false`. Estas opciones y la política de transporte deben revisarse antes de un despliegue HTTPS, no copiarse como una decisión de producción asumida.

## Contratos declarados

Los tipos están en `src/services/socket/types.ts`. Deben sincronizarse con el backend; no hay generación compartida de contratos.

### Emisiones de sala

| Evento | Función | Payload declarado | Ack declarado |
| --- | --- | --- | --- |
| `createRoom` | `emitCreateRoom` | `{ username, categoryId }` | `{ internalId, gamePin }` o error |
| `joinRoom` | `emitJoinRoom` | `{ gamePin, username }` | `{ internalId, room }` o error |
| `leaveRoom` | `emitLeaveRoom` | `{ internalId }` | vacío o error |
| `getRoomInfo` | `emitGetRoomInfo` | `{ internalId }` | `Room` o error |
| `startGame` | `emitters/room.ts` | `{ gamePin, categoryId }` | `{ success, message? }` o error |

### Emisiones de juego

| Evento | Función | Payload emitido |
| --- | --- | --- |
| `startGame` | `emitters/game.ts` | `{ internalId, gamePin, categoryId }` |
| `assignCharacter` | `emitAssignCharacter` | `{ internalId, characterId }` |
| `votePlayer` | `emitVotePlayer` | `{ internalId, targetSocketId }` |
| `endGame` | `emitEndGame` | `{ internalId }` |

Hay dos funciones llamadas `emitStartGame` con contratos distintos. El barrel `src/services/socket/index.ts` reexporta ambas y actualmente produce un error TypeScript por exportación ambigua. Hasta unificar el contrato con el backend, importa explícitamente desde `emitters/room` o `emitters/game` y no adivines cuál corresponde.

### Eventos escuchados por helpers

- Sala: `playerJoined`, `playerLeft`, `roomUpdated`, `roomDeleted`, `roomError`.
- Juego: `gameStarted`, `charactersAssigned`, `playerEliminated`, `voteUpdated`, `gameEnded`, `gameError`.
- El diagnóstico usa además `updatePlayers`, evento que no aparece en los listeners de dominio.

Los listeners retornan una función de cleanup y deben desuscribir exactamente el callback registrado.

## Uso diagnóstico

1. Ejecuta el backend en el origen configurado; la carga de categorías requiere además `GET http://localhost:3000/api/category`.
2. Ejecuta `npm run dev` y abre `/test`.
3. Usa dos pestañas para representar host e invitado; el singleton crea una conexión por pestaña, no dos identidades dentro de una sola pestaña.
4. Selecciona una categoría, crea la sala, copia el PIN en la segunda pestaña, une al invitado e inicia la partida.
5. Revisa los payloads mostrados y la consola. La pantalla no contiene assertions ni produce un resultado automático pass/fail.

## Limitaciones a respetar

- `useSocket()` devuelve `null` en el primer render y llenar su ref no provoca un render nuevo.
- `useSocketConnected()` es un snapshot; no se suscribe a `connect`/`disconnect`.
- Los hooks de listeners dependen de objetos/callbacks y del array `dependencies` por identidad, por lo que callbacks inline pueden provocar altas y bajas en cada render.
- `useSocketEmit()` acepta cualquier nombre de evento y usa `any` para el ack; no conserva la relación tipada evento/payload/respuesta.
- `Map` en `voteUpdated` presupone una forma que Socket.IO/JSON no reconstruye automáticamente como `Map`; debe validarse contra el payload real del backend.
- Los callbacks del diagnóstico esperan en algunos puntos `{ success }`, mientras los tipos de `joinRoom` declaran `{ internalId, room }`. Verifica el backend antes de corregir uno de los lados.

Estas limitaciones están registradas como propuestas, no como autorización para cambiar contratos. Consulta `docs/RECOMMENDATIONS.md`.
