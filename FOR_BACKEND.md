# Coordinación con el backend

El contrato activo vive en [el servidor](https://github.com/genarossi19/character-us-server/blob/developer/frontend.md). Agregar aquí los cambios de integración en curso y retirar su entrada cuando estén publicados en ambos repositorios.

- **Clásico y Anónimo.** Los cambios funcionales están implementados en ambos checkouts locales y siguen pendientes de commit. Al crear una sala, Clásico fija `impostorsKnowEachOther` y `visibleVotes` en `true` y Anónimo en `false`. Especial conserva su comportamiento. Al integrar, verificá los ajustes confirmados, los IDs privados de compañeros, el voto propio y la ausencia de objetivos ocultos en eventos, resultados y snapshots.
