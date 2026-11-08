Cuándo leer este documento: creas o renombras un componente, hook, context, service o método de service, o defines una ruta `/api`.
Origen: AGENTS.md original §3 y regla 7.

# Convención de nombres

**Componentes:** `PascalCase.jsx`. Un componente = un archivo. Sin lógica de fetch dentro de `components/`; eso vive en `features/` o `services/`.

**Hooks:** `useNombre.js`, camelCase, prefijo `use`.

**Contexts:** `NombreContext.jsx`, PascalCase + sufijo `Context`.

**Services:** `dominioService.js`, camelCase + sufijo `Service`. Un service por recurso de dominio (no por endpoint suelto).

**Métodos dentro de un service:** patrón `verbo + Recurso`:

| Verbo                 | Uso                                          |
| --------------------- | -------------------------------------------- |
| `get`                 | obtener uno por id                           |
| `list`                | obtener colección (con filtros/paginación)   |
| `create`              | crear                                        |
| `update`              | editar                                       |
| `remove`              | eliminar                                     |
| `join` / `leave`      | entrar/salir de sala                         |
| `vote`                | votar (ej. skip)                             |
| `follow` / `unfollow` | seguir/dejar de seguir                       |

Ejemplos: `roomsService.js` → `searchRooms({query,sort,order})`, `getRoomById(id)`, `createRoom(data)`, `joinRoom(code, password?)`, `voteSkip(roomId)`.

**Rutas API (REST, backend):** base `/api`, recursos en plural, minúsculas, sin verbos:

```
/api/songs
/api/songs/:id
/api/playlists
/api/playlists/:id/songs
/api/rooms
/api/rooms/:id/members
/api/rooms/:id/vote-skip
/api/users
/api/users/:id/follow
/api/recommendations
```

**Estado global:** un Context por dominio transversal (Player, Auth). Estado de feature específica queda local a esa feature (useState/useReducer dentro de `features/x`).

## Reglas relacionadas

- Toda llamada a red pasa por `services/`, nunca `fetch` directo dentro de un componente.
- Nuevo archivo de servicio → agregar su convención de nombres a este documento (regla 7).