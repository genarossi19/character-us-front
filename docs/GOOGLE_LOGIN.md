# Acceso con Google

1. Configurar `VITE_GOOGLE_CLIENT_ID=tu-id.apps.googleusercontent.com` en `.env.local` y reiniciar Vite. Debe coincidir con `GOOGLE_CLIENT_ID` del backend. Es un identificador público, nunca un client secret.
2. Configurar en Google los orígenes JavaScript autorizados del frontend, incluido `http://localhost:5173` para desarrollo. Usar localhost; una IP privada por HTTP no equivale a localhost. Producción requiere HTTPS.
3. El backend debe tener aplicada su migración `001_google_login.sql`, el Client ID y el origen del frontend en `CORS_ORIGIN`.
4. Abrir `/login` y usar el botón oficial. La primera autenticación también crea la cuenta.

El botón de `/login` usa `continue_with` («Continuar con Google») y el de `/signup` usa `signup_with` («Registrarse con Google»), con localización española del SDK. Ambos llaman a la misma acción `loginWithGoogle` y a `POST /api/auth/google`, y abren `/menu` al completar la sesión. El acceso con Google no requiere completar el formulario de registro por contraseña. Las solicitudes de ambos métodos se bloquean mientras hay un envío pendiente.

El SDK se carga una vez desde `https://accounts.google.com/gsi/client`, con timeout y reintento. Se inicializa una vez, conserva un callback activo y lo retira al desmontar para soportar StrictMode. No se usa One Tap ni selección automática.

El callback envía únicamente `{ credential }` como JSON a `POST /api/auth/google`, mediante el cliente público con `VITE_API_URL`. La credencial de Google no se persiste, no se usa en Socket.IO ni se registra. El JWT de CharacterUs usa la sesión existente por pestaña; `/api/auth/me` valida la restauración. `user.name` es presentación; `user.username` sigue identificando al usuario en el juego. Cerrar sesión limpia la sesión local y llama a `disableAutoSelect` si el SDK está cargado.

Un `409` muestra el mensaje del backend y no vincula cuentas por email. También se presentan errores de credencial, origen, configuración y servidor. Si falta el Client ID, se informa que Google no está disponible y sigue funcionando el formulario por email.

Verificación real: iniciar sesión dos veces y comprobar que se conserva el ID, recargar para validar `/auth/me`, revisar nombre y email en el perfil, cerrar sesión y verificar que se pierde el acceso protegido. Comprobar también un email ya registrado con contraseña, credencial inválida y SDK bloqueado. Estas pruebas requieren una cuenta y configuración de Google reales.

`node --test tests/google-auth.test.mjs` verifica con dependencias simuladas el endpoint y payload, rechazo por conflicto, almacenamiento exclusivo de la sesión de CharacterUs, nombre/username, logout, carga única del SDK, limpieza del callback y reintento tras fallo de carga. No autentica contra Google ni PostgreSQL.

Referencia: [API oficial de Google Identity Services](https://developers.google.com/identity/gsi/web/reference/js-reference).
