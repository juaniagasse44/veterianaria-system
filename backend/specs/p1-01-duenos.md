# P1-01 · Dueños (clientes)

> **Fase 1 (MVP).** Owner: Juan. Depende de: F-02 (auth).
> Primer módulo de negocio. Es la base sobre la que se apoyan las mascotas
> (P1-02) y, a través de ellas, los turnos y la historia clínica.

---

## Objetivo
Entidad **`Owner` (dueño / cliente)** persistente: los datos de contacto de la
persona que trae a su mascota. CRUD completo con búsqueda, protegido por
autenticación. Es la entidad "raíz" del árbol: un dueño tiene muchas mascotas.

## Historias de usuario
- Como empleado, doy de alta un dueño con sus datos de contacto cuando viene por
  primera vez a la veterinaria.
- Como empleado, busco un dueño por nombre, teléfono o documento para encontrarlo
  rápido cuando llama o viene al mostrador.
- Como empleado, veo la ficha de un dueño con sus mascotas asociadas (las mascotas
  llegan en P1-02; acá se deja la relación preparada).
- Como admin, puedo dar de baja un dueño, pero no si tiene mascotas con actividad
  (regla que se completa cuando existan mascotas/turnos).

## Alcance
- **Incluye:** CRUD de dueños; búsqueda por nombre / teléfono / documento;
  baja lógica (soft delete con `active`); validación de datos; todos los endpoints
  protegidos por JWT (F-02).
- **Fuera de alcance:** las mascotas (P1-02) — acá solo se deja la relación
  preparada del lado del dueño; historial de contacto/notas largas; múltiples
  direcciones. _Se mantiene enfocado en los datos de contacto esenciales._

## Decisiones locales
- **D1 — Documento opcional pero único si está presente.** El DNI/documento no es
  obligatorio (a veces no lo tienen a mano), pero si se carga, no puede repetirse
  (índice único parcial). _Evita dueños duplicados sin trabar el alta rápida._
- **D2 — Baja lógica, no física.** Borrar un dueño lo marca `active = false`, no
  lo elimina de la base. _Razón: preserva integridad histórica (sus mascotas y
  turnos pasados siguen teniendo sentido). El ledger de la clínica no se borra._
- **D3 — Quién puede qué.** Crear, editar y ver: `ADMIN` y `EMPLOYEE`. Dar de
  baja (soft delete): solo `ADMIN`. _Recepción gestiona el día a día; borrar es
  acción sensible._
- **D4 — Teléfono como string.** El teléfono se guarda como texto, no como
  número (puede tener 0, +54, guiones, etc.). _Nunca guardar teléfonos como int._

## Modelo de datos

### `owners`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| full_name | varchar(150) NOT NULL | nombre y apellido |
| document | varchar(30) null | DNI/documento; único si no es null |
| phone | varchar(30) null | teléfono de contacto (string, D4) |
| email | varchar(150) null | opcional |
| address | varchar(255) null | dirección opcional |
| notes | varchar(500) null | observaciones libres |
| active | boolean NOT NULL default true | baja lógica (D2) |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | |

- Índices:
  - `UQ_owners_document` UNIQUE parcial (document) WHERE document IS NOT NULL (D1).
  - `IDX_owners_full_name` (para búsqueda por nombre).
  - `IDX_owners_phone` (para búsqueda por teléfono).
- Relación (preparada para P1-02): `Owner` 1—N `Pet`. Se define ahora del lado
  del dueño (`@OneToMany`) o se agrega cuando exista `Pet`; **decisión: agregar la
  relación al crear `Pet` en P1-02**, para no dejar referencias a una entidad que
  todavía no existe. Acá solo se crea la tabla `owners`.

## Backend (módulo `src/owners/`)

### Entidad y DTOs
- Entidad `Owner` (con enum de estados de actividad vía `active`).
- DTOs:
  - `CreateOwnerDto`: `fullName` (requerido), `document?`, `phone?`, `email?`
    (validar formato si viene), `address?`, `notes?`.
  - `UpdateOwnerDto`: todos opcionales (PartialType de create).
  - `ListOwnersQueryDto`: `search?` (busca en nombre/teléfono/documento),
    `active?` (default true), paginación (`page?`, `limit?`).

### Service (`OwnersService`)
- `create(dto)`: valida documento único si viene, crea.
- `findAll(query)`: lista con búsqueda (`ILIKE` en full_name / phone / document) y
  paginación; por default solo `active = true`.
- `findOne(id)`: devuelve el dueño (y sus mascotas cuando exista P1-02); 404 si no
  existe o está inactivo.
- `update(id, dto)`: valida documento único si cambia; actualiza.
- `remove(id)`: baja lógica (`active = false`). En P1-02+ se agrega la regla de
  "no dar de baja si tiene mascotas con turnos activos".

### Controller (`OwnersController`, `/api/owners`) — todos protegidos con JwtAuthGuard
- `POST /api/owners` — crear. Roles: ADMIN, EMPLOYEE.
- `GET /api/owners?search=&active=&page=&limit=` — listar/buscar. Roles: ADMIN, EMPLOYEE.
- `GET /api/owners/:id` — ver ficha. Roles: ADMIN, EMPLOYEE.
- `PATCH /api/owners/:id` — editar. Roles: ADMIN, EMPLOYEE.
- `DELETE /api/owners/:id` — baja lógica. Roles: **ADMIN** (D3).

## Criterios de aceptación
- [x] CRUD completo funcionando, todos los endpoints exigen JWT (401 sin token).
- [x] Crear un dueño con documento repetido devuelve error claro (409/400), no 500.
- [x] Crear un dueño **sin** documento funciona (D1).
- [x] La búsqueda encuentra por nombre, teléfono y documento (parcial, case-insensitive).
- [x] El listado por default no muestra dueños dados de baja (`active=false`).
- [x] `DELETE` marca `active=false` (no borra la fila) y solo lo puede hacer un ADMIN
      (un EMPLOYEE recibe 403).
- [x] Buscar/ver un dueño inexistente devuelve 404.
- [x] La paginación funciona (page/limit) y devuelve el total.

## Riesgos / notas
- **Documento único parcial:** en Postgres el índice único debe ser parcial
  (`WHERE document IS NOT NULL`), si no, dos dueños sin documento (null) chocarían.
  _Es el error clásico; verificar que múltiples null convivan._
- **Búsqueda:** con `ILIKE '%term%'` alcanza para el volumen de una veterinaria.
  No hace falta full-text search todavía.
- **Relación con mascotas:** dejarla para P1-02 evita referencias rotas. Solo
  crear la tabla `owners` en esta spec.

## Tareas
- [x] **DB:** migración tabla `owners` + índices (único parcial documento, nombre, teléfono).
- [x] **Back:** entidad `Owner`.
- [x] **Back:** DTOs (create, update, list-query con paginación).
- [x] **Back:** `OwnersService` (create, findAll con búsqueda+paginación, findOne, update, remove soft).
- [x] **Back:** `OwnersController` con guards JWT + roles (DELETE solo ADMIN).
- [x] **Back:** registrar `OwnersModule` en `app.module`.
- [x] **Prueba:** CRUD completo + búsqueda + documento duplicado + baja lógica +
      permisos de rol en DELETE.
