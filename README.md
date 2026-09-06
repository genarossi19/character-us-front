# CharacterUs Frontend

Frontend de CharacterUs, un juego social del impostor orientado a personajes. En cada ronda todos los jugadores salvo el impostor conocen el personaje elegido; cada participante aporta una palabra relacionada y el impostor intenta pasar inadvertido antes de la votación.

## Estado actual

El repositorio contiene una interfaz navegable y una simulación local del juego, junto con una capa inicial de integración con el backend. No toda la experiencia visible está conectada todavía:

- Login y registro validan formularios, pero no crean una sesión real.
- Creación de sala, lobby, salas públicas, chat, roles y votación usan datos locales o simulados en las pantallas principales.
- Los servicios Socket.IO y HTTP existen, pero se ejercitan principalmente desde el diagnóstico manual `/test`.
- Creación, lobby y juego mantienen modelos de estado independientes; navegar entre ellos no conserva una sala real.
- Solo el tema visual se persiste en `localStorage` (`vite-ui-theme`).

Consulta [Arquitectura](docs/ARCHITECTURE.md), [Socket.IO](SOCKET.md) y [Recomendaciones](docs/RECOMMENDATIONS.md) antes de integrar nuevas funcionalidades.

## Stack

- React 19, TypeScript y Vite 7.
- React Router 7 con `BrowserRouter`.
- Tailwind CSS 4, componentes Radix/shadcn y Motion.
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
```

`VITE_SOCKET_URL` solo controla Socket.IO y usa `http://localhost:3000` por defecto. La API de categorías está fijada actualmente a `http://localhost:3000/api` en `src/services/api/category.ts`; cambiar solo la variable de Socket.IO no cambia HTTP.

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
| `/signup`, `/login` | Formularios locales; navegan a `/menu` |
| `/menu` | Acceso a creación, PIN y salas públicas |
| `/create` | Configuración local; actualmente navega directo a `/game` |
| `/join` | Unión simulada; solo acepta el PIN `123456` |
| `/public-rooms` | Lista local; sus enlaces `/game/:id` no tienen ruta registrada |
| `/lobby` | Lobby basado en datos mock de `App.tsx` |
| `/game` | Juego, chat y votación simulados localmente |
| `/test` | Diagnóstico manual de Socket.IO + categorías HTTP |

También hay navegaciones sin ruta registrada a `/profile`, `/results` y `/voting-screen`. No existen guards de autenticación.

Al desplegar, el hosting debe redirigir rutas desconocidas a `index.html`; de lo contrario, recargar una ruta de `BrowserRouter` devolverá 404.

## Verificación conocida

Al 5 de septiembre de 2026, `npm run lint` y `npm run build` detectan problemas preexistentes. No deben presentarse como una regresión nueva sin comparar el resultado; el detalle y las propuestas están en [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md).
