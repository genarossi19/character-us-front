# CharacterUs · Frontend

- Trabajar en `developer`. Reservar `main` para promoción explícita a producción.
- Empezar por el índice del [README](README.md) y leer solo la guía vinculada a la tarea.
- Las rutas activas están en `src/App.tsx` y usan pantallas V2. V1 contiene prototipos. Verificar la ruta activa antes de editar.
- Para cambios HTTP o Socket.IO, contrastar tipos, emisores y listeners con `../character-us-server`. El servidor decide fases, roles, votos y plazos. Mantener una sola conexión y retirar los mismos callbacks registrados bajo StrictMode.
- Conservar la identidad estable del jugador y separar sesión HTTP de recuperación de sala. Evitar credenciales en URLs, QR, logs y DTOs públicos.
- Verificar según el alcance con los comandos del [README](README.md). En PowerShell con scripts bloqueados, usar `npm.cmd` y `npx.cmd`.
