# Guía de interfaz

- Reutilizá `src/components/ui` y los tokens `--page-*` de `src/index.css`. Adaptá la composición y permití scroll antes de reducir controles o tipografía. Conservá foco visible, movimiento reducido y etiquetas accesibles.

## Formularios

- `BackButton` y `FormActionButton` de [`form-actions.tsx`](../src/components/ui/form-actions.tsx) definen el tamaño compartido de 40 px, fuente de 18 px y `rounded-md`. Usá `tone="accent"` para acciones principales y `type="submit"` explícito al enviar. “← Volver” usa el color de la superficie; `onDarkBackground` aplica en fondos oscuros explícitos.
- Los campos de cuenta usan `Input` de 48 px y 16 px, etiquetas visibles, autocompletado y botones de contraseña independientes. El login usa formulario de hasta 400 px con marca a la izquierda en escritorio; registro invierte la composición y apila los cuatro campos en móvil.
- Mantené el formulario y Google montados durante el envío. Bloqueá con `inert`, conservá los datos al fallar y enfocá el error junto al formulario.
- Usá `useAuthNavigation` entre Login y Registrarse. Conservá `auth-visual` y `auth-frame` en la transición de escritorio de 600 ms, y el foco en el título. Móvil, movimiento reducido y navegadores sin soporte usan navegación SPA directa.
- `RoomCodeInput` presenta seis casillas con un input accesible. Conservá pegado, Enter, edición secuencial y el comportamiento de PIN de sala.

## Creación y lobby

- Agrupá los ajustes por partida, jugadores y acceso. Usá opciones excluyentes para selecciones cortas, select para catálogos y contador para impostores. El resumen deriva del mismo estado que se envía. Mostralo al costado en escritorio y debajo en móvil. Mostrá código solo tras confirmar la sala y mantené la contraseña fuera del resumen.
- Mostrá participantes presentes, un contador de ocupación y una etiqueta de anfitrión. Expresá preparación y conexión también con texto. El selector de avatares permanece visible, con estados ocupado y seleccionado y acceso por teclado.
- Reuní invitación y resumen de reglas en un panel. Mantené código, QR y copia/compartir, con enlace seleccionable si falla el portapapeles. Expulsar requiere confirmación en la interfaz.

## Partida

- Mantené visibles fase, turno y tiempo. En línea, mostrale las pistas a la sala a medida que llegan y mantené el chat accesible en un panel lateral o diálogo móvil que conserve el borrador.
- En presencial, usá **Ya dije mi palabra** para quien tiene el turno, debate oral y actividad pública en lugar del chat. Conservá la votación en la app.
