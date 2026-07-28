# VetSystem — API

Backend de gestión veterinaria. NestJS + TypeORM + PostgreSQL, construido con
enfoque Spec-Driven Development (ver [specs/](specs/README.md)).

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

## Cómo levantar (local, sin Docker)

1. Tener Postgres corriendo localmente y crear la base indicada en `.env`.
2. `cp .env.example .env` y ajustar `DATABASE_HOST` a `localhost` (en Docker
   apunta a `db`, el nombre del servicio).
3. `npm install`
4. `npm run migration:run`
5. `npm run start:dev`

## Migraciones

- `npm run migration:generate -- migrations/NombreMigracion` — genera una
  migración a partir del diff entre entidades y el estado actual de la DB.
- `npm run migration:run` — corre migraciones pendientes.
- `npm run migration:revert` — revierte la última migración.

`synchronize` está deshabilitado siempre: todo cambio de esquema pasa por una
migración versionada (ver decisión D1 en [specs/f-01-fundacion.md](specs/f-01-fundacion.md)).

## Variables de entorno

Ver [.env.example](.env.example). Todas son requeridas: la app no arranca si
falta alguna o tiene un tipo inválido (validación al bootstrap).

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
npm run test:e2e          # tests e2e
```

## Specs

El desarrollo sigue Spec-Driven Development: ver [specs/README.md](specs/README.md)
para el mapa completo de specs y su estado.
