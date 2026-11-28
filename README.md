# CharacterUs · Frontend

Juego social del impostor en React 19, TypeScript, Vite, Tailwind, Zustand y Socket.IO. El backend vive en el repositorio vecino `../character-us-server`.

| Si trabajás en… | Consultá |
| --- | --- |
| Rutas, stores, autenticación o recuperación | [Arquitectura](docs/ARCHITECTURE.md) |
| Componentes y diseño adaptable | [Guía de interfaz](docs/UI_GUIDELINES.md) |
| Eventos, ACK y privacidad | [Contrato del servidor](https://github.com/genarossi19/character-us-server/blob/developer/frontend.md) y [tipos del cliente](src/types/game.ts) |
| Cambios de protocolo en curso | [Coordinación con el backend](FOR_BACKEND.md) |

Para cambios de integración, priorizá el código de ambos checkouts. El contrato remoto refleja lo publicado en `developer`.

## Desarrollo local

Usá Node 20.19+ o 22.12+ y el lockfile. Copiá [`.env.example`](.env.example) a `.env.local` y ejecutá:

```sh
npm ci
npm run dev
```

- `VITE_API_URL`: base HTTP, por defecto `http://localhost:3000/api`.
- `VITE_SOCKET_URL`: origen Socket.IO, por defecto `http://localhost:3000`.
- `VITE_GOOGLE_CLIENT_ID`: ID OAuth web público. Debe coincidir con `GOOGLE_CLIENT_ID` del servidor. Habilitá el origen del frontend en Google y en el CORS del servidor. Para desarrollo, usá `http://localhost:5173`. Sin Client ID sigue disponible el acceso por contraseña.

Reiniciá Vite al cambiar variables. Para probar desde un celular, usá URLs del backend alcanzables desde el dispositivo y habilitá el origen LAN. Vite publica el origen LAN para que los QR generados desde localhost funcionen en la red.

## Verificación

| Comando | Alcance |
| --- | --- |
| `npm run build` | TypeScript y bundle Vite en `dist/` |
| `npm run lint` | ESLint global. Compará con la base de la rama para identificar regresiones. |
| `npx tsc -p tsconfig.app.json --noEmit --incremental false` | Tipos de la aplicación |
| `node --test tests/*.test.mjs` | Regresiones con dependencias simuladas |

`/test` es un diagnóstico manual incluido en el build. Para verificar la integración, usá dos pestañas y el backend real. Probá crear, unirse, confirmar preparación, jugar, recuperar la sala al recargar y volver al mismo lobby. Probá Google con un origen autorizado y una cuenta real si el cambio afecta el acceso.

## Render

El frontend se sirve como Static Site. [Producción](https://characterus-front.onrender.com/) · [Configuración del Blueprint](render.yaml).

- Build `npm ci && npm run build` y publicación de `dist`. Definí las variables de Vite en el servicio antes del build.
- Configurá el rewrite `/*` → `/index.html` para abrir y recargar rutas de BrowserRouter. Un servicio creado manualmente requiere agregar la regla en **Redirects/Rewrites**. El Blueprint ya la declara.
- Las invitaciones y los QR usan `/join/:roomId` con el UUID de la sala. El código de seis dígitos se ingresa en `/join`. Después de desplegar ambos servicios, verificá la apertura directa de `/login` y de una invitación válida.
