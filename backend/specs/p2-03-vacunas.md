# P2-03 · Vacunas (descuenta stock)

> **Fase 2.** Owner: Juan. Depende de: P1-02 (mascotas), P1-04 (productos+stock).
> Registro de vacunas aplicadas a cada mascota. **Lo interesante: al aplicar una
> vacuna, se descuenta del stock automáticamente** — integra el módulo médico con
> el de inventario. Es una funcionalidad que Tercer Tiempo no tiene y demuestra que
> sabés conectar módulos con transacciones.

---

## Objetivo
Entidad **`Vaccination` (vacuna aplicada)**: registra qué vacuna se le puso a una
mascota, cuándo, y cuándo vence / toca la próxima dosis. Si la vacuna está asociada
a un producto del inventario, al aplicarla se **descuenta una unidad de stock** en
la misma transacción (usando el `applyMovement` de P1-04).

## Historias de usuario
- Como empleado, registro que a una mascota se le aplicó una vacuna, indicando cuál
  y la fecha; el sistema descuenta esa vacuna del stock.
- Como empleado, veo el carnet de vacunación de una mascota (qué vacunas tiene y
  cuándo vencen).
- Como empleado, consulto qué vacunas están próximas a vencer (para avisar a los
  dueños).

## Alcance
- **Incluye:** registrar una vacuna aplicada a una mascota; asociar (opcionalmente)
  la vacuna a un producto del inventario para descontar stock; calcular/guardar la
  fecha de próxima dosis; listar el carnet de una mascota; listar vacunas próximas
  a vencer; el descuento de stock atómico al aplicar.
- **Fuera de alcance:** esquemas de vacunación predefinidos automáticos (calendario
  sanitario completo); notificaciones automáticas a dueños (solo se listan las
  próximas a vencer, el aviso es manual); lotes/vencimiento del vial.

## Decisiones locales
- **D1 — Vacuna con o sin producto asociado.** El registro de vacunación tiene un
  `product_id` **opcional**. Si está presente y ese producto lleva stock, al
  aplicar la vacuna se descuenta 1 unidad. Si no hay producto asociado (o no lleva
  stock), solo se registra la aplicación sin tocar inventario. _Flexibilidad: no
  toda vacuna está inventariada, pero cuando lo está, se integra._
- **D2 — Descuento de stock atómico (el punto interesante).** Registrar la vacuna +
  descontar el stock van en **una sola transacción**, usando
  `StockService.applyMovement(manager, ...)` con el manager de la transacción. Si
  el descuento de stock falla, no se registra la vacuna, y viceversa. El movimiento
  de stock queda con `reference_type='VACCINE'` y `reference_id`= id de la vacuna.
  _Este es el patrón que demuestra integración entre módulos con consistencia._
- **D3 — Próxima dosis calculada o manual.** Se puede indicar `next_dose_date`
  manualmente, o `valid_days` (validez en días) para calcularla desde la fecha de
  aplicación. _MVP: aceptar `nextDoseDate` directo; opcionalmente calcular desde días._
- **D4 — Permitir stock negativo (hereda P1-04 D3).** Si no hay stock del producto,
  igual se registra la vacuna y el stock queda negativo con alerta (no se traba la
  atención). _En una vet, la vacuna ya se aplicó físicamente; el sistema no puede
  impedir registrarlo por un descuadre._
- **D5 — Permisos.** Registrar/ver: ADMIN y EMPLOYEE. No se borran vacunas
  (registro médico); si se anula, sería con un movimiento inverso de stock (RETURN).

## Modelo de datos

### `vaccinations`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| pet_id | int FK→pets NOT NULL | mascota |
| product_id | int FK→products null | producto de inventario asociado (D1) |
| vaccine_name | varchar(150) NOT NULL | nombre de la vacuna (por si no hay producto) |
| applied_date | date NOT NULL default now() | fecha de aplicación |
| next_dose_date | date null | próxima dosis / vencimiento (D3) |
| veterinarian_id | int FK→veterinarians null | quién la aplicó |
| notes | varchar(500) null | |
| creation_date | timestamp default now() | |

- Índices:
  - `IDX_vaccinations_pet` (pet_id, applied_date) — carnet de la mascota.
  - `IDX_vaccinations_next_dose` (next_dose_date) — para "próximas a vencer".

## Backend (módulo `src/vaccinations/`)

### Entidad y DTOs
- Entidad `Vaccination`.
- DTOs:
  - `CreateVaccinationDto`: `petId` (requerido), `vaccineName` (requerido),
    `productId?`, `appliedDate?` (default hoy), `nextDoseDate?` o `validDays?`,
    `veterinarianId?`, `notes?`.
  - `ListVaccinationsQueryDto`: `petId?` (carnet), `upcomingDays?` (próximas a
    vencer en N días), paginación.

### Service (`VaccinationsService`)
- `create(dto)` — con descuento de stock (D2):
  1. Valida que la mascota exista y esté activa.
  2. Calcula `next_dose_date` si vino `validDays` (applied + días).
  3. **En una transacción:**
     - Crea el registro de vacunación.
     - Si hay `productId` y el producto lleva stock: llama
       `stockService.applyMovement(manager, { productId, quantity: -1, type: SALE
       (o VACCINE), reference_type: 'VACCINE', reference_id: vaccination.id })`.
     - Si el descuento falla (y no se permite negativo), revierte todo.
  4. Devuelve la vacuna creada.
- `findByPet(petId)`: carnet de vacunación ordenado por fecha.
- `findUpcoming(days)`: vacunas con `next_dose_date` dentro de los próximos N días.
- `findOne(id)`.

### Controller (`VaccinationsController`, `/api/vaccinations`) — con JwtAuthGuard
- `POST /api/vaccinations` — registrar (descuenta stock si corresponde).
- `GET /api/vaccinations?petId=X` — carnet de la mascota.
- `GET /api/vaccinations/upcoming?days=30` — próximas a vencer.
- `GET /api/vaccinations/:id` — detalle.
- Roles: ADMIN y EMPLOYEE (D5).

## Criterios de aceptación
- [x] Registrar una vacuna asociada a una mascota funciona; endpoints con JWT.
- [x] Registrar una vacuna **con** producto asociado descuenta 1 del stock de ese
      producto, y el movimiento queda con `reference_type='VACCINE'` (D2).
- [x] El registro de la vacuna y el descuento de stock son **una sola transacción**:
      si algo falla, no queda ni la vacuna ni el movimiento (o ninguno).
- [x] Registrar una vacuna **sin** producto asociado funciona y NO toca stock (D1).
- [x] `GET /api/vaccinations?petId=X` devuelve el carnet ordenado.
- [x] `GET /api/vaccinations/upcoming?days=30` lista las que vencen en ≤30 días.
- [x] Si `validDays` se envía, `next_dose_date` se calcula bien (applied + días).
- [x] Si no hay stock y se permite negativo, la vacuna igual se registra con alerta (D4).

## Riesgos / notas
- **Transacción entre módulos (el punto clave):** este es el ejemplo más claro de
  integración — vacuna (módulo médico) + stock (módulo inventario) en una
  transacción. Usar el `applyMovement(manager, ...)` que P1-04 dejó preparado para
  recibir el manager externo. Si P1-04 se hizo bien, esto se conecta limpio. _Si
  applyMovement NO recibe el manager, habría que refactorizarlo — por eso P1-04 lo
  diseñó así desde el inicio._
- **reference_type/reference_id:** dejar la traza de qué vacuna generó qué
  movimiento de stock permite auditar y, si se anula, revertir con un RETURN.
- **Quantity = 1 por defecto:** una aplicación descuenta una unidad. Si en el futuro
  se quisiera descontar más (ej. dosis dobles), se parametriza.

## Tareas
- [x] **DB:** migración `vaccinations` + índices + FKs (pet, product, vet).
- [x] **Back:** entidad `Vaccination` + relaciones.
- [x] **Back:** DTOs (create con productId opcional, list-query).
- [x] **Back:** `VaccinationsService.create` transaccional con descuento de stock
      vía `applyMovement(manager)` (D2).
- [x] **Back:** `findByPet` (carnet), `findUpcoming(days)`, `findOne`.
- [x] **Back:** `VaccinationsController` con guards.
- [x] **Back:** registrar módulo en `app.module`.
- [x] **Prueba:** vacuna con producto (descuenta stock + movimiento con ref),
      vacuna sin producto (no toca stock), transaccionalidad, carnet, próximas a vencer.
