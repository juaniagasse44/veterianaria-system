# F-01 · Fundación (setup del proyecto)

> **Fase Fundación.** Owner: Juan. Depende de: —.
> Es el cimiento: deja el proyecto listo para construir módulos encima. No crea
> ninguna entidad de veterinaria todavía.

---

## Objetivo
Dejar un proyecto NestJS operativo, conectado a PostgreSQL vía TypeORM, con
migraciones configuradas, Docker para levantar todo con un comando, y las piezas
transversales base (config tipada, validación global, manejo de errores
consistente, endpoint de salud). Al cerrar esta spec, `docker-compose up` levanta
API + DB y `GET /api/health` responde `{ status: "ok" }`.

## Historias de usuario
- Como desarrollador, quiero levantar API + base de datos con un solo comando,
  para no configurar nada a mano al clonar el repo.
- Como desarrollador, quiero migraciones versionadas, para que el esquema de la
  base evolucione de forma controlada y reproducible.
- Como desarrollador, quiero que los errores y las validaciones tengan siempre el
  mismo formato, para que la API sea predecible desde el primer módulo.

## Alcance
- **Incluye:** proyecto NestJS + TypeScript; TypeORM conectado a Postgres;
  configuración de migraciones (no `synchronize`); `ConfigModule` tipado;
  `ValidationPipe` global; filtro de excepciones global; prefijo global `/api`;
  módulo `health`; `docker-compose` (api + db); `Dockerfile`; `.env.example`;
  README de arranque.
- **Fuera de alcance:** autenticación (F-02); cualquier entidad de negocio
  (dueños, mascotas, etc. — sus specs); Swagger detallado (P3-01, acá solo se
  deja el paquete instalado si es trivial).

## Decisiones locales
- **D1 — Migraciones, no `synchronize`.** `synchronize: true` queda **prohibido**
  fuera de tests. Todo cambio de esquema va por migración. _Razón: es la práctica
  profesional y lo que un reclutador espera ver; evita perder datos._
- **D2 — Prefijo global `/api`.** Todas las rutas cuelgan de `/api` (ej.
  `/api/health`). _Consistencia con convención REST habitual._
- **D3 — IDs.** Se usan enteros autoincrementales (`serial`) como PK por
  simplicidad y legibilidad en desarrollo. _Si más adelante se quiere exponer
  públicamente, se evalúa UUID; para este proyecto, serial alcanza._
- **D4 — Formato de error.** Todas las respuestas de error tienen la forma
  `{ statusCode, message, error, timestamp, path }`. _Un solo formato en toda la
  API._

## Modelo de datos
Esta spec **no crea tablas de negocio**. Solo deja TypeORM configurado y la
tabla técnica de migraciones (`migrations`, que TypeORM administra solo).

Se crea **una migración inicial vacía** (o con la tabla de control) para verificar
que el pipeline de migraciones funciona de punta a punta.

## Backend

### Estructura de carpetas
```
src/
  main.ts                      # bootstrap: prefijo /api, ValidationPipe, filtro global
  app.module.ts                # módulo raíz: ConfigModule + TypeOrmModule + HealthModule
  config/
    typeorm.config.ts          # DataSource para migraciones (CLI)
    env.validation.ts          # validación de variables de entorno
  common/
    filters/
      all-exceptions.filter.ts # filtro global → formato de error D4
  health/
    health.module.ts
    health.controller.ts       # GET /api/health
migrations/
  <timestamp>-Init.ts          # migración inicial
```

### Piezas a configurar
- **TypeOrmModule** (async, leyendo de `ConfigService`): host, port, user, pass,
  db desde env; `synchronize: false`; `migrationsRun: true` (corre migraciones al
  arrancar); `entities` y `migrations` apuntando a los globs correctos.
- **DataSource** separado (`config/typeorm.config.ts`) para poder correr la CLI de
  migraciones (`migration:generate`, `migration:run`).
- **ConfigModule** global con validación de env (`env.validation.ts`): que la app
  no arranque si falta una variable crítica (falla temprano y claro).
- **ValidationPipe global** en `main.ts` con `whitelist: true`,
  `forbidNonWhitelisted: true`, `transform: true`.
- **AllExceptionsFilter** global: captura todo, loguea, y responde con el formato
  D4. Para errores no HTTP, responde 500 con mensaje genérico (no filtra internos).
- **HealthController**: `GET /api/health` → `{ status: "ok", timestamp }`.
  Opcional: chequear que la DB responde (ping) y devolver `db: "ok"`.

### Scripts de package.json (a dejar listos)
- `start:dev`, `build`, `start:prod`
- `migration:generate`, `migration:run`, `migration:revert`

### Docker
- `Dockerfile` multi-stage (build → runtime liviano).
- `docker-compose.yml` con servicios `api` y `db` (postgres:16-alpine),
  volumen para persistir la base, `depends_on`, y la API esperando a la DB
  (healthcheck o script de espera).
- `.env.example` con: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`,
  `DATABASE_PASSWORD`, `DATABASE_NAME`, `PORT`, `NODE_ENV`.

## Criterios de aceptación
- [x] `docker-compose up` levanta `api` + `db` sin errores.
- [x] Las migraciones corren solas al arrancar (`migrationsRun: true`) y la tabla
      `migrations` existe en la base.
- [x] `GET /api/health` responde `{ status: "ok" }` con código 200.
- [x] Enviar un body con un campo no esperado a cualquier endpoint devuelve 400
      (por `forbidNonWhitelisted`), con el formato de error D4.
- [x] Un error interno no expone stack trace ni detalles al cliente (500 genérico).
- [x] La app **no arranca** si falta una variable de entorno crítica (validación).
- [x] `synchronize` está en `false`.
- [x] Existe `.env.example` documentado y el README explica cómo levantar.

## Riesgos / notas
- **Espera de la DB:** el error más común es que la API arranque antes que
  Postgres esté listo. Resolver con healthcheck en compose o reintentos de
  conexión. _No dar por hecho que `depends_on` espera a que la DB acepte
  conexiones (solo espera a que el contenedor inicie)._
- **Globs de entities/migrations:** en TypeORM, si los paths de `entities` y
  `migrations` están mal, "no encuentra nada" y falla silencioso. Verificar que
  funcionen tanto en dev (ts) como en build (js).
- **No usar `synchronize` "solo para arrancar rápido":** es la trampa clásica.
  Migraciones desde el día uno (D1).

## Tareas
- [x] **Setup:** inicializar proyecto NestJS + TypeScript.
- [x] **DB:** instalar y configurar TypeORM + driver `pg`.
- [x] **DB:** `config/typeorm.config.ts` (DataSource para CLI).
- [x] **DB:** `TypeOrmModule.forRootAsync` en `app.module` leyendo de env.
- [x] **DB:** migración inicial + verificar `migration:run`.
- [x] **Back:** `ConfigModule` global + validación de env.
- [x] **Back:** `ValidationPipe` global en `main.ts` (whitelist + transform).
- [x] **Back:** `AllExceptionsFilter` global (formato D4).
- [x] **Back:** prefijo global `/api`.
- [x] **Back:** módulo `health` con `GET /api/health` (+ ping DB opcional).
- [x] **Docker:** `Dockerfile` multi-stage.
- [x] **Docker:** `docker-compose.yml` (api + db + volumen + espera DB).
- [x] **Docker:** `.env.example`.
- [x] **Docs:** sección "cómo levantar" en el README del proyecto.
- [x] **Prueba:** `docker-compose up` + `GET /api/health` OK + validación 400 OK.
