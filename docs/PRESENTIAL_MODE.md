# Modo presencial: contrato pendiente del backend

## Estado

Frontend implementado. El backend todavía debe implementar este contrato: no se simula el avance entre dispositivos. Crear, unirse, recuperación, asignación privada, votación y resultados conservan sus contratos actuales salvo las extensiones descritas aquí. Si se pide presencial y `createRoom` no lo confirma en la sala devuelta, el cliente rechaza la respuesta con un error explícito para no iniciar silenciosamente en línea. El backend debe validar capacidades antes de crear una sala; no ignorar el ajuste desconocido.

## Configuración

Añadir `RoomSettings.playMode: "online" | "in_person"`, con `online` por defecto para salas y clientes antiguos. Es independiente de `mode: classic | anonymous | special`. Validar al crear y conservar el campo en `RoomPublic`, `createRoom`/`joinRoom` acks, `roomUpdated`, `gameStarted` y snapshots de `resumeRoom`/`getGameState`. Una sala en juego no cambia de tipo. No inferir presencial del cliente que emite una acción.

## Turnos de palabras orales

Mantener la fase `word`, el orden de jugadores vivos, `currentTurnPlayerId`, `turnIndex` (el índice del contrato existente) y `turnChanged`. Nadie escribe ni transmite su palabra. El cliente activo pulsa Listo y emite:

```ts
completeTurn: { roomId: string, round: number, turnIndex: number }
// ack existente: {success:true} o {success:false,code,message}
```

El servidor debe validar conexión, membresía por identidad estable, sala presencial, fase `word`, jugador vivo, ronda/índice actuales y que sea su turno. No confiar en un playerId enviado por el navegador. Responder errores claros (`NOT_IN_ROOM`, `INVALID_MODE`, `INVALID_PHASE`, `NOT_YOUR_TURN`, `PLAYER_ELIMINATED`, `STALE_TURN`).

Marcar atómicamente la finalización **una sola vez**, identificada por sala+ronda+índice+jugador. Un reintento de ese mismo jugador para un turno ya confirmado devuelve éxito sin avanzar otra vez; solicitudes antiguas que no correspondan a su confirmación se rechazan. Publicar a todos:

```ts
turnCompleted: {
  playerId: string, username: string,
  round: number, turnIndex: number, skipped: boolean
}
```

Después publicar `turnChanged` con el próximo jugador o `phaseChanged: {phase:"debate"}` al terminar los vivos. El frontend espera esos eventos para avanzar; el ack solo bloquea repetir la confirmación en el turno vigente. No usar `submitWord` con una palabra vacía, inventada o secreta. Rechazar `submitWord` en presencial.

Conservar la duración actual de turnos (60 s en el cliente actual) y emitir `turnCompleted` con `skipped:true` al vencer, antes de avanzar. Desconexión, eliminación o salida deben usar el mismo avance único y no bloquear el turno. Los deadlines y la gracia de recuperación son del servidor; si cambia la duración, extender `turnChanged` para comunicar el deadline en vez de modificar solo el timer del cliente.

## Debate y actividad

Debate oral, sin chat (tampoco canal de fantasmas). Rechazar `sendChatMessage` en presencial y no emitir `chatMessage` a esa sala. Mantener `debateReady`/`debateReadyUpdate` y la duración existente de debate; todos los vivos listos o vencimiento conducen a votación según la lógica actual. Las palabras orales no se registran.

La columna Actividad del frontend deriva estado público: fase/turno, turnos completados, votos permitidos por privacidad y resultados. No necesita un evento de chat nuevo ni textos del servidor analizados por el cliente.

## Votos y resultados

Conservar `votePlayer`, `voteUpdate`, `playerEliminated`, `roundResults` y `gameEnded`. Solo votan los vivos; validar objetivo, fase y voto duplicado. Mantener `visibleVotes`: cuando está apagado, el DTO no debe incluir objetivos ni identidades que el contrato actual oculta. Mostrar el resultado de ronda y revelar impostores únicamente según los eventos públicos autorizados. Conservar reglas actuales de empate, paridad, continuación y retorno al lobby.

## Recuperación y nueva ronda

Añadir `completedTurns: TurnCompleted[]` del ciclo actual a `RoomSnapshot`; restaurar también tipo de partida, ronda, turno/índice, deadlines y preparación de debate/voto. `hasSubmittedWord` significa “turno propio ya completado” en presencial (compatibilidad con el campo existente). En presencial `wordHints` y el historial de conversación deben estar vacíos. Reiniciar completados y el indicador propio al empezar una nueva fase `word`; mantenerlos en debate/votación para el resumen. Los resultados históricos siguen en `roundResults`. Las actualizaciones deben llegar después de aplicar el snapshot, conservando el control de entrega existente.

## Pruebas del servidor necesarias

- Dos navegadores: anfitrión/invitado, mismo tipo y turno antes/después de recargar.
- Repetición/doble clic, ack perdido y reintento: un único avance.
- Ronda/índice antiguos, otro jugador, eliminado, intruso, sala en línea.
- Vencimiento, salida y reconexión durante confirmación: sin turno bloqueado ni doble avance.
- Último vivo por hablar → debate → votos → resultados → siguiente ronda/lobby.
- Chat/palabras escritas rechazados; roles y objetivos ocultos ausentes de DTOs/snapshots.
