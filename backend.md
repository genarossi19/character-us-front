# Frontend Contract — CharacterUs Server

> Documento de referencia para el frontend. Todo lo que necesita saber para conectarse al backend: endpoints HTTP, eventos Socket.IO, tipos de datos, y flujo del juego.

---

## 1. Conexión general

| Parámetro              | Valor                                                    |
| ---------------------- | -------------------------------------------------------- |
| Servidor local         | `http://localhost:3000`                                  |
| CORS permitido         | `http://localhost:5173` (configurable vía `CORS_ORIGIN`) |
| Socket.IO transport    | `websocket` únicamente (no polling)                      |
| Socket.IO ping timeout | 60s                                                      |

---

## 2. HTTPS — REST API

Todas las respuestas de error en desarrollo incluyen un campo `error` con el mensaje interactivo. En producción solo se devuelve `message`.

### 2.1 Auth — `/api/auth`

#### `POST /api/auth/signup`

Registra un usuario nuevo.

**Request body:**

```json
{
  "username": "string (1-30 chars)",
  "email": "string (email válido)",
  "password": "string (mínimo 8 chars)",
  "confirmPassword": "string (debe coincidir con password)"
}
```

**Response 201:**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "gamesPlayed": 0,
    "gamesWon": 0,
    "timesImpostor": 0,
    "timesEliminated": 0,
    "isGuest": false
  },
  "token": "jwt string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Errores:**

- `400` — `{ message: "Datos inválidos", errors: { field: [msgs] } }`
- `409` — `{ message: "El email ya está registrado" }` o `{ message: "El username ya está en uso" }`
- `500` — `{ message: "Error al crear usuario" }`

---

#### `POST /api/auth/login`

**Request body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "gamesPlayed": 0,
    "gamesWon": 0,
    "timesImpostor": 0,
    "timesEliminated": 0,
    "isGuest": false
  },
  "token": "jwt string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Errores:**

- `400` — datos inválidos
- `401` — `{ message: "Credenciales inválidas" }`

#### JWT de acceso

El cliente recibe el token en el body de las respuestas de auth. Debe enviarlo
como `Authorization: Bearer <token>` únicamente en endpoints protegidos. Los
endpoints `login` y `signup` son públicos y no reciben este header.

El payload decodificado del token de acceso tiene esta forma:

```json
{
  "userId": "uuid",
  "username": "string",
  "email": "string",
  "gamesPlayed": 0,
  "gamesWon": 0,
  "timesImpostor": 0,
  "timesEliminated": 0,
  "tokenType": "access",
  "iat": 0,
  "exp": 0,
  "aud": "character-us-client",
  "iss": "character-us-server",
  "sub": "uuid",
  "jti": "uuid"
}
```

Decodificar un JWT en el cliente permite reconstruir la sesión visual, pero no
verifica su firma ni reemplaza la autorización del servidor. El cliente elimina
la sesión por pestaña si `exp` ya venció.

---

#### `GET /api/auth/me`

Confirma que el access token todavía es válido y que el usuario existe.

**Header requerido:** `Authorization: Bearer <token>`

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "gamesPlayed": 0,
    "gamesWon": 0,
    "timesImpostor": 0,
    "timesEliminated": 0,
    "isGuest": false
  }
}
```

**Errores:**

- `401` o `403` — token vencido, inválido o cuenta inexistente. El frontend limpia la sesión por pestaña y redirige a login.

---

### 2.2 Categorías — `/api/category`

#### `GET /api/category`

Obtiene todas las categorías. **Usar antes de `createRoom`** para obtener los UUIDs válidos.

**Response 200:**

```json
[{ "id": "uuid", "name": "string" }]
```

#### `GET /api/category/:id`

**Response 200:** Objeto categoría completa.
**Response 404:** `{ message: "Categoría no encontrada" }`

#### `POST /api/category` — Solo admin (requiere header `Authorization: Bearer <token>`)

**Request body:** `{ name: string, description?: string, status?: string }`

#### `PUT /api/category/:id` — Solo admin

#### `DELETE /api/category/:id` — Solo admin

---

### 2.3 Personajes — `/api/character`

#### `GET /api/character`

**Response 200:** Array de personajes.

```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string | null",
    "image": "string | null",
    "category_id": "uuid"
  }
]
```

#### `GET /api/character/category/:categoryId`

Personajes filtrados por categoría.

#### `GET /api/character/random/:categoryId`

Devuelve un personaje aleatorio de la categoría.

#### `GET /api/character/:id`

**Response 404:** `{ message: "Personaje no encontrado" }`

#### `POST /api/character` — Solo admin

**Request body:** `{ name: string, description?: string, imageUrl?: string, category_id: uuid }`

#### `PUT /api/character/:id` — Solo admin

#### `DELETE /api/character/:id` — Solo admin

---

### 2.4 Estadísticas — `/api/stats`

#### `GET /api/stats/leaderboard?limit=10&sort=games_won`

**Query params:**

- `limit` — 1-50 (default: 10)
- `sort` — `games_won` | `games_played` | `times_impostor` | `times_eliminated`

**Response 200:**

```json
[
  {
    "id": "uuid",
    "username": "string",
    "avatar_url": "string | null",
    "games_played": 0,
    "games_won": 0,
    "times_impostor": 0,
    "times_eliminated": 0
  }
]
```

#### `GET /api/stats/user/:id`

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "avatar_url": "string | null",
    "games_played": 0,
    "games_won": 0,
    "times_impostor": 0,
    "times_eliminated": 0,
    "created_at": "ISO date"
  },
  "recentGames": [
    {
      "user_id": "uuid",
      "game_id": "uuid",
      "was_impostor": false,
      "was_joker": false,
      "was_eliminated": false,
      "won": true,
      "game": {
        /* GameHistory */
      }
    }
  ]
}
```

---

## 3. Socket.IO

### 3.1 Conexión

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});
```

### 3.2 Estructura de respuestas (ack)

Todos los emits del cliente usan un callback `ack` con esta forma:

```ts
type AckSuccess<T = void> = { success: true; data?: T };
type AckError = { success: false; message: string; code: string };
type Ack<T> = (response: AckSuccess<T> | AckError) => void;
```

**Códigos de error comunes:**

| Code                   | Significado                                     |
| ---------------------- | ----------------------------------------------- |
| `ROOM_NOT_FOUND`       | La sala no existe                               |
| `ROOM_FULL`            | La sala está llena                              |
| `ROOM_ALREADY_STARTED` | La sala ya comenzó                              |
| `USERNAME_TAKEN`       | Nombre de usuario ya en uso en la sala          |
| `WRONG_PASSWORD`       | Contraseña incorrecta                           |
| `NOT_HOST`             | Solo el host puede realizar esta acción         |
| `INVALID_PHASE`        | Acción no válida en la fase actual              |
| `PLAYER_NOT_FOUND`     | Jugador no encontrado                           |
| `PLAYER_NOT_ALIVE`     | Jugador eliminado no puede realizar esta acción |
| `ALREADY_SUBMITTED`    | Ya enviaste tu palabra                          |
| `ALREADY_VOTED`        | Ya votaste en esta ronda                        |
| `ALREADY_READY`        | Ya marcaste listo                               |
| `INVALID_TURN`         | No es tu turno                                  |
| `CANNOT_VOTE_SELF`     | No puedes votarte a ti mismo                    |
| `CANNOT_VOTE_DEAD`     | No puedes votar a un jugador eliminado          |
| `FLOOD_LIMIT`          | Mensajes enviados muy rápido                    |
| `MIN_PLAYERS`          | Jugadores insuficientes                         |
| `INTERNAL_ERROR`       | Error interno del servidor                      |

### 3.3 Tipos de datos

```ts
type GamePhase =
  | "waiting"
  | "character"
  | "word"
  | "debate"
  | "voting"
  | "results"
  | "finished";
type GameMode = "classic" | "anonymous" | "special";

interface RoomSettings {
  category: string; // UUID de categoría (obtener de GET /api/category)
  impostorCount: number; // default: 1
  totalRounds: number; // default: 3
  maxPlayers: number; // 3-10, default: 10
  privacy: "public" | "private";
  mode: GameMode;
  impostorsKnowEachOther: boolean;
  visibleVotes: boolean;
  password?: string; // requerido si privacy === "private"
}

interface PlayerPublic {
  socketId: string;
  userId: string | null;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  isGuest: boolean;
  isAlive: boolean;
  isOnline: boolean;
  hasVoted: boolean;
  isDebateReady: boolean;
}

interface RoomPublic {
  id: string; // UUID
  code: number; // 6 dígitos (100000-999999)
  hostId: string; // socketId del host
  name: string;
  settings: RoomSettings;
  players: PlayerPublic[];
  status: "waiting" | "playing" | "finished";
  gamePhase: GamePhase;
  currentRound: number;
}

interface ChatMessage {
  id: string;
  senderId: string; // "system" para mensajes del sistema, socketId del jugador para player/ghost
  senderName: string; // "Sistema" para system
  message: string;
  type: "player" | "ghost" | "system";
  timestamp: number; // Date.now()
}

interface WordHint {
  playerId: string;
  username: string;
  word: string;
  revealed: boolean;
  skipped: boolean;
}

interface CharacterAssignment {
  character: {
    id: string;
    name: string | null; // null si eres impostor
    imageUrl: string | null; // null si eres impostor
    category: string;
  } | null; // null = eres impostor, no conoces al personaje
  isImpostor: boolean;
  impostorIds?: string[]; // solo en modo special para jokers
}

interface RoundResult {
  round: number;
  eliminatedPlayer: PlayerPublic | null;
  wasImpostor: boolean;
  wasJoker: boolean;
  votes: Record<string, string>; // voterId → targetId
  wordHints: WordHint[];
}

interface GameResult {
  winner: "crew" | "impostor";
  rounds: RoundResult[];
  players: PlayerPublic[];
}
```

---

### 3.4 Cliente → Server (emits)

Todos reciben un payload y un `ack` callback.

#### `createRoom`

Crea una sala y une al creador como host.

**Payload:**

```ts
{
  username: string;
  token: string;
  settings: RoomSettings;
  avatarUrl?: string;
}
```

**ack data:**

```ts
{
  room: RoomPublic;
}
```

**Errores comunes:** `INVALID_USERNAME`, `INVALID_SETTINGS`, `INVALID_CATEGORY`

---

#### `joinRoom`

Une al jugador a una sala existente por código.

**Payload:**

```ts
{
  code: number;           // código de 6 dígitos
  username: string;
  isGuest: boolean;
  avatarUrl?: string;
  userId?: string;        // si está logueado
  password?: string;      // si la sala es privada
}
```

**ack data:**

```ts
{
  room: RoomPublic;
}
```

---

#### `leaveRoom`

**Payload:** `{ roomId: string }`

Si el host abandona, la sala se cierra para todos.

---

#### `startGame`

Solo el host puede iniciar. Se requieren mínimo 3 jugadores.

**Payload:** `{ roomId: string }`

**ack data:** `{ room: RoomPublic }`

---

#### `kickPlayer`

Solo el host puede expulsar.

**Payload:** `{ roomId: string; targetId: string }`

---

#### `submitWord`

Enviar palabra en la fase `word`. Solo se puede cuando es tu turno.

**Payload:**

```ts
{
  roomId: string;
  word: string; // máximo 20 caracteres
}
```

**Errores:** `INVALID_PHASE`, `INVALID_TURN`, `ALREADY_SUBMITTED`, `PLAYER_NOT_ALIVE`

---

#### `votePlayer`

Votar en la fase `voting`. Un voto por ronda, no se puede cambiar.

**Payload:**

```ts
{
  roomId: string;
  targetId: string; // socketId del jugador a votar
}
```

**Errores:** `INVALID_PHASE`, `ALREADY_VOTED`, `CANNOT_VOTE_SELF`, `CANNOT_VOTE_DEAD`

---

#### `sendChatMessage`

Enviar mensaje de chat en fase `debate` o `voting`. Los mensajes de jugadores eliminados (ghost) solo son visibles para otros eliminados.

**Payload:**

```ts
{
  roomId: string;
  message: string; // máximo 500 caracteres
}
```

**Errores:** `FLOOD_LIMIT` (máx 1 mensaje cada 2s), `INVALID_PHASE`, `INVALID_MESSAGE`

---

#### `debateReady`

Marcar "listo" en la fase `debate`. Cuando todos los vivos marcan listo, se avanza a voting.

**Payload:** `{ roomId: string }`

---

#### `changeAvatar`

Cambiar el avatar del jugador en la sala. El backend valida que la URL sea uno de los 8 avatares permitidos (`/avatar1.webp` a `/avatar8.webp`) y que no esté ocupado por otro jugador en la misma sala.

**Payload:**

```ts
{
  roomId: string;
  avatarUrl: string; // "/avatar1.webp" a "/avatar8.webp"
}
```

**ack data:** `{ success: true }` o `{ success: false, code, message }`

**Errores comunes:** `AVATAR_TAKEN`, `AVATAR_INVALID`

Después de un cambio exitoso, el backend emite `roomUpdated` con la sala completa a todos los jugadores. El frontend actualiza el avatar de forma optimista y el `roomUpdated` sincroniza el estado real del servidor.

---

### 3.5 Server → Client (listeners)

#### `roomUpdated`

Se emite cuando cambia la composición de la sala (jugador entra/sale) o cuando un jugador cambia su avatar. Contiene la sala completa.

```ts
(room: RoomPublic) => void
```

---

#### `playerJoined`

Nuevo jugador se une a la sala.

```ts
(player: PlayerPublic) => void
```

---

#### `playerLeft`

Jugador sale de la sala (o es expulsado). El `playerId` es el `socketId`.

```ts
(playerId: string) => void
```

---

#### `playerKicked`

Este socket fue expulsado. El `playerId` es tu propio `socketId`.

```ts
(playerId: string) => void
```

---

#### `roomClosed`

La sala fue cerrada (host abandonó o expulsó a todos).

```ts
{ reason: string } => void
```

---

#### `gameStarted`

El juego comenzó. Se reinician contadores y estado.

```ts
{ room: RoomPublic; totalRounds: number } => void
```

---

#### `characterAssigned`

Asignación de personaje. **El impostor recibe `character: null`** — no conoce al personaje.

```ts
(data: CharacterAssignment) => void
```

---

#### `phaseChanged`

Cambios de fase del juego.

```ts
{ phase: GamePhase; data?: Record<string, unknown> } => void
```

**Fases en orden:**

1. `character` (6s) — se asignan personajes
2. `word` — turnos individuales (60s por jugador)
3. `debate` (40s) — chat abierto, marcar "listo"
4. `voting` (40s) — votación
5. `results` (5s) — se muestra resultado
6. Vuelve a `character` o `finished`

---

#### `turnChanged`

Indica de quién es el turno en la fase `word`.

```ts
{
  playerId: string;    // socketId del jugador en turno
  username: string;
  turnIndex: number;   // 0-based
  total: number;       // total de jugadores en turno
} => void
```

---

#### `wordHintRevealed`

Se emite cuando un jugador envía su palabra (o expira el tiempo). **Incluye la palabra.**

```ts
{
  playerId: string;
  username: string;
  word: string;        // la palabra dicha, o "Sin palabra" si expiró
  skipped: boolean;    // true si no contestó
} => void
```

---

#### `allWordsSubmitted`

Todas las palabras fueron reveladas. Incluye el array completo.

```ts
{ hints: WordHint[] } => void
```

---

#### `debateReadyUpdate`

Actualización de quiénes marcaron "listo" en debate.

```ts
{
  readyPlayers: string[];   // socketIds de los que marcaron listo
  total: number;            // total de jugadores vivos
} => void
```

---

#### `voteUpdate`

Se emite cuando alguien vota.

```ts
{
  votes: Record<string, string>;  // voterId → targetId
  voterId: string;                // quién votó
  targetId?: string;              // a quién votó (solo si visibleVotes === true)
  visible: boolean;               // si los votos son visibles
} => void
```

**Nota:** El servidor también envía un `chatMessage` del tipo `system` informando del voto.

---

#### `playerEliminated`

Jugador eliminado al final de una ronda.

```ts
{
  player: PlayerPublic;
  wasImpostor: boolean;
} => void
```

---

#### `roundResults`

Resultado de la ronda actual.

```ts
(result: RoundResult) => void
```

---

#### `gameEnded`

El juego terminó. Se incluyen todos los resultados y el ganador.

Actualización coordinada: el resultado incluye `impostorIds: string[]`, con los IDs estables de todos los impostores. Se revela únicamente al finalizar y antes de limpiar los roles del lobby. `winner` es `"innocent" | "impostor"`; los jugadores públicos siguen sin campos de rol.

```ts
(result: GameResult) => void
```

---

#### `chatMessage`

Mensaje de chat (puede ser de jugador, ghost, o sistema).

```ts
(message: ChatMessage) => void
```

**Tipos de mensaje en el chat:**

| type     | Emisor            | Visibilidad                                                 |
| -------- | ----------------- | ----------------------------------------------------------- |
| `system` | Servidor          | Todos — mensajes de fase, votos, eliminación                |
| `player` | Jugador vivo      | Todos los vivos + fantasmas (pero fantasmas no los reciben) |
| `ghost`  | Jugador eliminado | Solo otros jugadores eliminados                             |

**Mensajes automáticos del sistema:**

- "Fase de debate: discutan quién es el impostor"
- "Voten por el jugador que creen que es el impostor"
- "{username} ha votado a {target}" (o "{username} ha votado" si `visibleVotes` es false)
- "{username} ha votado a {target}. Quedan N votantes"
- Resultado de eliminación

---

#### `reconnectTimeout`

Aviso de reconexión pendiente. Se emite cuando un jugador se desconecta durante la partida.

```ts
{
  playerId: string;
  secondsLeft: number;   // tiempo restante antes de ser eliminado
} => void
```

Timeout de reconexión: **60 segundos**.

---

## 4. Flujo del juego (resumen para UI)

```
waiting → character (6s) → word → debate (40s) → voting (40s) → results (5s) → character (siguiente ronda) → ... → finished
```

1. **waiting** — sala de espera, host configura y arranca
2. **character** — se asignan personajes (6s para verlos)
3. **word** — turnos individuales, cada jugador dice una palabra (60s por turno)
4. **debate** — chat abierto, discusión, botón "Listo" para saltar
5. **voting** — votación, 40s, un voto por persona, no se puede cambiar
6. **results** — 5s mostrando quién fue eliminado
7. Vuelve a **character** (siguiente ronda) o **finished** (si terminaron las rondas)

### Constantes del juego

```ts
MIN_PLAYERS: 3;
MAX_PLAYERS: 10;
WORD_TURN_TIMEOUT: 60_000; // 60s por turno en fase word
RECONNECT_TIMEOUT: 60_000; // 60s para reconectar
CHAT_MAX_LENGTH: 500; // caracteres máximo por mensaje
CHAT_FLOOD_LIMIT: 2_000; // ms entre mensajes
WORD_MAX_LENGTH: 20; // caracteres máximo por palabra
```

### Configuración de fases (duración)

```ts
character: 6_000; // 6 segundos
word: 0; // controlado por turnos individuales (60s cada uno)
debate: 40_000; // 40 segundos (se puede saltar con "Listo")
voting: 40_000; // 40 segundos
results: 5_000; // 5 segundos
```

### Modos de juego

| Modo        | Descripción                                                     |
| ----------- | --------------------------------------------------------------- |
| `classic`   | 1 impostor, tripulación vs impostor                             |
| `anonymous` | Igual que classic pero los votos no muestran quién votó a quién |
| `special`   | Incluye Joker (neutral) que gana si es eliminado                |

---

## 5. Notas de implementación

- **Socket normal; evento protegido.** No hay autenticación durante el handshake Socket.IO. El evento `createRoom` valida su `payload.token`; no debe enviarse por query string ni `auth` del handshake.
- **Room ID vs Code:** `RoomPublic.id` es el UUID interno (se usa para `startGame`, `kickPlayer`, `submitWord`, etc). `RoomPublic.code` es el código numérico de 6 dígitos que se comparte para unirse.
- **Estado en memoria.** Las salas, jugadores, turnos, votos y chat en vivo están en memoria del servidor. Se persiste solo el resultado final de la partida en `game_history` y `game_players`.
- **Chat durante debate y voting.** Los mensajes de jugadores eliminados (`ghost`) solo son visibles para otros eliminados. El sistema envía automáticamente mensajes al cambiar de fase y al votar.
- **Impostor no ve personaje.** El `characterAssigned` envía `character: null` al impostor. El frontend debe mostrar "Eres impostor — no conoces al personaje".
- **Votos visibles.** Si `settings.visibleVotes` es `true`, el `voteUpdate` incluye `targetId`. Si es `false`, solo se sabe que alguien votó (sin saber a quién).
- **Debate "Listo".** Cuando todos los jugadores vivos marcan `debateReady`, la fase avanza inmediatamente a voting sin esperar los 40s.

---

## 6. Crear una sala con sesión JWT

La conexión Socket.IO y la autenticación son pasos distintos:

1. El frontend registra o inicia sesión por HTTP.
2. El backend devuelve `user`, `token`, `tokenType: "Bearer"` y `expiresIn`.
3. El frontend conserva la sesión y abre una conexión Socket.IO normal.
4. Al emitir `createRoom`, el frontend envía el JWT en `payload.token`.
5. El backend verifica token, expiración, emisor, audiencia y existencia del usuario en Supabase antes de crear la sala.

El JWT se valida solo en `createRoom`, no durante `io(...)`. No enviarlo por URL, query string, logs ni `auth` del handshake.

### 6.1 Sesión HTTP

`POST /api/auth/signup` y `POST /api/auth/login` devuelven `SessionResponse` con el usuario autenticado, access token Bearer y `expiresIn: 3600`. El frontend guarda usuario, token y claims necesarios en memoria; para restaurar la pestaña puede persistirlos únicamente en `sessionStorage` bajo `characterus.session`.

No guardar `password`, `confirmPassword`, `password_hash` ni el JWT en `localStorage`.

### 6.2 Restaurar una sesión

Antes de considerar activa una sesión persistida, el frontend debe llamar a `GET /api/auth/me` con `Authorization: Bearer <token>`. Una respuesta correcta actualiza el usuario local; `401` o `403` implican limpiar `sessionStorage` y llevar al usuario a login.

### 6.3 Payload y resultado de `createRoom`

```ts
{
  // Debe ser el username del perfil autenticado, nunca un input editable.
  username: string;
  token: string;
  avatarUrl?: string;
  settings: RoomSettings;
}
```

Si tiene éxito, el ack devuelve `{ success: true, data: { room } }`; el cliente guarda la sala y navega al lobby.

### 6.4 Errores de `createRoom`

| Código | Acción de frontend |
| --- | --- |
| `AUTH_REQUIRED` | Limpiar sesión y llevar a login. No existe token en el payload. |
| `AUTH_INVALID` | Limpiar sesión y llevar a login. El token venció, es inválido o la cuenta ya no existe. |
| `USERNAME_MISMATCH` | Usar el username de la sesión autenticada; nunca tomarlo de un input editable. |
| `INVALID_CATEGORY` | Pedir que seleccione una categoría obtenida de `GET /api/category`. |
| `INVALID_SETTINGS` | Mostrar los campos de configuración que requieren corrección. |
| `INTERNAL_ERROR` | Mostrar `ack.message` y permitir reintento. |

El token dura una hora. Si vence mientras el usuario está en lobby, no reintentar `createRoom` con el mismo token: solicitar un nuevo inicio de sesión. En producción, `VITE_API_URL` debe usar `https://`; Socket.IO usará `wss://` automáticamente.
