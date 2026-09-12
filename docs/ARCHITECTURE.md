# Arquitectura del frontend

## Objetivo del producto

CharacterUs coordina salas para un juego social por rondas. El backend Express debe ser la autoridad de sala, participantes, personaje asignado, impostores, votos y resultado; PostgreSQL en Supabase persiste los datos que correspondan. El frontend presenta ese estado y mantiene solo interacción efímera de UI.

Las pantallas V2 de creación, unión, lobby y juego están conectadas al contrato de `backend.md`. Las salas públicas permanecen mock porque el backend todavía no expone un listado.

## Entrada y navegación

- `src/main.tsx` monta React en `StrictMode`, `BrowserRouter` y el toaster global.
- `src/App.tsx` declara todas las rutas y envuelve la aplicación con `ThemeProvider`.
- `App.tsx` monta los listeners globales de juego para no perder eventos durante la navegación de lobby a partida.
- Los stores de Zustand contienen la vista local del estado autoritativo recibido por Socket.IO.
- La sesión JWT se conserva por pestaña en `sessionStorage` mediante `useUserStore`. Al arrancar, `App.tsx` valida el token con `GET /api/auth/me`; solo entonces habilita `/create`. La identidad de sala no se recupera tras recargar.

El flujo visible actual no es un único flujo de datos:

```text
Login/Signup --REST + JWT--> Menu
Menu --> Create --createRoom--> Lobby --gameStarted--> Game
Menu --> Join --joinRoom--> Lobby --gameStarted--> Game
Menu --> Public rooms (mock) --joinRoom--> Lobby
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
| Sala/lobby | `useRoomStore` | Ninguna tras recargar |
| Partida, roles, votos y chat | `useGameStore` | Ninguna tras recargar |
| Salas públicas | Array mock temporal | Ninguna |

Antes de conectar pantallas, hay que definir identidad de sala/jugador, recuperación tras refresh y reconexión, y qué estado es privado para cada socket. No introducir un store global sin resolver primero esas reglas de dominio.

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
- No hay configuración de CI, contenedores, codegen, migraciones ni despliegue en este repositorio.
- `ClassDiagram.mmd` describe un modelo de backend, pero este frontend no permite verificar que coincida con el esquema real de Supabase.
