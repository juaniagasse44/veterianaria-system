# P2-01 · Turnos (con reglas de solapamiento)

> **Fase 2.** Owner: Juan. Depende de: P1-02 (mascotas), P1-03 (veterinarios).
> **El módulo central del sistema y el técnicamente más delicado:** control de
> solapamiento de turnos con concurrencia. Es la spec que mejor demuestra tu nivel.

---

## Objetivo
Entidad **`Appointment` (turno)**: reserva una mascota con un veterinario en una
fecha/hora, con una duración y un motivo. La regla clave es que **un veterinario
no puede tener dos turnos que se solapen en el tiempo**, y esto debe cumplirse
incluso si dos turnos se crean simultáneamente. Los turnos pasan por estados.

## Historias de usuario
- Como empleado, saco un turno para una mascota con un veterinario, en una fecha y
  hora, indicando el motivo (consulta, control, vacunación, cirugía).
- Como empleado, veo la agenda del día por veterinario y no puedo pisar un turno
  ya reservado.
- Como empleado, cambio el estado de un turno (confirmar, marcar como atendido,
  cancelar).
- Como sistema, cuando un turno se marca "atendido", habilita registrar la consulta
  en la historia clínica (P2-02).

## Alcance
- **Incluye:** CRUD de turnos; control de **solapamiento** por veterinario (con
  lock para concurrencia); estados del turno; validaciones (no en el pasado, la
  mascota y el veterinario deben existir y estar activos); listar agenda por
  día/veterinario.
- **Fuera de alcance:** pagos/señas (esto no es Tercer Tiempo); recordatorios por
  email/WhatsApp; turnos recurrentes (se puede dejar anotado como mejora futura);
  agenda con horarios de atención configurables por veterinario (el solapamiento
  se valida contra los turnos existentes, no contra una grilla de horarios).

## Decisiones locales
- **D1 — Duración por rango, no slots fijos.** El turno tiene `start_at` y
  `end_at` (timestamp). El solapamiento se calcula por intersección de rangos, no
  por "slots" de 30 min. _Más flexible: una consulta dura distinto que una cirugía._
- **D2 — Solapamiento con lock (el punto clave).** Al crear/mover un turno, dentro
  de una transacción: se toma un lock (advisory lock por `veterinarian_id`, o
  `SELECT ... FOR UPDATE` sobre los turnos de ese vet en la ventana), se verifica
  que no exista otro turno del mismo veterinario que intersecte el rango, y recién
  ahí se inserta. _Sin esto, dos reservas simultáneas podrían pisarse. Es la misma
  clase de problema de concurrencia que el stock (P1-04)._
- **D3 — Regla de intersección.** Dos turnos `[a_start, a_end)` y `[b_start,
  b_end)` se solapan si `a_start < b_end AND b_start < a_end`. Turnos cancelados NO
  cuentan para el solapamiento.
- **D4 — Estados.** `PENDIENTE` → `CONFIRMADO` → `ATENDIDO`, y en cualquier momento
  (antes de atendido) → `CANCELADO`. Transiciones válidas controladas en el
  service (no se puede "atender" un turno cancelado, etc.).
- **D5 — No en el pasado.** No se puede crear un turno cuyo `start_at` ya pasó.
  (Editar la fecha tampoco puede llevarlo al pasado.)
- **D6 — Permisos.** Crear/editar/cambiar estado/cancelar: ADMIN y EMPLOYEE
  (recepción gestiona la agenda). No hay borrado físico: un turno se cancela
  (queda en el historial). _La agenda es un registro, no se borra._

## Modelo de datos

### `appointments`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| pet_id | int FK→pets NOT NULL | mascota |
| veterinarian_id | int FK→veterinarians NOT NULL | profesional asignado |
| start_at | timestamptz NOT NULL | inicio del turno |
| end_at | timestamptz NOT NULL | fin (start + duración) |
| reason | varchar(30) NOT NULL | enum: CONSULTA/CONTROL/VACUNACION/CIRUGIA/OTRO |
| status | varchar(20) NOT NULL | enum: PENDIENTE/CONFIRMADO/ATENDIDO/CANCELADO (D4) |
| notes | varchar(500) null | observaciones al reservar |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | |

- Índices:
  - `IDX_appointments_vet_start` (veterinarian_id, start_at) — clave para buscar
    solapamientos rápido.
  - `IDX_appointments_pet` (pet_id).
  - `IDX_appointments_status`.
- Constraint de datos: `end_at > start_at` (CHECK).

## Backend (módulo `src/appointments/`)

### Entidad y DTOs
- Entidad `Appointment` (enums reason/status).
- DTOs:
  - `CreateAppointmentDto`: `petId`, `veterinarianId`, `startAt`, `durationMinutes`
    (o `endAt` directo), `reason`, `notes?`.
  - `UpdateAppointmentDto`: reprogramar (cambiar fecha/hora/vet) — revalida
    solapamiento; no cambia pet.
  - `ChangeStatusDto`: `status` destino (valida transición D4).
  - `ListAppointmentsQueryDto`: `veterinarianId?`, `petId?`, `date?` (día),
    `from?`/`to?` (rango), `status?`.

### Service (`AppointmentsService`)
- **`create(dto)`** — el corazón (D2):
  1. Valida que la mascota y el veterinario existan y estén activos.
  2. Calcula `end_at` (start + duración).
  3. Valida que `start_at` no esté en el pasado (D5) y `end_at > start_at`.
  4. **En una transacción:** toma el lock por veterinario (advisory lock o
     FOR UPDATE sobre sus turnos en la ventana), busca turnos del mismo vet que
     intersecten el rango (excluyendo CANCELADO, regla D3), y si hay alguno lanza
     `ConflictException("El veterinario ya tiene un turno en ese horario")`.
  5. Inserta el turno en estado PENDIENTE.
- `reschedule(id, dto)`: mismo control de solapamiento para la nueva ventana.
- `changeStatus(id, dto)`: valida la transición (D4).
- `cancel(id)`: pasa a CANCELADO (libera la franja).
- `findAgenda(query)`: agenda por día/veterinario, ordenada por hora.
- `findOne(id)`: turno con datos de mascota y veterinario.

### Controller (`AppointmentsController`, `/api/appointments`) — con JwtAuthGuard
- `POST /api/appointments` — crear (con control de solapamiento).
- `GET /api/appointments?veterinarianId=&date=&status=` — agenda/listado.
- `GET /api/appointments/:id` — detalle.
- `PATCH /api/appointments/:id/reschedule` — reprogramar.
- `PATCH /api/appointments/:id/status` — cambiar estado.
- `PATCH /api/appointments/:id/cancel` — cancelar.
- Roles: ADMIN y EMPLOYEE en todos (D6).

## Criterios de aceptación
- [ ] Crear un turno válido funciona y queda en PENDIENTE; endpoints con JWT.
- [ ] Crear un turno que **se solapa** con otro del mismo veterinario devuelve 409
      con mensaje claro, y NO se crea.
- [ ] Un turno que se solapa pero con **otro** veterinario SÍ se permite.
- [ ] Un turno solapado con uno **cancelado** SÍ se permite (los cancelados no cuentan, D3).
- [ ] No se puede crear un turno en el pasado (D5).
- [ ] `end_at` debe ser posterior a `start_at` (rechazo si no).
- [ ] Cambiar estado respeta las transiciones válidas (no se puede atender un
      cancelado, etc.).
- [ ] La agenda por día/veterinario devuelve los turnos ordenados por hora,
      sin los cancelados (o marcándolos aparte).
- [ ] **(Concurrencia)** dos requests simultáneos que intentan reservar el mismo
      horario con el mismo vet: solo uno lo logra, el otro recibe 409.

## Riesgos / notas
- **Concurrencia (lo más importante):** el control de solapamiento SIN lock tiene
  una condición de carrera — dos requests leen "no hay turno" al mismo tiempo y
  ambos insertan. Hay que serializar por veterinario. Opciones: (a) advisory lock
  de Postgres por `veterinarian_id` (`pg_advisory_xact_lock`), simple y efectivo;
  (b) `FOR UPDATE` sobre los turnos del vet en la ventana. _Elegir una y testearla
  con dos requests en paralelo. Este test es oro para el portfolio._
- **Zonas horarias:** usar `timestamptz` y ser consistente. Guardar en UTC, mostrar
  en local. No mezclar.
- **Reprogramar es igual de delicado que crear:** aplica el mismo control de
  solapamiento (no olvidarlo en el `reschedule`).
- **Este módulo se conecta con P2-02:** marcar un turno como ATENDIDO es lo que
  habilita registrar la consulta clínica. Dejar el estado bien modelado ahora.

## Tareas
- [ ] **DB:** migración `appointments` + índices (vet+start, pet, status) + CHECK end>start.
- [ ] **Back:** entidad `Appointment` (enums reason/status).
- [ ] **Back:** DTOs (create, reschedule, change-status, list-query).
- [ ] **Back:** `AppointmentsService.create` con control de solapamiento + lock (D2/D3).
- [ ] **Back:** `reschedule` (revalida solapamiento), `changeStatus` (transiciones D4),
      `cancel`, `findAgenda`, `findOne`.
- [ ] **Back:** validaciones (no pasado, entidades activas, end>start).
- [ ] **Back:** `AppointmentsController` con guards.
- [ ] **Back:** registrar `AppointmentsModule` en `app.module`.
- [ ] **Prueba:** turno válido, solapamiento mismo vet (409), otro vet (ok),
      cancelado no cuenta, pasado (rechazo), transiciones de estado, y **test de
      concurrencia** (dos reservas simultáneas → una sola gana).
