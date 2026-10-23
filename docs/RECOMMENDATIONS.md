# Recomendaciones técnicas

Hallazgos del 5 de septiembre de 2026. La integración inicial posterior unificó los contratos Socket.IO en `src/types/game.ts`, conectó el flujo V2 y añadió JWT para login/registro; los puntos pendientes siguen vigentes cuando apliquen.

## Estado de verificación

Login con Google: implementado con Google Identity Services, `POST /auth/google` y sesión por pestaña existente. La prueba real requiere `VITE_GOOGLE_CLIENT_ID`, backend configurado, migración aplicada y origen autorizado. Ver `docs/GOOGLE_LOGIN.md`. No vincular cuentas ante `409` ni reemplazar el username del juego por el nombre de Google.

Con Node.js `v24.12.0` y las dependencias instaladas, verificado el 10 de septiembre de 2026:

- `npm run lint`: falla con 11 errores y 2 warnings.
- `npm run build`: falla durante `tsc -b` con 7 errores preexistentes; Vite no llega a generar el bundle.
- No existe `npm test`. Posteriormente se añadió una regresión automatizada focalizada: `node --test tests/word-flow.test.mjs`.

Los errores no provienen de un único punto. Incluyen contratos de props incompatibles, aliases TypeScript no resueltos, exports duplicados, tipos incompletos en diagnósticos, imports/variables sin uso y reglas ESLint de Fast Refresh sobre primitives compartidas.

## Prioridad 0: recuperar una base verificable

1. Corregir la ubicación de `baseUrl` y `paths` en `tsconfig.app.json`: hoy están fuera de `compilerOptions`, mientras Vite sí conoce el alias `@`. Esta diferencia bloquea imports válidos en desarrollo.
2. Resolver los contratos obsoletos entre `App.tsx` y `CreateRoomPage`, `QuickJoinScreen` y `GameScreen`. Primero decidir si `App` controla el flujo o si cada página es autónoma; no silenciar props sin decidir `create -> lobby -> game` frente a `create -> game`.
3. Mantener los diagnósticos bajo el contrato canónico cuando el backend evolucione; no introducir payloads Socket.IO alternativos.
4. Decidir si `src/test` debe seguir dentro del build de producción. `CreateRoomTest.tsx` ya incumple el `CreateRoomPayload` que exige `categoryId`.
5. Resolver errores directos restantes: setter sin uso en `App.tsx`, evento con `any` implícito en `CreateRoomPage`, imports React sin uso y `any` explícitos.
6. Ajustar ESLint para los archivos generados/compartidos de shadcn y Animate UI, o separar sus exports no-componentes. Aplicar una convención consciente en vez de editar cada vendor primitive sin necesidad.

## Prioridad 1: integrar una sala real

1. Mantener `src/types/game.ts` como el modelo canónico para el flujo V2. Los componentes V1 siguen siendo prototipo aislado.
2. Conservar el límite de acceso actual: visitantes sin sesión solo se unen con código; el backend debe rechazar cualquier creación de sala sin un JWT válido aunque se eludan rutas del cliente.
3. Mantener el contrato de recuperación ya implementado: credencial privada por pestaña, identidad estable, snapshot previo a habilitar acciones y limpieza solo ante invalidación definitiva o salida explícita exitosa.
4. Hacer que la ruta represente una sala real o documentar por qué la identidad queda implícita. Hoy `/game/:id` se enlaza, pero solo `/game` existe.
5. Reconciliar destinos inexistentes: `/results` y `/voting-screen`.
6. Cuando el backend publique una lista de salas, reemplazar el mock de `/public-rooms` sin mezclar su modelo local con los tipos de sala.
7. Definir cómo se asigna `RoomPublic.name`: el contrato actual lo devuelve, pero `createRoom` no acepta un nombre de sala.
8. No asignar personaje o rol aleatoriamente en el cliente una vez conectado al backend; son datos privados y autoritativos del servidor.

## Prioridad 1: robustecer Socket.IO

1. Compartir o generar contratos de eventos con el backend para que nombres, payloads y acknowledgements no vuelvan a divergir.
2. Hacer reactivos `useSocket()` y `useSocketConnected()` antes de usarlos como fuente de UI. Actualmente el primero entrega `null` inicialmente sin rerender y el segundo solo toma un snapshot.
3. Evitar churn de listeners por identidades nuevas en cada render y conservar el cleanup exacto ya implementado.
4. Tipar evento, payload y ack como una relación, eliminando strings libres y `any` en `useSocketEmit()`.
5. Validar el payload de votos: un `Map` no se rehidrata automáticamente desde datos serializados.
6. Revisar transporte solo WebSocket, reintentos infinitos y opciones TLS antes de producción.
7. Verificar recuperación real en dos navegadores durante lobby, palabra, debate y votación, con cuentas e invitados. El cliente ya usa `resumeRoom`/`getGameState`; la continuidad tras reiniciar o distribuir el backend requiere persistencia compartida del servidor.
8. Mantener el timeout de inactividad como autoridad exclusiva del backend. El cliente solo debe representar `roomInactivityWarning`, solicitar `renewRoomInactivity` en nombre del anfitrión y reaccionar a `roomInactivityRenewed` o `roomClosed`.

## Prioridad 1: consolidar juego y chat

Chat simplificado: únicamente palabras enviadas y votos generan actividad. Se omiten avisos repetidos del servidor y acciones ya visibles en el tablero. Palabras con autor y texto destacados, votos públicos con autor/objetivo y ocultos con “Ha votado”; globos para conversación y franja violeta con etiqueta para fantasmas. El término del juego es “inocente”, incluido el estado interno de ganador. Verificado con 28 regresiones, incluyendo ausencia de duplicados y protección de identidad/objetivo del voto oculto. TypeScript conserva los siete errores preexistentes.

Continuidad actualizada: `results` vuelve a `word` conservando personaje, roles y eliminados; `roomUpdated` controla ronda y supervivencia. El resultado final permite volver al mismo lobby y solo se limpia ante otro `gameStarted`. Se quitó el selector de límite de rondas: `totalRounds` se conserva en el contrato por compatibilidad. Verificado con 28 regresiones aprobadas y lint focalizado; el chequeo TypeScript conserva los siete errores anteriores. Las nuevas pruebas cubren continuidad más allá de `totalRounds`, limpieza de pistas/votos/preparación sin nueva asignación, conservación de eliminados, resultado, credencial, código y retorno al lobby sin salida ni desconexión, seguido de reinicio del host.

Reestructuración del 23 de octubre de 2026: identidad compacta, instrucciones reducidas, tablero de pistas sin duplicación al votar y eventos del chat con borde punteado, etiquetas e iconos por acción. En móvil el chat abre como diálogo desde la cabecera, conserva borrador al cerrar y muestra novedades pendientes por ID; en escritorio sigue lateral. Las fases y decisiones continúan bajo autoridad del backend.

Verificación: 28 regresiones aprobadas y lint focalizado sin errores. Revisión con Chromium y estado de prueba local en anchos 320, 390 y 1440 px: sin desbordamiento horizontal, contador de dos novedades, apertura/cierre/Escape, borrador conservado y cambio de breakpoint. Bundle Vite compilado con Node 24; TypeScript conserva los siete errores anteriores ajenos a estos componentes. No sustituye una partida real contra el backend.

Actualización de la UI de partidas (22 de octubre de 2026): `GameScreenV2` tiene chat permanente y adaptable, identidad privada persistente, tarjetas de pistas por autor y revelación final mediante `gameEnded.impostorIds`. El backend vecino y su contrato se actualizaron únicamente para ese campo final. El chat admite conversación en debate y votación con ack/timeout y conservación del borrador. Las entradas locales de actividad derivan eventos públicos y no persisten en el backend; al recuperar, se restaura el historial del snapshot. El prototipo V1 conserva sus limitaciones y no fue modificado.

Verificación de este cambio: 20 regresiones del frontend aprobadas (`node --test tests/*.test.mjs`), lint focalizado aprobado y revisión de las fases en Edge con estado de prueba local en escritorio y móvil. La regresión `src/sockets/tests/gameReveal.test.mjs` del backend verifica uno y varios impostores, revelación únicamente al terminar y DTOs públicos sin roles, con persistencia simulada y sin acceder a Supabase. El parche `docs/backend-game-reveal.patch` incluye el cambio coordinado y esa prueba. El bundle con Vite compila; el comando completo `npm run build` sigue bloqueado por los 7 errores TypeScript preexistentes y el lint global conserva 11 errores y 2 warnings ajenos a esta UI. Estas verificaciones no sustituyen una partida real de dos navegadores.

Verificar manualmente en dos navegadores la recepción de turnos/pistas y chat, el canal de eliminados y el cierre con uno o varios impostores, usando el backend actualizado. Al finalizar, `roomUpdated` restablece la sala: la UI conserva el payload de `gameEnded` para mantener los avatares y nombres revelados. Recargar después del cierre recupera el lobby, pues el backend no conserva ese resultado en la sesión de sala.

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
8. Si el backend evoluciona a cookies `HttpOnly`, reemplazar el JWT accesible desde JavaScript por `withCredentials`, CORS con credenciales y un endpoint de sesión; no intentar crear una cookie `HttpOnly` desde el frontend.
9. Mantener pruebas manuales de `createRoom` con token válido, token vencido y ausencia de token; cada ack de autenticación debe limpiar `sessionStorage` y no reintentar con el mismo JWT.

## Pruebas sugeridas

`node --test tests/*.test.mjs` incluye la regresión de recuperación: identidad estable distinta del transporte, asignación privada, pistas, voto oculto sin doble envío, ronda/vencimientos, timeout/reintento, limpieza definitiva, descarte de eventos previos al snapshot, acks obsoletos y creación/unión/salida. Son pruebas con socket y dependencias de UI simuladas, sin Supabase ni clientes reales. Verificar también recarga dentro y fuera de los 60 segundos de gracia y reinicio del backend.

Palabras por turno: `node --test tests/word-flow.test.mjs` cubre publicación inmediata para anfitrión e invitado, pistas repetidas, avance de turno, omisión por timeout, resumen final, conservación en debate, limpieza en nueva ronda, ack exitoso/rechazo/timeout, input retenido y cleanup de listeners. Verificar además en dos navegadores que cada palabra aparece antes de que termine la ronda y que solo escribe el jugador del turno.

Para invitaciones, abrir `/join/:code` como invitado y usuario autenticado, probar salas con y sin contraseña y verificar que un reintento conserva el nombre del invitado. Escanear el QR desde un celular en la misma red, incluso cuando el anfitrión abrió el lobby desde `localhost`, y probar un enlace con código inválido o sala inexistente.

Para avatares, verificar con dos jugadores que el avatar aleatorio inicial coincide entre selector y tarjeta, que `roomUpdated` refleja el cambio en ambas pestañas y que un avatar ocupado se deshabilita. Ante rechazo del servidor o timeout, conservar la selección confirmada y mostrar el error. El backend actual prohíbe cambiar avatar a invitados; permitirlo requiere cambiar esa autorización en el backend.

Cuando el build vuelva a estar verde, introducir primero cobertura sobre límites de alto riesgo:

- Contratos de reducers o estado de sala/ronda.
- Empates, eliminación y condición de fin de partida.
- Registro y cleanup de listeners bajo `StrictMode` y reconexión.
- Flujos de crear/unirse con servidor de Socket.IO controlado.
- Navegación directa/refresh con identidad de sala.

Hasta entonces, `/test` sirve solo para exploración manual y no debe describirse como evidencia de regresión.
