# CharacterUs Frontend

Frontend de CharacterUs, un juego social del impostor orientado a personajes. En cada ronda todos los jugadores salvo el impostor conocen el personaje elegido; cada participante aporta una palabra relacionada y el impostor intenta pasar inadvertido antes de la votación.

## Estado actual

El repositorio contiene una interfaz navegable y una simulación local del juego, junto con una capa inicial de integración con el backend. No toda la experiencia visible está conectada todavía:

- Login y registro consumen `/api/auth` mediante un cliente Axios público. La sesión se conserva por pestaña en `sessionStorage`, se valida contra `GET /api/auth/me` al restaurarse y permite crear salas solo a usuarios autenticados por el backend.
- Las pantallas V2 de crear, unirse, lobby y juego consumen el contrato Socket.IO de `backend.md`.
- El backend conserva la autoridad sobre sala, fases, turnos, personaje, votos y resultados. El cliente no avanza fases con timers propios.
- Las salas públicas siguen siendo mock hasta que el backend exponga un contrato para listarlas.
- Recargar una ruta de lobby o juego no recupera la sala: el backend aún no define un evento de reingreso/reconexión del cliente.

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
```

No hay runner ni script de tests automatizados. `src/test` contiene interfaces de diagnóstico manual compiladas junto con la aplicación.

## Rutas

| Ruta | Función actual |
| --- | --- |
| `/` | Landing pública |
| `/signup`, `/login` | Registro e inicio de sesión con JWT contra la API |
| `/menu` | Acceso a creación, PIN y salas públicas |
| `/create` | Consulta categorías y crea una sala vía Socket.IO; valida sesión HTTP y envía el JWT solo en `createRoom` |
| `/join` | Unión por código de seis dígitos vía Socket.IO |
| `/public-rooms` | Lista mock temporal; la unión usa Socket.IO |
| `/lobby` | Lobby sincronizado por eventos Socket.IO |
| `/game` | Fases, pistas, chat, votos y resultados dirigidos por Socket.IO |
| `/test` | Diagnóstico manual de Socket.IO + categorías HTTP |

`/profile` está registrada. La sesión HTTP se restaura por pestaña solo después de que `GET /api/auth/me` confirme el token. No hay recuperación de sesión de sala. El socket permanece sin autenticación de handshake; el backend autoriza la creación de sala mediante el token del payload `createRoom`.

Al desplegar, el hosting debe redirigir rutas desconocidas a `index.html`; de lo contrario, recargar una ruta de `BrowserRouter` devolverá 404.

## Verificación conocida

Al 5 de septiembre de 2026, `npm run lint` y `npm run build` detectan problemas preexistentes. No deben presentarse como una regresión nueva sin comparar el resultado; el detalle y las propuestas están en [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md).
