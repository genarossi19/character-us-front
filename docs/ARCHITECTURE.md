# Arquitectura del frontend

## Objetivo del producto

CharacterUs coordina salas para un juego social por rondas. El backend Express debe ser la autoridad de sala, participantes, personaje asignado, impostores, votos y resultado; PostgreSQL en Supabase persiste los datos que correspondan. El frontend presenta ese estado y mantiene solo interacción efímera de UI.

La integración completa todavía no está implementada. Esta distinción evita confundir la simulación visual con el flujo del backend.

## Entrada y navegación

- `src/main.tsx` monta React en `StrictMode`, `BrowserRouter` y el toaster global.
- `src/App.tsx` declara todas las rutas y envuelve la aplicación con `ThemeProvider`.
- `App.tsx` conserva un `gameData` mock usado solo por `WaitingRoom`.
- `CreateRoomPage` y `GameScreen` mantienen modelos locales distintos; no comparten el `gameData` de `App`.
- No hay guards, loaders ni un proveedor de autenticación/sala.

El flujo visible actual no es un único flujo de datos:

```text
Login/Signup --validación local--> Menu
Menu --> Create --estado local descartado--> Game --simulación local
Menu --> Join --PIN 123456--> Lobby --mock de App--> Game --otro mock
Menu --> Public rooms --mock--> /game/:id (404)
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

- `src/services/socket/`: singleton, tipos, emitters y listeners Socket.IO.
- `src/services/api/category.ts`: acceso HTTP a categorías y personajes.
- `src/hooks/`: adaptadores React para socket y visibilidad.

La URL Socket.IO admite `VITE_SOCKET_URL`; el API HTTP está fijado por separado a `http://localhost:3000/api`. No supongas que ambas cambian juntas.

### Diagnóstico

`src/test` contiene componentes manuales, no tests automatizados. Solo `CompleteFlowTest` se renderiza desde `/test`; los demás archivos no tienen una ruta propia. Al estar bajo `src`, todos participan en lint y compilación de producción.

El diagnóstico prueba un backend real y requiere dos pestañas para dos sockets. No usa mocks, assertions ni fixtures y no ofrece garantía de regresión.

## Estado y persistencia

| Estado | Dueño actual | Persistencia |
| --- | --- | --- |
| Tema | `ThemeProvider` | `localStorage`: `vite-ui-theme` |
| Login/registro | Cada formulario | Ninguna |
| Configuración de sala | `CreateRoomPage` | Ninguna; se descarta al navegar |
| PIN ingresado | `QuickJoinScreen` | Ninguna |
| Lobby | Mock en `App.tsx` + avatar local | Ninguna tras recargar |
| Partida, roles, votos | `GameScreen` | Ninguna; valores simulados |
| Chat | `GameScreen` | Ninguna |
| Salas públicas | Array local | Ninguna |

Antes de conectar pantallas, hay que definir identidad de sala/jugador, recuperación tras refresh y reconexión, y qué estado es privado para cada socket. No introducir un store global sin resolver primero esas reglas de dominio.

## Flujo de datos externo

### HTTP

`src/services/api/category.ts` expone:

- `GET /api/category`
- `GET /api/category/:id`
- `GET /api/character/category/:categoryId`
- `GET /api/character/random/:categoryId`

Los helpers capturan errores, escriben en consola y retornan `[]` o `null`; por ello el consumidor no distingue actualmente entre una respuesta vacía y un fallo de red/servidor.

### Tiempo real

Socket.IO modela creación/unión de sala, actualizaciones de participantes e inicio/juego. Los contratos y sus discrepancias están detallados en `SOCKET.md`. Las pantallas de producto aún no emiten ni escuchan eventos de chat.

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
