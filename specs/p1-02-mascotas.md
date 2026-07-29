# P1-02 · Mascotas

> **Fase 1 (MVP).** Owner: Juan. Depende de: P1-01 (Dueños).
> Introduce la primera **relación entre entidades**: un dueño tiene muchas
> mascotas. Es la base para los turnos (P2-01), la historia clínica (P2-02) y las
> vacunas (P2-03).

---

## Objetivo
Entidad **`Pet` (mascota)** asociada a un dueño. CRUD completo con los datos
clínicamente relevantes (especie, raza, sexo, fecha de nacimiento, peso). Al
terminar, se puede cargar la mascota de un dueño y consultarla, dejando lista la
estructura para colgar turnos e historia clínica.

## Historias de usuario
- Como empleado, registro una mascota y la asocio a su dueño, cargando especie,
  raza, sexo y fecha de nacimiento.
- Como empleado, veo todas las mascotas de un dueño desde su ficha.
- Como empleado, abro la ficha de una mascota y veo sus datos (y más adelante, su
  historia clínica y vacunas).
- Como admin, puedo dar de baja una mascota (soft delete), preservando su
  historial.

## Alcance
- **Incluye:** CRUD de mascotas; relación `Owner (1) — (N) Pet`; listar las
  mascotas de un dueño; datos clínicos base (especie, raza, sexo, nacimiento,
  peso, color, notas); baja lógica; todo protegido por JWT.
- **Fuera de alcance:** historia clínica (P2-02), vacunas (P2-03), turnos
  (P2-01) — acá solo se deja la mascota lista para que esas specs la referencien;
  fotos de la mascota; múltiples dueños por mascota (una mascota = un dueño en MVP).

## Decisiones locales
- **D1 — Especie como enum, raza como texto.** `species` es un enum acotado
  (PERRO, GATO, AVE, ROEDOR, REPTIL, OTRO) porque son categorías fijas y útiles
  para filtrar/reportar. `breed` (raza) es texto libre porque hay demasiadas y
  varían. _Balance entre estructura y flexibilidad._
- **D2 — Edad calculada, no guardada.** No se guarda la edad (cambia todo el
  tiempo); se guarda `birth_date` (opcional) y la edad se calcula al vuelo cuando
  se necesita. _Nunca guardar un dato derivado que queda desactualizado._
- **D3 — Peso opcional y con historial futuro.** En MVP se guarda un `weight`
  actual opcional en la mascota. El historial de peso (para seguimiento clínico)
  se puede sumar después vía la historia clínica (P2-02). _No sobrediseñar ahora._
- **D4 — Borrar dueño con mascotas.** Completa la regla que quedó pendiente en
  P1-01: no se puede dar de baja un dueño que tiene mascotas **activas**. Se
  valida en `OwnersService.remove`. _Integridad: un dueño de baja no puede dejar
  mascotas "huérfanas" activas._
- **D5 — Baja de mascota.** Soft delete (`active=false`), solo ADMIN, igual
  criterio que dueños.

## Modelo de datos

### `pets`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| owner_id | int FK→owners NOT NULL | dueño (ON DELETE RESTRICT) |
| name | varchar(100) NOT NULL | nombre de la mascota |
| species | varchar(20) NOT NULL | enum: PERRO/GATO/AVE/ROEDOR/REPTIL/OTRO (D1) |
| breed | varchar(100) null | raza, texto libre (D1) |
| sex | varchar(10) null | enum: MACHO/HEMBRA/DESCONOCIDO |
| birth_date | date null | para calcular edad (D2) |
| weight | decimal(6,3) null | peso actual en kg (D3) |
| color | varchar(60) null | |
| notes | varchar(500) null | observaciones |
| active | boolean NOT NULL default true | baja lógica (D5) |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | |

- Índices:
  - `IDX_pets_owner` (owner_id) — para listar mascotas de un dueño rápido.
  - `IDX_pets_name` — búsqueda por nombre.
- FK `owner_id` con `ON DELETE RESTRICT`: la base no deja borrar un dueño que
  tenga mascotas (refuerzo a nivel DB de la regla D4; igual se valida en el service
  con un mensaje amigable).

### Relación (ahora sí se agrega)
- `Owner` `@OneToMany(() => Pet)` `pets`
- `Pet` `@ManyToOne(() => Owner)` `owner`

## Backend (módulo `src/pets/`)

### Entidad y DTOs
- Entidad `Pet` (enums species/sex).
- DTOs:
  - `CreatePetDto`: `ownerId` (requerido, debe existir y estar activo), `name`
    (requerido), `species` (requerido, enum), `breed?`, `sex?`, `birthDate?`,
    `weight?`, `color?`, `notes?`.
  - `UpdatePetDto`: PartialType (sin permitir cambiar `ownerId`, o permitiéndolo
    con validación — **decisión: no permitir cambiar de dueño en MVP**, se edita
    todo menos el owner).
  - `ListPetsQueryDto`: `ownerId?`, `species?`, `search?`, `active?`, paginación.

### Service (`PetsService`)
- `create(dto)`: valida que el dueño exista y esté activo; crea la mascota.
- `findAll(query)`: lista con filtros (por dueño, especie, búsqueda por nombre) y
  paginación; default `active=true`.
- `findByOwner(ownerId)`: atajo para la ficha del dueño.
- `findOne(id)`: ficha de la mascota (con datos del dueño); 404 si no existe/inactiva.
- `update(id, dto)`: actualiza (sin cambiar dueño).
- `remove(id)`: baja lógica.
- Calcular `age` (derivado de birth_date) al devolver la mascota (D2).

### Controller (`PetsController`, `/api/pets`) — protegidos con JwtAuthGuard
- `POST /api/pets` — crear. Roles: ADMIN, EMPLOYEE.
- `GET /api/pets?ownerId=&species=&search=&page=&limit=` — listar. Roles: ADMIN, EMPLOYEE.
- `GET /api/pets/:id` — ficha. Roles: ADMIN, EMPLOYEE.
- `PATCH /api/pets/:id` — editar. Roles: ADMIN, EMPLOYEE.
- `DELETE /api/pets/:id` — baja lógica. Roles: **ADMIN**.

### Cambio en OwnersService (completar D4)
- `OwnersService.remove(id)`: antes de dar de baja, verificar que el dueño no
  tenga mascotas activas. Si tiene, lanzar `ConflictException` con mensaje claro.
- `OwnersService.findOne(id)`: ahora incluye las mascotas del dueño en la ficha.

## Criterios de aceptación
- [x] Crear una mascota asociada a un dueño existente funciona; todos los endpoints
      exigen JWT.
- [x] Crear una mascota con `ownerId` inexistente o de un dueño inactivo devuelve
      error claro (400/404), no 500.
- [x] La ficha de un dueño (`GET /api/owners/:id`) ahora muestra sus mascotas.
- [x] `GET /api/pets?ownerId=X` devuelve solo las mascotas de ese dueño.
- [x] La mascota devuelve la **edad calculada** desde `birth_date` (D2).
- [x] Intentar dar de baja un dueño con mascotas activas devuelve error claro
      (409), no lo borra (D4).
- [x] `DELETE` de mascota marca `active=false` y solo lo hace un ADMIN (403 para EMPLOYEE).
- [x] Filtrar por especie funciona.

## Riesgos / notas
- **FK ON DELETE RESTRICT vs soft delete:** como los dueños se dan de baja lógica
  (no se borran), la FK a nivel DB casi nunca se dispara; la regla real vive en el
  service (D4). La FK queda como red de seguridad. _Coherencia entre las dos capas._
- **Edad calculada:** cuidado con birth_date null → devolver edad como null, no
  romper. Y calcular en años+meses para mascotas jóvenes (un cachorro de 3 meses
  no es "0 años" a secas, conviene mostrar meses). _Detalle que se agradece._
- **No permitir cambiar de dueño** simplifica el MVP; si se necesitara, sería una
  operación explícita aparte (transferencia), no un simple PATCH.

## Tareas
- [x] **DB:** migración tabla `pets` + índices + FK a owners (RESTRICT).
- [x] **Back:** entidad `Pet` (enums species/sex) + relación con `Owner`.
- [x] **Back:** agregar `@OneToMany` en la entidad `Owner`.
- [x] **Back:** DTOs (create con validación de owner, update sin owner, list-query).
- [x] **Back:** `PetsService` (CRUD + findByOwner + edad calculada + validaciones).
- [x] **Back:** `PetsController` con guards JWT + roles.
- [x] **Back:** completar `OwnersService.remove` (regla D4) y `findOne` (incluir mascotas).
- [x] **Back:** registrar `PetsModule` en `app.module`.
- [x] **Prueba:** crear mascota, listar por dueño, ver edad calculada, regla de
      baja de dueño con mascotas, permisos de rol.
