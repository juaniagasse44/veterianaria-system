# VetSystem — API

Backend de gestión para una veterinaria: dueños y mascotas, veterinarios,
catálogo de productos con control de inventario, turnos con reglas reales de
solapamiento, historia clínica y vacunas que descuentan stock automáticamente.

Construido como proyecto de portfolio con **NestJS + TypeScript + PostgreSQL**,
siguiendo un enfoque de **Spec-Driven Development** (ver [método SDD](#método-sdd-spec-driven-development)
más abajo) — cada módulo se diseñó primero como spec (objetivo, decisiones,
modelo de datos, criterios de aceptación) antes de programarse.

---

## Índice

- [Características](#características)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Cómo levantar (Docker)](#cómo-levantar-docker)
- [Cómo levantar (local, sin Docker)](#cómo-levantar-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [Documentación de la API (Swagger)](#documentación-de-la-api-swagger)
- [Migraciones](#migraciones)
- [Tests](#tests)
- [Formato de error](#formato-de-error)
- [Scripts](#scripts)
- [Método SDD (Spec-Driven Development)](#método-sdd-spec-driven-development)
- [Decisiones de diseño destacadas](#decisiones-de-diseño-destacadas)
- [Capturas](#capturas)

---

## Características

- **Auth**: JWT con roles (`ADMIN` / `EMPLOYEE`), guards y decorador `@Roles()`.
- **Dueños y mascotas**: CRUD con relación 1–N, búsqueda, baja lógica, edad
  calculada desde la fecha de nacimiento.
- **Veterinarios**: CRUD con matrícula única (parcial), permisos diferenciados
  por rol.
- **Productos + stock**: catálogo con margen calculado, y un motor de
  inventario con patrón **ledger + nivel materializado** (`stock_levels` /
  `stock_movements`), con descuentos **atómicos bajo lock pesimista**
  (`SELECT ... FOR UPDATE`).
- **Turnos**: reserva de mascota + veterinario con **control de solapamiento
  bajo concurrencia real** (`pg_advisory_xact_lock`), estados con transiciones
  válidas, reprogramación.
- **Historia clínica**: registro de consultas ligado a una mascota (turno
  opcional); registrar una consulta desde un turno lo marca `ATENDIDO` y
  actualiza el peso de la mascota, todo en una transacción.
- **Vacunas**: registro de vacunas aplicadas que, si están asociadas a un
  producto de inventario, **descuentan stock en la misma transacción** —
  integración entre el módulo médico y el de inventario.
- **Documentación**: Swagger/OpenAPI navegable en `/api/docs`, con candado
  Bearer para probar endpoints protegidos desde el navegador.
- **Tests**: unitarios de la lógica de negocio crítica + e2e de flujo completo
  + tests de concurrencia real contra Postgres (turnos y stock en paralelo).

## Stack

- **Backend**: NestJS + TypeScript
- **Base de datos**: PostgreSQL + TypeORM (migraciones versionadas, sin `synchronize`)
- **Auth**: JWT (`@nestjs/jwt` + `passport-jwt`) con roles
- **Documentación**: `@nestjs/swagger` (OpenAPI 3)
- **Tests**: Jest + Supertest
- **Contenedores**: Docker + docker-compose

## Requisitos

- Docker y Docker Compose (recomendado), **o** Node.js 20+ y PostgreSQL 16 en
  local.

## Cómo levantar (Docker)

1. Copiar el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

2. Levantar API + base de datos:

   ```bash
   docker-compose up --build
   ```

   Esto levanta `db` (Postgres 16) y `api` (NestJS). La API espera a que la
   base de datos esté saludable (`healthcheck` de Postgres) antes de arrancar,
   y corre las migraciones pendientes automáticamente al iniciar
   (`migrationsRun: true`).

3. Verificar:

   ```bash
   curl http://localhost:3000/api/health
   # => { "status": "ok", "timestamp": "...", "db": "ok" }
   ```

4. Crear el usuario ADMIN inicial (una sola vez):

   ```bash
   docker compose exec api npm run seed:admin
   ```

   Usa `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.

## Cómo levantar (local, sin Docker)

1. Tener Postgres corriendo localmente y crear la base indicada en `.env`.
2. `cp .env.example .env` y ajustar `DATABASE_HOST` a `localhost` (en Docker
   apunta a `db`, el nombre del servicio).
3. `npm install`
4. `npm run migration:run`
5. `npm run seed:admin`
6. `npm run start:dev`

## Variables de entorno

Ver [.env.example](.env.example). Todas son requeridas: la app no arranca si
falta alguna o tiene un tipo inválido (validación al bootstrap).

## Documentación de la API (Swagger)

Con la API levantada, la documentación interactiva está en:

```
http://localhost:3000/api/docs
```

(puerto `3001` si se usa `docker-compose` con el `.env` de ejemplo). Ahí se
ven todos los endpoints agrupados por módulo, con sus DTOs documentados
(campos, tipos, ejemplos). Para probar endpoints protegidos:

1. `POST /api/auth/login` con el usuario ADMIN sembrado (o registrar uno nuevo
   vía `POST /api/auth/register`, que crea rol `EMPLOYEE`).
2. Copiar el `accessToken` de la respuesta.
3. Click en **Authorize** (candado, arriba a la derecha) y pegar el token.
4. Ya se puede ejecutar cualquier endpoint protegido desde la UI.

## Migraciones

- `npm run migration:generate -- migrations/NombreMigracion` — genera una
  migración a partir del diff entre entidades y el estado actual de la DB.
- `npm run migration:run` — corre migraciones pendientes.
- `npm run migration:revert` — revierte la última migración.

`synchronize` está deshabilitado siempre: todo cambio de esquema pasa por una
migración versionada (ver decisión D1 en [specs/f-01-fundacion.md](specs/f-01-fundacion.md)).

## Tests

```bash
npm test           # unitarios (Jest, con repos mockeados — no tocan la DB)
npm run test:e2e   # e2e + concurrencia (Supertest contra una DB de test real)
```

**Tests unitarios** (`src/**/*.spec.ts`): cubren la lógica de negocio crítica,
no CRUD trivial — solapamiento de turnos, transiciones de estado, el motor de
stock (`applyMovement`, ajustes, invariante nivel=Σmovimientos), y la
transaccionalidad de consultas/vacunas (marca turno atendido, actualiza peso,
descuenta stock). Usan repos y `DataSource` mockeados, corren sin Postgres.

**Tests e2e** (`test/*.e2e-spec.ts`): corren contra una base Postgres de test
separada (`vetsystem_test`), nunca contra la de desarrollo. Antes de correrlos
una vez:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE vetsystem_test;"
```

Las migraciones corren solas al bootstrapear la app de test
(`migrationsRun: true`), igual que en dev. La configuración vive en
[.env.test](.env.test) + [test/setup-env.ts](test/setup-env.ts).

- [`test/flow.e2e-spec.ts`](test/flow.e2e-spec.ts) — flujo completo: dueño →
  mascota → turno → consulta (marca atendido + actualiza peso) → vacuna
  (descuenta stock).
- [`test/concurrency.e2e-spec.ts`](test/concurrency.e2e-spec.ts) — **la parte
  más valiosa**: dispara N reservas de turno simultáneas para el mismo
  veterinario/horario (solo una debe ganar, el resto 409) y N descuentos de
  stock simultáneos del mismo producto (el nivel final debe coincidir exacto
  con `Σ movimientos`, sin pérdidas por condición de carrera).

Cada archivo e2e limpia (`TRUNCATE`) la base de test en su `beforeAll`, por lo
que corren de forma determinística en cualquier orden; `test:e2e` los corre en
serie (`--runInBand`) porque comparten la misma base física.

## Formato de error

Toda respuesta de error de la API tiene la forma:

```json
{
  "statusCode": 400,
  "message": "...",
  "error": "Bad Request",
  "timestamp": "2026-07-28T12:00:00.000Z",
  "path": "/api/..."
}
```

## Scripts

```bash
npm run start:dev       # desarrollo con watch
npm run build            # compilar a dist/
npm run start:prod       # correr build compilado
npm run test              # tests unitarios
npm run test:e2e          # tests e2e + concurrencia
npm run lint               # eslint --fix
npm run seed:admin        # crea el usuario ADMIN inicial
```

## Método SDD (Spec-Driven Development)

Este proyecto no se programó "sobre la marcha": cada módulo tiene una spec en
[specs/](specs/README.md) escrita **antes** del código, con objetivo, historias
de usuario, decisiones de diseño explícitas (y su porqué), modelo de datos,
contrato de la API y criterios de aceptación verificables. La regla es no
programar contra una spec que no esté aprobada, y marcar sus checkboxes a
medida que se implementa y verifica cada criterio.

El [mapa de specs](specs/README.md#4-mapa-de-specs) muestra el estado de cada
módulo y el orden de construcción (`f-01` → `f-02` → `p1-01` → … → `p3-01`,
donde el orden alfabético de los archivos es el orden real en que se
construyeron).

## Decisiones de diseño destacadas

Un resumen de las decisiones que más pesan en el diseño (el detalle completo,
con el razonamiento, está en cada spec):

- **Stock: ledger + nivel materializado** ([P1-04](specs/p1-04-productos-stock.md)).
  `stock_movements` es un libro inmutable de toda variación (auditoría);
  `stock_levels` es la existencia actual materializada, para lectura rápida y
  como fila a lockear. `StockService.applyMovement(manager, dto)` recibe el
  `EntityManager` de una transacción **externa**, precisamente para que otros
  módulos (vacunas) puedan descontar stock en su misma transacción sin
  reescribir nada.
- **Stock: concurrencia con lock pesimista.** Al descontar, se hace
  `SELECT ... FOR UPDATE` sobre la fila de `stock_levels` (creándola con
  `INSERT ... ON CONFLICT DO NOTHING` si no existe) dentro de la transacción,
  para que dos descuentos simultáneos del mismo producto no se pisen. Se
  permite terminar en negativo por defecto — en una vet real no se puede
  bloquear una vacuna ya aplicada por un descuadre de inventario.
- **Turnos: solapamiento con advisory lock** ([P2-01](specs/p2-01-turnos.md)).
  Al crear/reprogramar un turno, se toma `pg_advisory_xact_lock(veterinarianId)`
  dentro de la transacción antes de verificar solapamiento — serializa por
  veterinario sin bloquear turnos de otros profesionales, y se libera solo al
  cerrar la transacción.
- **Historia clínica conecta con turnos** ([P2-02](specs/p2-02-historia-clinica.md)).
  Registrar una consulta desde un turno lo marca `ATENDIDO` sin importar si
  estaba `PENDIENTE` o `CONFIRMADO` — una decisión deliberada: el evento
  clínico es una señal más fuerte que el flujo de estados que gestiona
  recepción, así que puentea esa cadena en vez de reusar el endpoint estricto
  de cambio de estado.
- **Vacunas conectan historia clínica + stock** ([P2-03](specs/p2-03-vacunas.md)).
  Si la vacuna tiene un producto asociado, insertar el registro y descontar
  el stock van en la misma transacción — si algo falla, no queda ni la vacuna
  ni el movimiento a medias.
- **Soft delete en todos lados.** Ningún recurso de negocio se borra
  físicamente (dueños, mascotas, veterinarios, productos, turnos, consultas,
  vacunas): se marca `active=false` o cambia de estado. Preserva el
  historial, que en un dominio clínico/financiero importa tanto como el dato
  vigente.

## Capturas

_Pendiente: agregar capturas de `/api/docs` (Swagger) y de un endpoint
funcionando (ej. la agenda de turnos o el detalle de un producto con
margen) una vez desplegado o corriendo en local — no se generaron capturas
automáticas en este entorno._
