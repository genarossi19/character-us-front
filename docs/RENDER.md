# Render: enlaces de invitación y rutas directas

Producción del frontend: https://characterus-front.onrender.com/.

El 14 de noviembre de 2026 se verificó por HTTP que la raíz devuelve 200, pero `/join/123456` y `/login` devuelven `404 text/plain: Not Found`. La petición no llega a React ni a Socket.IO: falta el fallback del hosting del frontend. Cambiar el backend no corrige ese 404.

## Corrección incluida

Los nuevos QR, enlaces copiados y Web Share usan `https://characterus-front.onrender.com/?code=123456`. Render sirve la raíz y React muestra directamente el formulario de unión, conservando el código en la URL al recargar. Se reutilizan validación, nombre, contraseña condicional y `joinRoom` existentes. Un código inválido lleva al paso de código; no se envía automáticamente una solicitud al servidor.

En desarrollo se conserva el origen de red de Vite para poder escanear desde el celular. No se fija el dominio de producción en el código, para respetar otros despliegues y dominios personalizados.

## Configuración del Static Site existente

En Render, abrir el servicio **characterus-front → Redirects/Rewrites → Add Rule**:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | `Rewrite` |

Guardar la regla. Debe ser **Rewrite**, no Redirect: la URL conserva el código y React Router resuelve la pantalla. Render sirve los archivos existentes antes de aplicar la regla, por lo que los assets no quedan reemplazados por HTML.

La regla también está declarada en `render.yaml` para servicios administrados mediante Blueprint, con build `npm ci && npm run build` y publicación `dist`. Un servicio creado manualmente no aplica ese archivo solo por subirlo: hay que guardar la regla anterior en su panel o administrarlo mediante Blueprint. Conservar las variables de producción `VITE_API_URL`, `VITE_SOCKET_URL` y `VITE_GOOGLE_CLIENT_ID` existentes.

Los cambios de aplicación requieren publicar este código y volver a desplegar el frontend. Este trabajo no modifica el servicio de Render ni despliega los cambios automáticamente.

## Comprobación después del despliegue

- Abrir una invitación con una sala real: `/?code=CODIGO`; debe pedir identidad sin reescribir el código.
- Recargar esa URL y probar QR, copiar enlace y compartir desde el lobby.
- Abrir `/join/CODIGO` y `/login` directamente: deben devolver HTML con estado 200 después de aplicar el rewrite.
- Un código de sala inexistente puede cargar el formulario correctamente y ser rechazado por `joinRoom`: eso es distinto del 404 del hosting.

Fuentes: [Render: redirects y rewrites](https://render.com/docs/redirects-rewrites), [Blueprint](https://render.com/docs/blueprint-spec).
