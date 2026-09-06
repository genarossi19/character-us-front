# Recomendaciones técnicas

Hallazgos del 5 de septiembre de 2026. Son propuestas para discutir y priorizar; no se aplicaron cambios funcionales ni de estructura durante la auditoría.

## Estado de verificación

Con Node.js `v24.12.0` y las dependencias instaladas:

- `npm run lint`: falla con 12 errores y 2 warnings.
- `npm run build`: falla durante `tsc -b`; Vite no llega a generar el bundle.
- No existe `npm test` ni una suite automatizada.

Los errores no provienen de un único punto. Incluyen contratos de props incompatibles, aliases TypeScript no resueltos, exports duplicados, tipos incompletos en diagnósticos, imports/variables sin uso y reglas ESLint de Fast Refresh sobre primitives compartidas.

## Prioridad 0: recuperar una base verificable

1. Corregir la ubicación de `baseUrl` y `paths` en `tsconfig.app.json`: hoy están fuera de `compilerOptions`, mientras Vite sí conoce el alias `@`. Esta diferencia bloquea imports válidos en desarrollo.
2. Resolver los contratos obsoletos entre `App.tsx` y `CreateRoomPage`, `QuickJoinScreen` y `GameScreen`. Primero decidir si `App` controla el flujo o si cada página es autónoma; no silenciar props sin decidir `create -> lobby -> game` frente a `create -> game`.
3. Unificar los dos exports `emitStartGame` de `emitters/room.ts` y `emitters/game.ts` después de confirmar el payload real del backend. El barrel actual no compila por nombre ambiguo.
4. Decidir si `src/test` debe seguir dentro del build de producción. `CreateRoomTest.tsx` ya incumple el `CreateRoomPayload` que exige `categoryId`.
5. Resolver errores directos restantes: setter sin uso en `App.tsx`, evento con `any` implícito en `CreateRoomPage`, imports React sin uso y `any` explícitos.
6. Ajustar ESLint para los archivos generados/compartidos de shadcn y Animate UI, o separar sus exports no-componentes. Aplicar una convención consciente en vez de editar cada vendor primitive sin necesidad.

## Prioridad 1: integrar una sala real

1. Definir un modelo canónico para sala, jugador, identidad de cuenta, identidad de socket, configuración y fase. Actualmente hay formas incompatibles en `App.tsx`, `WaitingRoom.tsx`, `GameScreen.tsx`, `VotingPanel.tsx`, `services/socket/types.ts` y los diagnósticos.
2. Acordar qué estado es autoritativo en el backend, qué es UI local y cómo se recupera una sesión después de refresh o reconexión.
3. Hacer que la ruta represente una sala real o documentar por qué la identidad queda implícita. Hoy `/game/:id` se enlaza, pero solo `/game` existe.
4. Reconciliar destinos inexistentes: `/profile`, `/results` y `/voting-screen`.
5. Conectar progresivamente las páginas a la capa de integración. Empezar por un corte vertical verificable `crear/unirse -> lobby`, no por un store global que replique todos los mocks.
6. No asignar personaje o rol aleatoriamente en el cliente una vez conectado al backend; son datos privados y autoritativos del servidor.

## Prioridad 1: robustecer Socket.IO

1. Compartir o generar contratos de eventos con el backend para que nombre, payload y ack no diverjan. Hoy el diagnóstico usa `updatePlayers`, los helpers declaran `playerJoined`, y `joinRoom` se interpreta con respuestas distintas.
2. Hacer reactivos `useSocket()` y `useSocketConnected()` antes de usarlos como fuente de UI. Actualmente el primero entrega `null` inicialmente sin rerender y el segundo solo toma un snapshot.
3. Evitar churn de listeners por identidades nuevas en cada render y conservar el cleanup exacto ya implementado.
4. Tipar evento, payload y ack como una relación, eliminando strings libres y `any` en `useSocketEmit()`.
5. Validar el payload de votos: un `Map` no se rehidrata automáticamente desde datos serializados.
6. Revisar transporte solo WebSocket, reintentos infinitos y opciones TLS antes de producción.
7. Diseñar eventos de chat, historial, identidad de mensaje y reconexión; hoy el chat de la UI no utiliza Socket.IO.

## Prioridad 1: consolidar juego y chat

1. Modelar transiciones de ronda de forma explícita. `phase`, panel abierto, habilitación, timers, votos y eliminado pueden quedar en combinaciones contradictorias.
2. Definir reglas de empate antes de cambiar el algoritmo. El código actual elimina al primer jugador con máximo incluso si hay empate.
3. Actualizar participantes al eliminar a alguien; al continuar, hoy reaparece disponible y vivo.
4. Eliminar la doble generación de mensajes de entrada en `GameScreen` y `ChatComponent` cuando se decida qué capa interpreta eventos.
5. Mantener identidad real del remitente en el dato y derivar la etiqueta `Tú` solo al renderizar.

## Prioridad 2: separar prototipo y producto

1. Renombrar o aislar `src/test` como diagnóstico/devtool, proteger `/test` en producción o convertir escenarios críticos en tests reales.
2. Marcar o implementar affordances sin efecto: recordar sesión, recuperación de contraseña, OAuth, términos y guardar borrador.
3. Revisar componentes y hooks sin consumidores (`ResultsOverlay`, `CategorySelector` y parte de la capa Socket.IO) antes de eliminarlos; pueden ser integración en progreso.
4. Estandarizar imports de animación. `PublicRooms.tsx` importa `framer-motion` aunque solo `motion` es dependencia directa.
5. Resolver la navegación de salas públicas y el formato exacto del PIN. `type="number"` con `maxLength` no garantiza seis dígitos.
6. Adaptar `GameScreen` a móvil: el chat fijo de `w-96` compite con el tablero dentro de `h-screen` sin breakpoint.
7. Configurar la base HTTP por entorno y definir una estrategia de error que diferencie lista vacía de fallo de red.

## Pruebas sugeridas

Cuando el build vuelva a estar verde, introducir primero cobertura sobre límites de alto riesgo:

- Contratos de reducers o estado de sala/ronda.
- Empates, eliminación y condición de fin de partida.
- Registro y cleanup de listeners bajo `StrictMode` y reconexión.
- Flujos de crear/unirse con servidor de Socket.IO controlado.
- Navegación directa/refresh con identidad de sala.

Hasta entonces, `/test` sirve solo para exploración manual y no debe describirse como evidencia de regresión.
