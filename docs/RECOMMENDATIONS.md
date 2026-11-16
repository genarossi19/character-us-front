# Recomendaciones técnicas

Modo presencial: `settings.playMode` separa `online` de `in_person` sin alterar `mode`. El frontend incorpora selección, turnos orales con Listo (`completeTurn`/`turnCompleted`), actividad de solo lectura y debate oral; votos/resultados se mantienen en la app. El backend aún debe implementar y confirmar este contrato: no hay simulación de avance local. Ver [contrato presencial](PRESENTIAL_MODE.md). Verificado con 46 regresiones, build y lint focalizado aprobados. Brave con catálogo/socket simulados: configuración, turnos propios/ajenos, rechazo y reintento, ausencia de campos de escritura, voto/resultados y anchos 320/390/1366 sin desbordamiento. El lint global conserva 10 errores y 2 warnings preexistentes. No es una validación contra un backend que implemente presencial.

Invitaciones en Render: los nuevos enlaces/QR usan `/?code=123456` (en producción, `https://characterus-front.onrender.com/?code=123456`) y abren el mismo formulario de unión, con código validado y sin incluir contraseña/token. `/join/:code` se conserva para enlaces anteriores. El frontend necesita un rewrite `/*` → `/index.html` para aperturas y recargas de rutas de BrowserRouter. Ver [despliegue en Render](RENDER.md). Verificado con el build servido sin fallback: la ruta antigua devuelve 404, pero la invitación por raíz carga con 200, conserva código al recargar, pide nombre y valida códigos inválidos. Build, lint focalizado y 41 regresiones aprobados; lint global conserva 10 errores y 2 warnings preexistentes.

Avatar optimista local: selección y tarjeta propias cambian inmediatamente, sin “Cambiando” ni spinner. Ante rechazo se restaura la vista anterior y se muestra `toast.error`. La anticipación persiste ante actualizaciones ajenas y ack previo al evento; una confirmación por `roomUpdated` evita rollback por un timeout posterior. El store canónico y los demás clientes conservan la autoridad del servidor. Verificado en navegador con respuestas simuladas: cambio inmediato en selector/tarjeta, ausencia de carga, rechazo con rollback/toast, actualizaciones ajenas, ack antes del evento y confirmación anterior al timeout. Build, lint focalizado y 41 regresiones aprobados.

Lobby simplificado (13 de noviembre de 2026): solo participantes presentes, un único contador de ocupación y selector de avatares siempre visible. Se eliminan placeholders, acciones de invitación por lugar, diálogo de avatares, contador de preparados, etiquetas duplicadas y mensajes promocionales. El anfitrión tiene una sola etiqueta y los estados de conexión/preparación siguen junto a cada participante. Invitación y reglas comparten un panel lateral; la alternativa seleccionable del enlace aparece solo si falla la copia. Se mantienen contratos y confirmaciones de preparación, avatar, inicio, expulsión y salida.

Verificación: build completo, lint focalizado y 41 regresiones aprobados. Brave en claro/oscuro a 320, 390, 768, 1024, 1366 y 1440 px sin desbordamiento horizontal; ocho jugadores y acciones visibles sin scroll en 1366×768. Con catálogo/socket simulados se comprobaron selección directa, avatar ocupado, rechazo/reintento y estado confirmado, copia/fallback, preparación, bloqueo de inicio ante desconexión, expulsión, salida con timeout e inicio por `gameStarted`. Lint global conserva 10 errores y 2 warnings preexistentes. No sustituye una partida real con dos dispositivos ni el escaneo de QR desde un celular.

Crear partida: configuración agrupada en partida, jugadores/roles y acceso/reglas, con resumen lateral sincronizado y fijo al desplazarse en escritorio; en móvil se apila. Se conserva el contrato de `createRoom` y se retira Virtual/Presencial, que sobrescribía `mode` sin representar un campo independiente del servidor. Capacidad con selección exclusiva, impostores con controles de incremento y reglas con interruptores; contraseña visible solo para salas privadas y eliminada del payload al elegir Pública. Categorías vacías permiten reintentar, y el envío bloquea duplicados conservando configuración ante rechazo.

Verificación: build completo, lint focalizado y 38 regresiones aprobados; lint global conserva 10 errores y 2 warnings preexistentes. Brave en claro/oscuro a 320, 390, 768, 1024, 1366 y 1440 px sin desbordamiento horizontal; a 1366×768 toda la configuración y las acciones quedan visibles sin scroll. Con categorías y socket simulados se comprobaron selección por teclado, resumen, payload canónico, contraseña, bloqueo de doble envío, rechazo y reintento. Estas comprobaciones no sustituyen la creación contra el backend desplegado.

Transición Login ↔ Registrarse: View Transition API con snapshots compartidos de marco, panel visual y formulario; barrido de 600 ms en escritorio, sin recarga. La ilustración se intercambia sin superponer ambos textos, y se desactiva la entrada normal de Motion durante el traspaso. En móvil, movimiento reducido o API ausente se conserva navegación SPA con entrada discreta. Verificado en Brave en ambas direcciones midiendo posiciones intermedias y permanencia del mismo documento, más foco del título y alternativas compatibles. Las 38 regresiones pasan, incluidas 6 nuevas de bloqueo de doble clic, limpieza, snapshots omitidos, error del navegador y alternativas. Build y lint focalizado aprobados; lint global conserva 10 errores y 2 warnings preexistentes.

Identidad propia de Registrarse: formulario a la izquierda y una ilustración SVG de mesa de juego y tarjeta de jugador a la derecha; el nombre local se refleja como vista decorativa. Se preservan paleta, tamaños y componentes de Login sin reutilizar su escena de avatares. Build y lint focalizado aprobados; revisión visual en ambos temas y recorrido simulado de validación, términos, carga, rechazo y reintento aprobados.

Registrarse alineado con Login: misma composición lateral, verde agua, ancho del bloque de acceso, botones compartidos y campos de 48 px/16 px. En escritorio, cuatro campos en dos filas; móvil los apila. Se mantienen validación Zod y contrato, con mostrar/ocultar independiente, carga y errores inline enfocados. Verificación: build y lint focalizado aprobados, 32 regresiones aprobadas. Brave en claro/oscuro: 320, 390, 768, 1024×768, 1280×720, 1366×768 y 1440×900 sin desbordamiento; sin scroll en esos tamaños de escritorio. Probados validación local, términos, contraseña no coincidente, visibilidad, carga, rechazo con errores por campo, datos conservados y reintento exitoso usando HTTP simulado, sin autenticación real ni cambios en el backend.

Alineación del bloque derecho de Login: título, Google, campos apilados y acción principal comparten un ancho máximo de 400 px. Se mantiene el botón oficial de Google sin deformarlo. Revisado en claro/oscuro a 320, 390, 768 y 1440 px, y sin scroll en escritorio desde 1024×640. Se conservan campos de 48 px/16 px y el verde agua. Build y lint focalizado aprobados; comprobación de carga, error y reintento con respuestas HTTP simuladas.

Coherencia de Login con Registrarse: el login usa el verde agua para superficies, detalles y acción principal (texto blanco); se retiran los acentos coral de la composición. Los campos recuperan la escala base de Registrarse. Medidas comparadas en navegador: alto 48 px, fuente 16 px y padding izquierdo 40 px en ambos. Verificado en claro/oscuro sin desbordamiento horizontal a 320/390 px y sin scroll de escritorio en 1024×640, 1280×720 y 1366×768. Build y lint focalizado aprobados.

Login en escritorio: composición ancha con zona visual lateral y campos de correo/contraseña apilados en una columna común de hasta 400 px; móvil apila el formulario y simplifica la decoración. Se mantienen tamaños de tipografía y botones. Revisión con Brave: sin scroll en 1024×768, 1280×720, 1366×768, 1440×900 y 1920×1080; sin desbordamiento horizontal en móvil, en ambos temas. Se repitieron mostrar/ocultar, carga, error con datos conservados y reintento por Enter con HTTP simulado. Build y lint focalizado aprobados.

Login actualizado al estilo del inicio y unión con un único panel, cabecera con avatar y movimiento reducido, campos legibles y control de visibilidad de contraseña. Se conserva el acceso con Google y correo. Verificado con build y lint focalizado aprobados y 32 regresiones aprobadas; revisión visual en claro/oscuro a 320, 390, 768 y 1440 px sin desbordamiento. Con HTTP simulado: carga con formulario bloqueado, error inline enfocado, datos conservados y reintento exitoso por Enter. Las pruebas no sustituyen una autenticación real contra el backend y Google.

Login y Unirse comparten `BackButton` y `FormActionButton`, extraídos del estilo original del login. Las futuras revisiones de otras pantallas deben seguir [UI_GUIDELINES.md](UI_GUIDELINES.md), sin variantes locales de altura, fuente, radio o padding para esas acciones.

Unión compacta: un único panel centrado con cabecera de marca, un avatar decorativo y etiqueta contextual; sin presentación lateral ni enlaces de promoción. Conserva código destacado, nombre, contraseña condicional, carga y errores. El flujo y sus contratos siguen iguales.

## Inicio explicativo y espaciado compartido

Inicio rediseñado con avatares grandes, cuatro secciones al desplazarse, pasos de juego y una demostración interactiva local. Motion anima entradas, personajes flotantes y microinteracciones; se respeta movimiento reducido y hay pausa explícita. Márgenes exteriores y separaciones se centralizan en los tokens CSS documentados en Arquitectura. Se aplican a las pantallas activas, incluidas cuenta, acceso, creación, lobby y partida, sin cambiar contratos del juego. El formulario de unión deja de imponer un ancho mínimo de 320 px dentro de sus márgenes.

Verificación: build completo y lint focalizado aprobados; 32 regresiones aprobadas. Brave: inicio en claro/oscuro a 320, 390, 768 y 1440 px sin desbordamiento, con cabecera y secciones alineadas; elección correcta/incorrecta y reinicio del ejemplo, anclas, pausa y movimiento reducido comprobados. Login, registro, unión, menú, salas públicas, perfil y creación sin desbordamiento a 320 px con datos locales de prueba. Las verificaciones visuales no representan una partida conectada al backend.


## Verificación de interfaz y preparación del lobby

La interfaz activa usa español, incluido el idioma HTML, las acciones de acceso, las etiquetas de correo, modos y cambio de tema. Login muestra carga indeterminada por correo o Google y recupera el formulario ante errores. Inicio/menú se adaptan a móvil; el lobby organiza jugadores e invitación/configuración en dos columnas en escritorio. La preparación de sala se sincroniza con `lobbyReady` y `Player.isLobbyReady`, y el servidor rechaza inicios sin todos conectados y listos. El backend vecino fue actualizado; reiniciarlo junto con el frontend.

Verificación: `npm run build` completo aprobado, 32 regresiones del frontend aprobadas y 8 pruebas focalizadas del servidor aprobadas, sin acceder a PostgreSQL. Cubren confirmación por invitados/anfitrión, autorización, bloqueo por nuevos jugadores/desconexión, mínimos, idempotencia, errores, timeout/reintento, DTO/snapshot sin secretos y reinicio de preparación al terminar. El typecheck del backend se completa. El lint global conserva sus 10 errores y 2 warnings preexistentes, presentes antes del cambio; el lint focalizado de las páginas y la integración modificadas se completa correctamente.

Revisión en Brave con datos locales de prueba: inicio en 320, 390, 768 y 1440 px sin desbordamiento horizontal; lobby en claro/oscuro en 320, 390, 1024 y 1440 px sin desbordamiento horizontal, y ocho jugadores sin scroll vertical en 1024×768 y 1440×900. Login con respuesta HTTP simulada: indicador activo durante la espera y formulario recuperado con datos conservados tras rechazo. No sustituye la comprobación contra el backend desplegado ni una autenticación real con Google.

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

Chat simplificado: únicamente palabras enviadas y votos generan actividad. Se omiten avisos repetidos del servidor y acciones ya visibles en el tablero. Palabras con autor y texto destacados, votos públicos con autor/objetivo y ocultos con “Ha votado”; globos para conversación y franja violeta con etiqueta para fantasmas. El término del juego es “inocente”, incluido el estado interno de ganador. Verificado con 29 regresiones, incluyendo ausencia de duplicados y protección de identidad/objetivo del voto oculto. El build TypeScript actual se completa correctamente.

Continuidad actualizada: `results` vuelve a `word` conservando personaje, roles y eliminados; `roomUpdated` controla ronda y supervivencia. El resultado final permite volver al mismo lobby y solo se limpia ante otro `gameStarted`. Se quitó el selector de límite de rondas: `totalRounds` se conserva en el contrato por compatibilidad. Al invalidarse una sesión de sala o al salir, se conservan las reglas de limpieza y el destino depende de la sesión HTTP: `/menu` para autenticados y `/join` para visitantes. Verificado con 29 regresiones aprobadas y lint focalizado; el chequeo TypeScript se completa correctamente. Las nuevas pruebas cubren continuidad más allá de `totalRounds`, limpieza de pistas/votos/preparación sin nueva asignación, conservación de eliminados, resultado, credencial, código y retorno al lobby sin salida ni desconexión, seguido de reinicio del host.

Reestructuración del 23 de octubre de 2026: identidad compacta, instrucciones reducidas, tablero de pistas sin duplicación al votar y eventos del chat con borde punteado, etiquetas e iconos por acción. En móvil el chat abre como diálogo desde la cabecera, conserva borrador al cerrar y muestra novedades pendientes por ID; en escritorio sigue lateral. Las fases y decisiones continúan bajo autoridad del backend.

Verificación: 29 regresiones aprobadas y lint focalizado sin errores. Revisión con Chromium y estado de prueba local en anchos 320, 390 y 1440 px: sin desbordamiento horizontal, contador de dos novedades, apertura/cierre/Escape, borrador conservado y cambio de breakpoint. Bundle Vite compilado con Node 24 y TypeScript se completa correctamente. No sustituye una partida real contra el backend.

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

Para avatares, verificar con dos jugadores que el avatar aleatorio inicial coincide entre selector y tarjeta, que `roomUpdated` refleja el cambio en ambas pestañas y que un avatar ocupado se deshabilita. Ante rechazo del servidor o timeout, conservar la selección confirmada y mostrar el error. El handler/servicio del backend vecino actuales permiten cambiar avatar a invitados y usuarios. Verificar que el backend desplegado tenga ese comportamiento; ante versiones anteriores la UI conserva el rechazo sin inventar una selección confirmada.

Cuando el build vuelva a estar verde, introducir primero cobertura sobre límites de alto riesgo:

- Contratos de reducers o estado de sala/ronda.
- Empates, eliminación y condición de fin de partida.
- Registro y cleanup de listeners bajo `StrictMode` y reconexión.
- Flujos de crear/unirse con servidor de Socket.IO controlado.
- Navegación directa/refresh con identidad de sala.

Hasta entonces, `/test` sirve solo para exploración manual y no debe describirse como evidencia de regresión.
