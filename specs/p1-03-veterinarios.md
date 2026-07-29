# P1-03 · Veterinarios

> **Fase 1 (MVP).** Owner: Juan. Depende de: F-02 (auth).
> Entidad de los profesionales que atienden. Necesaria para asignar turnos
> (P2-01) y registrar quién atendió cada consulta (P2-02).

---

## Objetivo
Entidad **`Veterinarian` (veterinario)**: los profesionales que atienden en la
clínica. CRUD simple. Se usará para asignar turnos a un veterinario y para dejar
registro de quién realizó cada consulta.

## Historias de usuario
- Como admin, doy de alta a los veterinarios de la clínica con su nombre,
  matrícula y especialidad.
- Como empleado, al crear un turno elijo a qué veterinario se asigna.
- Como admin, doy de baja a un veterinario que ya no trabaja (sin borrar su
  historial de atenciones).

## Alcance
- **Incluye:** CRUD de veterinarios; datos profesionales (nombre, matrícula,
  especialidad, contacto); baja lógica; protegido por JWT.
- **Fuera de alcance:** agenda/horarios propios del veterinario (los turnos se
  validan por solapamiento en P2-01, no por una agenda configurada acá); vínculo
  con la tabla `users` de login (un veterinario NO es necesariamente un usuario
  del sistema — ver D2); comisiones/liquidaciones.

## Decisiones locales
- **D1 — Matrícula opcional pero única si está.** Igual criterio que el documento
  del dueño: la matrícula profesional no es obligatoria para cargar el registro,
  pero si se pone, no puede repetirse. _Índice único parcial._
- **D2 — Veterinario ≠ Usuario del sistema.** Un `Veterinarian` es un registro de
  la clínica (a quién se le asignan turnos), NO una cuenta de login. Puede haber
  un veterinario que no usa el sistema (solo lo agenda la recepción). _Razón:
  separar "profesional que atiende" de "usuario que se loguea" evita acoplar dos
  conceptos distintos. Si en el futuro un veterinario quisiera loguearse, sería un
  `User` con rol, aparte._
- **D3 — Permisos.** Crear/editar/baja: solo `ADMIN` (gestionar el staff es
  administrativo). Ver/listar: ADMIN y EMPLOYEE (recepción necesita verlos para
  asignar turnos).
- **D4 — Baja lógica.** `active=false`, no se borra (preserva el historial de
  atenciones pasadas).

## Modelo de datos

### `veterinarians`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| full_name | varchar(150) NOT NULL | nombre del profesional |
| license_number | varchar(50) null | matrícula; única si no es null (D1) |
| specialty | varchar(100) null | ej: clínica general, cirugía, felinos |
| phone | varchar(30) null | contacto |
| email | varchar(150) null | contacto |
| active | boolean NOT NULL default true | baja lógica (D4) |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | |

- Índices:
  - `UQ_veterinarians_license` UNIQUE parcial (license_number) WHERE license_number IS NOT NULL.
  - `IDX_veterinarians_full_name`.

## Backend (módulo `src/veterinarians/`)

### Entidad y DTOs
- Entidad `Veterinarian`.
- DTOs:
  - `CreateVeterinarianDto`: `fullName` (requerido), `licenseNumber?`,
    `specialty?`, `phone?`, `email?`.
  - `UpdateVeterinarianDto`: PartialType.
  - `ListVeterinariansQueryDto`: `search?`, `active?`, paginación.

### Service (`VeterinariansService`)
- `create(dto)`: valida matrícula única si viene; crea.
- `findAll(query)`: lista con búsqueda por nombre/especialidad, default `active=true`.
- `findOne(id)`: 404 si no existe/inactivo.
- `update(id, dto)`: valida matrícula única si cambia.
- `remove(id)`: baja lógica. (En P2-01 se puede sumar la regla de no dar de baja
  si tiene turnos futuros — se deja anotado para esa spec.)

### Controller (`VeterinariansController`, `/api/veterinarians`) — con JwtAuthGuard
- `POST /api/veterinarians` — crear. Roles: **ADMIN**.
- `GET /api/veterinarians?search=&active=` — listar. Roles: ADMIN, EMPLOYEE.
- `GET /api/veterinarians/:id` — ver. Roles: ADMIN, EMPLOYEE.
- `PATCH /api/veterinarians/:id` — editar. Roles: **ADMIN**.
- `DELETE /api/veterinarians/:id` — baja lógica. Roles: **ADMIN**.

## Criterios de aceptación
- [ ] CRUD completo, todos los endpoints exigen JWT.
- [ ] Crear con matrícula repetida devuelve error claro (409/400), no 500.
- [ ] Crear **sin** matrícula funciona (D1).
- [ ] Listar veterinarios funciona para EMPLOYEE (lo necesita para asignar turnos),
      pero crear/editar/borrar le da 403 (solo ADMIN, D3).
- [ ] La búsqueda por nombre/especialidad funciona.
- [ ] `DELETE` marca `active=false`, no borra.
- [ ] Ver un veterinario inexistente devuelve 404.

## Riesgos / notas
- **No acoplar con `users`:** es tentador reusar la tabla de usuarios, pero un
  veterinario y un usuario de login son cosas distintas (D2). Mantenerlos
  separados ahora evita un refactor doloroso después.
- **Índice único parcial de matrícula:** mismo cuidado que con el documento del
  dueño (múltiples null deben convivir).

## Tareas
- [ ] **DB:** migración tabla `veterinarians` + índices (único parcial matrícula, nombre).
- [ ] **Back:** entidad `Veterinarian`.
- [ ] **Back:** DTOs (create, update, list-query).
- [ ] **Back:** `VeterinariansService` (CRUD + validación matrícula única).
- [ ] **Back:** `VeterinariansController` con guards JWT + roles (D3).
- [ ] **Back:** registrar `VeterinariansModule` en `app.module`.
- [ ] **Prueba:** CRUD + matrícula duplicada + permisos (EMPLOYEE lista pero no
      crea) + baja lógica.
