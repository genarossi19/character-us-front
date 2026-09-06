# CharacterUs Frontend

## Read First

- Read `README.md`, `docs/ARCHITECTURE.md`, `SOCKET.md`, and `docs/RECOMMENDATIONS.md` before changing flows or contracts.
- This is currently a UI/gameplay prototype with partial backend integration; do not describe mocked screens as real-time features.
- The external backend is Express with PostgreSQL/Supabase, but its source and schema are not in this repository. Confirm event/API contracts there rather than inferring them from `ClassDiagram.mmd`.

## Commands

- Use npm and the committed lockfile: `npm ci`, then `npm run dev`.
- Vite 7 requires Node.js `20.19+` or `22.12+`.
- Full checks are `npm run lint` and `npm run build`; build runs `tsc -b` before Vite.
- Focused app typecheck: `npx tsc -p tsconfig.app.json --noEmit --incremental false`.
- There is no automated test script. `src/test` is a production-compiled manual diagnostic UI exposed at `/test`, not a test suite.
- The baseline is not green as of 2026-09-05; compare failures with `docs/RECOMMENDATIONS.md` and do not fix unrelated issues implicitly.

## Runtime Boundaries

- `src/main.tsx` owns `StrictMode`, `BrowserRouter`, and global toasts; `src/App.tsx` owns routes and the theme provider.
- `App.tsx`, `CreateRoomPage`, and `GameScreen` currently hold separate mock models. Navigation does not transfer a canonical room or game session.
- Login/signup, public rooms, quick join, lobby, gameplay, voting, and chat are simulated in production pages. Only the theme persists (`localStorage` key `vite-ui-theme`).
- Socket/API integration is exercised mainly by `src/test/CompleteFlowTest.tsx`; it needs a real backend and two browser tabs for host/guest sockets.
- `BrowserRouter` deployment requires an `index.html` fallback for direct route loads.

## Backend Integration

- `src/services/socket/socket.ts` is the only socket connection factory; do not create component-local `io()` clients.
- Socket URL is `VITE_SOCKET_URL`, defaulting to `http://localhost:3000`.
- HTTP is independently hardcoded to `http://localhost:3000/api` in `src/services/api/category.ts`; changing `VITE_SOCKET_URL` does not change API requests.
- Socket listeners and hooks require explicit cleanup. Preserve exact callback identity when unsubscribing, especially under React `StrictMode`.
- Two incompatible `emitStartGame` functions exist in room/game emitters, and their barrel re-export is a known build error. Confirm the backend contract before consolidating them.
- The diagnostic listens for `updatePlayers`, while domain helpers expose `playerJoined`/`roomUpdated`; do not normalize event names without checking the backend.
- No Socket.IO chat contract exists yet. The visible chat is local state only.
- Treat character assignment, impostor status, votes, and elimination as server-authoritative when integrating; do not preserve the current client randomness as domain behavior.

## UI And Imports

- `@/*` is configured in Vite and intended for `src/*`, but `tsconfig.app.json` currently places alias fields incorrectly; an alias working in dev may still fail build.
- Reuse `src/components/ui` and aliases from `components.json`; files under `animate-ui`/shadcn include generated patterns that currently trigger some Fast Refresh lint rules.
- Preserve the existing controlled boundary: `GameScreen` owns voting state and `VotingPanel` renders/dispatches it.
- Do not assume mobile support for `GameScreen`; its fixed `w-96` chat rail is a documented limitation.

## Change Discipline

- Decide canonical room/session ownership and route identity before adding a global store or wiring all screens at once.
- Do not silently repair game rules: tie behavior, elimination persistence, round transitions, reconnect recovery, and room-code format need product decisions.
- Keep prototype, diagnostic, and integrated behavior explicitly labeled; do not delete unused integration components without checking whether they are work in progress.
- If routes, environment variables, event names, payloads, state ownership, commands, or integration status change, update the corresponding `README.md`, `docs/ARCHITECTURE.md`, `SOCKET.md`, and `docs/RECOMMENDATIONS.md` in the same change.
