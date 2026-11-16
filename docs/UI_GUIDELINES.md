# Convenciones de interfaz

## Botones: el login es la referencia

Usar `BackButton` y `FormActionButton` de `src/components/ui/form-actions.tsx` para navegación de retorno y acciones principales de formularios. Login, Registrarse y Unirse ya comparten estos componentes; al crear o renovar otras pantallas se deben reutilizar, conservando los handlers del flujo.

| Uso | Variante | Tamaño | Tipografía | Radio |
| --- | --- | --- | --- | --- |
| Volver | `ghost` | `lg`: alto 40 px, padding horizontal 32 px | 18 px, semibold | `rounded-md` |
| Acción principal de formulario | `default` | `lg`: alto 40 px, padding horizontal 32 px, ancho completo | 18 px, semibold | `rounded-md` |
| Cambiar tema | `ThemeToggleButton` sin overrides de tamaño | `icon`: 36 × 36 px | Icono original | Radio del componente |

“Volver” usa el texto `← Volver`. Sobre superficies del tema usa `text-foreground`, también en hover. Solo sobre un fondo explícitamente oscuro, pasar `onDarkBackground` para usar texto claro. Nunca fijar texto blanco en navegación sobre fondos claros. El cambio de tema y el acceso a sesión deben seguir el color de la superficie. No sustituirlo por una flecha de otro tamaño. Las acciones principales usan `tone="accent"` en Login, Registrarse y Unirse (verde agua); `tone="primary"` queda disponible para acciones secundarias de marca que requieran coral. El tono verde agua usa texto blanco en ambos temas, según la decisión visual del producto. Ambas opciones mantienen exactamente los mismos tamaños y radio; elegir el tono mediante la API compartida, sin clases locales. El navbar de Unirse conserva Volver, Iniciar sesión para visitantes y cambio de tema; en móvil puede distribuirlos en dos filas sin achicar sus botones. Los iconos opcionales de acción/carga miden 16 px. `FormActionButton` usa `type="button"` por defecto; dentro de un formulario pasar explícitamente `type="submit"`.

No sobrescribir altura, padding, radio, tamaño de fuente ni escalarlos con breakpoints. Adaptar el contenedor a la resolución y mantener las etiquetas breves para que quepan en móvil (por ejemplo, “Uniéndose…”). El estado deshabilitado, el foco y el hover provienen del componente base. El comportamiento de Volver se pasa mediante `onClick`: no todas las pantallas deben usar `navigate(-1)`.

## Espaciado y escala del contenido

Usar los tokens `--page-*` y clases `page-container`, `page-gutter` y `page-padding` de `src/index.css`. Los títulos, ilustraciones y campos pueden crecer según el espacio disponible; no se debe reducir toda la UI para hacerla caber. Los botones conservan la escala común indicada arriba.

## Código de sala

`RoomCodeInput` presenta seis casillas con un único input accesible: permite pegar y continuar con Enter. La escritura es secuencial: añade números a la derecha y Backspace/Delete retiran el último; tocar una casilla no cambia la posición de edición. El código sigue siendo un PIN de sala, no un OTP de autenticación; no usar `autocomplete="one-time-code"`. Cada cifra aparece con Motion en 120 ms; respetar movimiento reducido.

## Login y pantallas de acceso

Usar el fondo del tema y `text-foreground` en la navegación. Unirse conserva un panel compacto con cabecera; el login aprovecha el ancho de escritorio con marca e ilustración lateral y formulario al lado. El bloque derecho alinea título, botón oficial de Google, campos apilados y acción principal en una única columna de hasta 400 px; en móvil se adapta al ancho disponible y la decoración se reduce a la marca. Adaptar primero la composición y el espacio decorativo a la altura disponible, sin achicar botones o tipografía ni ocultar contenido con overflow. La entrada usa una animación breve que respeta movimiento reducido. Los campos tienen etiquetas visibles, autocompletado apropiado e iconos de apoyo; el control de mostrar contraseña debe ser `type="button"` y tener etiqueta accesible.

Durante el acceso, conservar montado el formulario (incluido Google) y bloquearlo con `inert`, mostrando la carga existente. Ante rechazo conservar los datos, mostrar un error junto al formulario y enfocarlo; no depender solo de un toast. Los tamaños y variantes de las acciones principales siguen los componentes compartidos.

## Escala de campos de cuenta

Login toma Registrarse como referencia: reutilizar `Input` con su altura base de 48 px y fuente de 16 px, sin `!text-lg`, alturas de 56/64 px ni fondos extra por pantalla. Etiquetas de 16 px, iconos de 20 px y padding izquierdo de 40 px cuando hay icono. Los campos de código segmentado son una excepción visual, no una referencia para correo o contraseña. En acceso predomina el verde agua; coral se reserva para detalles secundarios y los errores mantienen su color semántico.

## Registro con más campos

Registrarse comparte verde agua, controles, botón oficial de Google y bloque de 400 px del login, pero invierte la composición en escritorio: formulario a la izquierda y una mesa de juego con asientos, personaje oculto y tarjeta de jugador a la derecha. `SignupIllustration` es SVG nativo, con una entrada breve y una vista decorativa del nombre escrito; no representa una credencial ni una invitación real. No repetir la pareja de avatares del login sustituyendo sus imágenes. En escritorio se agrupan Usuario/Correo y Contraseña/Confirmación en dos filas de dos campos; ayuda, términos y acción ocupan todo el ancho del grupo. En móvil los cuatro campos se apilan sin reducir su altura o fuente. Se permite que el documento crezca cuando aparecen errores o falta altura: no esconder términos, errores o acciones con overflow.

Mantener validación y payload de registro existentes. Mostrar errores del servidor junto al formulario y conservar todos los datos al fallar. Durante el envío mantener Google y formulario montados e inertes, con indicador de carga. Mostrar/ocultar cada contraseña actúa de forma independiente y nunca envía el formulario.

## Transición entre Login y Registrarse

Los enlaces entre estas pantallas usan `useAuthNavigation`, no una recarga ni navegación directa. En escritorio con View Transition API, `auth-visual` conserva su identidad y viaja de izquierda a derecha al registrarse, y de derecha a izquierda al volver al login; el formulario se desvanece durante el barrido. `auth-frame` mantiene el marco alineado. Duración: 600 ms. No combinar otra animación de entrada de Motion con este intercambio.

En móvil, con movimiento reducido o sin soporte del navegador, se mantiene navegación SPA sin barrido. Conservar foco en el nuevo título, limpiar la marca temporal de transición y no montar ambos botones de Google simultáneamente. El cambio solo afecta presentación: rutas, autenticación y estados privados siguen sus contratos actuales.

## Crear partida y resumen

Agrupar ajustes por propósito: partida, jugadores/roles y acceso/reglas. Usar radio tiles para elecciones excluyentes cortas, select para catálogos/modos, contador acotado para impostores e interruptores con etiqueta para reglas booleanas. Mantener controles de 48 px y acciones compartidas; no comprimir tipografía para evitar scroll.

El resumen deriva del mismo objeto que se envía, queda al costado con posición sticky en escritorio y se apila después del formulario en móvil. Mostrar categoría, capacidad, impostores, modalidad, privacidad y reglas; mantener Crear/Cancelar juntos y visibles en escritorio. Nunca mostrar contraseña ni un código de sala ficticio antes de la confirmación. No crear ajustes visualmente independientes que escriban en el mismo campo (como el antiguo Virtual/Presencial sobre `mode`).

## Sala de espera

Mostrar solo los participantes presentes, con un único contador de ocupación y sin placeholders ni tarjetas de invitación por lugar. Dar protagonismo a los avatares, con fondos suaves y una entrada breve; evitar acumular contadores, bordes, mensajes promocionales o instrucciones repetidas. Identificar al anfitrión con una sola etiqueta visible y a la persona local con Tú. Conexión y preparación se expresan con texto además de color.

El selector de avatares debe permanecer a la vista y permitir selección directa, con ocupado y seleccionado, sin carga visible. No esconderlo detrás de un botón o diálogo. Anticipar inmediatamente el avatar propio en selector y tarjeta; ante rechazo volver al anterior y mostrar `toast.error`. Mantener el store autoritativo sin cambios optimistas; los demás clientes se actualizan por eventos. Ajustar la distribución al número de participantes y al espacio disponible, manteniendo legibles los nombres y cómodos los controles.

Agrupar invitación y resumen en un solo panel lateral en escritorio y apilarlo en móvil. Código, QR y acciones de copiar/compartir bastan; mostrar la alternativa seleccionable del enlace si falla la copia. No incluir contraseña ni credenciales. Preparación, expulsión y salida esperan al servidor; una operación fallida permite reintentar. La expulsión conserva confirmación dentro de la interfaz y solo la realiza el anfitrión.

## Tipo de partida presencial

Presencial se configura con `playMode`, separado de `mode`. Resumirlo en creación y lobby. En partida no mostrar inputs de palabra, chat ni pistas escritas: el turno propio tiene Listo, los demás esperan y los eliminados observan. La columna lateral y el diálogo móvil son Actividad, con estado público, turnos completados, votos autorizados y resultados. Debate se explica como conversación oral; la votación permanece en la app. No avanzar turnos localmente ni inventar palabras para reutilizar `submitWord`.
