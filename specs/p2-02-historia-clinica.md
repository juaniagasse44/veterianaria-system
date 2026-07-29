# P2-02 · Historia clínica / consultas

> **Fase 2.** Owner: Juan. Depende de: P2-01 (turnos).
> Registro médico de cada atención. Es lo que hace que esta veterinaria se
> diferencie de un simple sistema de turnos: guarda el historial médico de cada
> mascota.

---

## Objetivo
Entidad **`Consultation` (consulta / registro clínico)**: cada vez que una mascota
es atendida, se registra qué pasó (motivo, diagnóstico, tratamiento, peso,
observaciones). El conjunto de consultas de una mascota es su **historia clínica**.

## Historias de usuario
- Como veterinario/empleado, después de atender una mascota registro la consulta:
  diagnóstico, tratamiento indicado, peso actual y notas.
- Como empleado, abro la historia clínica de una mascota y veo todas sus consultas
  en orden cronológico.
- Como veterinario, en una nueva consulta veo el historial previo de la mascota
  para tener contexto.

## Alcance
- **Incluye:** registrar una consulta (asociada a una mascota y, opcionalmente, al
  turno que la originó); ver la historia clínica completa de una mascota; editar
  una consulta reciente; el peso registrado en la consulta actualiza el peso actual
  de la mascota.
- **Fuera de alcance:** adjuntar imágenes/estudios (rayos, análisis); recetas
  formales imprimibles (se puede anotar el tratamiento como texto); integración con
  laboratorios. _El foco es el registro clínico en texto estructurado._

## Decisiones locales
- **D1 — Consulta ligada a mascota, turno opcional.** Toda consulta pertenece a una
  mascota (`pet_id` obligatorio). El `appointment_id` es **opcional**: lo normal es
  que venga de un turno atendido, pero se permite registrar una consulta sin turno
  previo (una urgencia que entró sin agenda). _Flexibilidad real de una clínica._
- **D2 — Registrar consulta marca el turno como ATENDIDO.** Si la consulta viene de
  un turno (`appointment_id` presente), al crearla el turno pasa a `ATENDIDO`
  (si no lo estaba). _Conecta los dos módulos de forma natural._
- **D3 — El peso de la consulta actualiza la mascota.** Si la consulta registra un
  `weight`, se guarda en la consulta (histórico) Y se actualiza `pets.weight` (el
  peso actual). Así se arma un seguimiento de peso sin tabla extra. _Resuelve el
  "historial de peso" que quedó pendiente en P1-02 (D3 de esa spec)._
- **D4 — Edición acotada.** Una consulta se puede editar (corregir un typo), pero
  como es un registro médico, idealmente se limita a un plazo corto o se registra
  `last_update_date`. _MVP: permitir editar, pero dejar el registro de última
  modificación visible. No borrar consultas (soft delete si acaso)._
- **D5 — Permisos.** Crear/ver/editar consultas: ADMIN y EMPLOYEE. (En una vet
  real lo haría el veterinario, pero como no modelamos login por veterinario —ver
  P1-03 D2—, lo hace el usuario logueado.) Borrado: no se borra (registro médico).

## Modelo de datos

### `consultations`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| pet_id | int FK→pets NOT NULL | mascota (D1) |
| appointment_id | int FK→appointments null | turno que la originó, opcional (D1) |
| veterinarian_id | int FK→veterinarians null | quién atendió (del turno o manual) |
| consultation_date | timestamptz NOT NULL default now() | fecha de la atención |
| reason | varchar(200) null | motivo de la visita |
| diagnosis | varchar(1000) null | diagnóstico |
| treatment | varchar(1000) null | tratamiento indicado |
| weight | decimal(6,3) null | peso registrado (D3) |
| notes | varchar(1000) null | observaciones |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | visible para transparencia (D4) |

- Índices:
  - `IDX_consultations_pet` (pet_id, consultation_date) — para la historia clínica
    ordenada.
  - `IDX_consultations_appointment` (appointment_id).

## Backend (módulo `src/consultations/`)

### Entidad y DTOs
- Entidad `Consultation`.
- DTOs:
  - `CreateConsultationDto`: `petId` (requerido), `appointmentId?`,
    `veterinarianId?`, `reason?`, `diagnosis?`, `treatment?`, `weight?`, `notes?`.
  - `UpdateConsultationDto`: PartialType (sin cambiar pet).
  - `ListConsultationsQueryDto`: `petId?` (para la historia), paginación.

### Service (`ConsultationsService`)
- `create(dto)`:
  1. Valida que la mascota exista y esté activa.
  2. Si viene `appointmentId`: valida que el turno exista y sea de esa mascota;
     lo marca ATENDIDO (D2); toma el `veterinarian_id` del turno si no vino.
  3. Si viene `weight`: actualiza `pets.weight` (D3). Todo en una transacción.
  4. Crea la consulta.
- `findByPet(petId)`: historia clínica completa, ordenada por fecha desc.
- `findOne(id)`: consulta con datos de mascota/veterinario/turno.
- `update(id, dto)`: edición acotada (D4).

### Controller (`ConsultationsController`, `/api/consultations`) — con JwtAuthGuard
- `POST /api/consultations` — registrar consulta.
- `GET /api/consultations?petId=X` — historia clínica de una mascota.
- `GET /api/consultations/:id` — detalle.
- `PATCH /api/consultations/:id` — editar.
- Roles: ADMIN y EMPLOYEE (D5).
- Extra: `GET /api/pets/:id/history` como atajo a la historia (opcional, mismo dato).

## Criterios de aceptación
- [ ] Registrar una consulta asociada a una mascota funciona; endpoints con JWT.
- [ ] Registrar una consulta desde un turno (`appointmentId`) marca ese turno como
      ATENDIDO (D2).
- [ ] Registrar una consulta con `weight` actualiza el peso actual de la mascota (D3).
- [ ] Se puede registrar una consulta SIN turno (urgencia) — `appointmentId` null (D1).
- [ ] `GET /api/consultations?petId=X` devuelve la historia clínica ordenada
      cronológicamente.
- [ ] Registrar consulta para una mascota inexistente/inactiva devuelve error claro.
- [ ] Editar una consulta actualiza `last_update_date`.
- [ ] Todo el flujo (marcar turno + actualizar peso + crear consulta) es
      transaccional: si algo falla, no queda a medias.

## Riesgos / notas
- **Transacción de create:** marcar el turno ATENDIDO + actualizar peso de la
  mascota + insertar la consulta deben ir en una sola transacción. Si falla el
  update del turno, no debe quedar la consulta creada. _Consistencia entre módulos._
- **Validar que el turno sea de esa mascota:** si viene `appointmentId`, verificar
  que el turno realmente corresponda a `petId` (no registrar una consulta de la
  mascota A en el turno de la mascota B).
- **Historia clínica = solo lectura acumulativa:** no se borran consultas. Es un
  registro médico; la integridad histórica importa.

## Tareas
- [ ] **DB:** migración `consultations` + índices + FKs (pet, appointment, vet).
- [ ] **Back:** entidad `Consultation` + relaciones.
- [ ] **Back:** DTOs (create, update, list-query).
- [ ] **Back:** `ConsultationsService.create` transaccional (marca turno ATENDIDO
      + actualiza peso mascota + crea consulta).
- [ ] **Back:** `findByPet` (historia ordenada), `findOne`, `update`.
- [ ] **Back:** `ConsultationsController` con guards (+ atajo /pets/:id/history opcional).
- [ ] **Back:** registrar módulo en `app.module`.
- [ ] **Prueba:** consulta desde turno (marca atendido), consulta sin turno,
      actualización de peso, historia clínica ordenada, transaccionalidad.
