# CharacterUs Frontend

Frontend de CharacterUs, un juego social del impostor orientado a personajes. En cada ronda todos los jugadores salvo el impostor conocen el personaje elegido; cada participante aporta una palabra relacionada y el impostor intenta pasar inadvertido antes de la votación.

## Estado actual

El login incluye el botón oficial de Google Identity Services. Configurar `VITE_GOOGLE_CLIENT_ID` con el mismo Client ID público que `GOOGLE_CLIENT_ID` del backend y reiniciar Vite. Google entrega una credencial efímera que se intercambia por el JWT de CharacterUs en `POST /api/auth/google`; solo la sesión de CharacterUs se conserva en `sessionStorage`. Ver [configuración y verificación](docs/GOOGLE_LOGIN.md).

El repositorio contiene una interfaz navegable y una simulación local del juego, junto con una capa inicial de integración con el backend. No toda la experiencia visible está conectada todavía:

- Login y registro consumen `/api/auth` mediante un cliente Axios público. La sesión se conserva por pestaña en `sessionStorage`, se valida contra `GET /api/auth/me` al restaurarse y permite crear salas solo a usuarios autenticados por el backend. Un visitante no autenticado solo puede unirse mediante un código de sala.
- Las pantallas V2 de crear, unirse, lobby y juego consumen el contrato Socket.IO de `backend.md`.
- El avatar inicial de sala lo asigna el backend. La selección y las tarjetas del lobby muestran el avatar confirmado por `roomUpdated`; los errores al cambiarlo se muestran al jugador. El backend actual rechaza cambios de avatar de invitados.
- El backend conserva la autoridad sobre sala, fases, turnos, personaje, votos y resultados. El cliente no avanza fases con timers propios.
- Las pistas se muestran a todos durante los turnos, apenas el servidor las acepta. El envío espera el ack (hasta 5 segundos), conserva el texto ante rechazo y sigue los eventos del servidor para avanzar al siguiente jugador o al debate.
- La UI de partida mantiene visible el personaje o el icono de impostor durante palabras, debate y votación. El tablero identifica cada pista por avatar y nombre. El chat permanece visible en todas las fases, registra actividad pública recibida y permite escribir en debate y votación, con ack de hasta 5 segundos y texto conservado ante error.
- El cierre destaca los nombres y avatares de los impostores a partir de `gameEnded.impostorIds`. Requiere el backend actualizado; el parche coordinado está en `docs/backend-game-reveal.patch`. El ganador `innocent` del servidor se presenta como victoria de los tripulantes.
- El backend avisa cinco minutos antes del cierre por inactividad. El frontend muestra el contador y solo el anfitrión puede extender la sala otros 40 minutos.
- Las salas públicas siguen siendo mock hasta que el backend exponga un contrato para listarlas.
- Un invitado solo puede unirse a una sala existente mediante su código y participar de esa partida; no puede crear ni explorar salas.
- Al crear/unirse se guarda una credencial privada de recuperación en `sessionStorage` por pestaña. Tras recargar o reconectar se recupera automáticamente el mismo jugador, incluido el invitado, dentro de los 60 segundos de gracia del backend.

Consulta [Arquitectura](docs/ARCHITECTURE.md), [Socket.IO](SOCKET.md) y [Recomendaciones](docs/RECOMMENDATIONS.md) antes de integrar nuevas funcionalidades.

## Stack

- React 19, TypeScript y Vite 7.
- React Router 7 con `BrowserRouter`.
- Tailwind CSS 4, componentes Radix/shadcn y Motion.
- Axios para HTTP, Zustand para sesión persistida, Zod para formularios y `jwt-decode` para claims de acceso.
- `socket.io-client` 4 para tiempo real.
- Backend externo en Express con PostgreSQL/Supabase. Este repositorio no contiene su implementación ni sus migraciones.

## Puesta en marcha

Vite 7 requiere Node.js `20.19+` o `22.12+`. El lockfile corresponde a npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

La URL de Vite aparece en la terminal. Para probar la integración actual, el backend debe exponer Socket.IO y la API HTTP en el origen configurado.

Vite escucha en la red local (`host: true`). El lobby muestra un QR y un enlace `/join/:code` junto al código de sala. En desarrollo, al abrir desde `localhost`, el QR usa la URL Network y el puerto efectivo de Vite; en otros hosts usa el origen de la página. Desde el celular, las URLs HTTP y Socket.IO deben apuntar a una dirección alcanzable del backend, no a `localhost` del dispositivo.

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
```

`VITE_SOCKET_URL` controla Socket.IO y `VITE_API_URL` controla HTTP. Ambos tienen valores locales por defecto.

## Comandos

```bash
npm run dev       # servidor Vite con HMR
npm run lint      # ESLint sobre todo el repositorio
npm run build     # TypeScript project build y luego bundle Vite
npm run preview   # sirve dist/ después de un build exitoso
node --test tests/*.test.mjs # regresiones de palabras, turnos y recuperación
```

Las pruebas focalizadas usan el runner nativo de Node y ejercitan stores, recuperación, listeners, emisores y handlers de UI con un socket simulado; no conectan clientes reales ni acceden a Supabase. `src/test` contiene interfaces de diagnóstico manual compiladas junto con la aplicación.

## Rutas

| Ruta | Función actual |
| --- | --- |
| `/` | Landing pública |
| `/signup`, `/login` | Registro e inicio de sesión con JWT contra la API |
| `/menu` | Acceso autenticado a creación, PIN y salas públicas |
| `/create` | Consulta categorías y crea una sala vía Socket.IO; valida sesión HTTP y envía el JWT solo en `createRoom` |
| `/join`, `/join/:code` | Unión por código de seis dígitos vía Socket.IO; el enlace/QR evita escribirlo manualmente y conserva el ingreso de nombre y contraseña cuando corresponda |
| `/public-rooms` | Lista mock temporal para usuarios autenticados; la unión usa Socket.IO |
| `/lobby` | Lobby sincronizado por eventos Socket.IO; el anfitrión puede renovar la inactividad cuando el servidor avisa |
| `/game` | Fases, pistas, chat, votos y resultados dirigidos por Socket.IO |
| `/test` | Diagnóstico manual de Socket.IO + categorías HTTP |

`/profile` está registrada solo para usuarios autenticados. Las rutas `/menu`, `/create`, `/public-rooms` y `/profile` redirigen a `/join` cuando no hay una sesión autenticada; el visitante puede continuar a lobby y partida únicamente después de unirse mediante código. La sesión HTTP se restaura por pestaña solo después de que `GET /api/auth/me` confirme el token. La recuperación de sala es independiente: no autentica HTTP ni habilita crear salas. El socket permanece sin autenticación de handshake; el backend autoriza la creación de sala mediante el token del payload `createRoom`.

Durante una recuperación se muestra “Recuperando partida” y se bloquean rutas y acciones hasta aplicar el snapshot privado. Los timeouts conservan la credencial y permiten reintentar; una sesión vencida o una sala eliminada la limpian y vuelven a `/join`. Salir correctamente, ser expulsado o cerrarse la sala también la limpian. Reiniciar el backend pierde la partida, ya que el servidor la conserva en memoria.

Al desplegar, el hosting debe redirigir rutas desconocidas a `index.html`; de lo contrario, recargar una ruta de `BrowserRouter` devolverá 404.

## Verificación conocida

Al 5 de septiembre de 2026, `npm run lint` y `npm run build` detectan problemas preexistentes. No deben presentarse como una regresión nueva sin comparar el resultado; el detalle y las propuestas están en [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md).
