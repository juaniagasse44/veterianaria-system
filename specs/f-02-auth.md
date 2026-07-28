# F-02 · Autenticación y roles (JWT)

> **Fase Fundación.** Owner: Juan. Depende de: F-01.
> Deja el sistema de login listo para que todos los módulos siguientes puedan
> protegerse. No crea entidades de veterinaria todavía (dueños, mascotas, etc.).

---

## Objetivo
Implementar autenticación con JWT y control de acceso por roles, para que los
endpoints de los próximos módulos puedan exigir "estar logueado" y, en algunos
casos, "tener cierto rol". Incluye registro de usuarios, login, hash de
contraseñas, guard de JWT y guard de roles.

## Historias de usuario
- Como usuario del sistema (empleado de la veterinaria), quiero iniciar sesión con
  email y contraseña y recibir un token, para poder usar la API.
- Como administrador, quiero que ciertas acciones (ej. borrar, crear usuarios)
  solo las puedan hacer usuarios con rol admin, para proteger operaciones
  sensibles.
- Como desarrollador, quiero un decorador simple para proteger endpoints y para
  exigir roles, para no repetir lógica de seguridad en cada controller.

## Alcance
- **Incluye:** entidad `User` con rol; registro (`POST /api/auth/register`);
  login (`POST /api/auth/login`) que devuelve un JWT; hash de contraseña con
  bcrypt; `JwtAuthGuard`; `RolesGuard` + decorador `@Roles()`; decorador
  `@CurrentUser()` para acceder al usuario logueado; endpoint `GET /api/auth/me`.
- **Fuera de alcance:** recuperación de contraseña por email; refresh tokens
  (se puede mencionar como mejora futura, no se implementa); verificación de
  email; OAuth/redes sociales. _Se mantiene simple y sólido._

## Decisiones locales
- **D1 — Roles como enum, no tabla.** Los roles (`ADMIN`, `EMPLOYEE`) se manejan
  como un enum en la columna `role` del usuario. _Razón: para este proyecto no
  hace falta un sistema de permisos granular con tabla de roles; un enum es
  suficiente, claro y menos código. Si el proyecto creciera, se migra a tabla._
- **D2 — Dos roles al inicio:** `ADMIN` (puede todo, incluido gestionar usuarios)
  y `EMPLOYEE` (recepción: gestiona clientes, mascotas, turnos, pero no borra ni
  administra usuarios). _Se pueden agregar más después sin romper nada._
- **D3 — Contraseña nunca se devuelve.** El campo `password` se excluye de todas
  las respuestas (select: false en la entidad + nunca serializarlo). _Seguridad
  básica no negociable._
- **D4 — JWT en header Authorization: Bearer.** El token va en el header estándar.
  Expiración configurable por env (`JWT_EXPIRES_IN`, default `1d`). Secreto en env
  (`JWT_SECRET`). _Nunca hardcodear el secreto._
- **D5 — Primer usuario.** El registro (`/register`) crea usuarios con rol
  `EMPLOYEE` por defecto. Para crear el primer `ADMIN`, se puede: (a) un seed
  inicial, o (b) permitir que el registro acepte rol solo si no hay usuarios aún.
  **Decisión: seed inicial** que crea un admin por defecto (credenciales por env).
  _Más simple y controlado que lógica condicional en el registro._

## Modelo de datos

### `users`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| email | varchar(150) NOT NULL | único (índice único) |
| password | varchar(255) NOT NULL | hash bcrypt; `select: false` |
| full_name | varchar(150) NOT NULL | nombre del empleado |
| role | varchar(20) NOT NULL | enum: 'ADMIN' / 'EMPLOYEE'; default 'EMPLOYEE' |
| active | boolean NOT NULL default true | permite desactivar sin borrar |
| creation_date | timestamp default now() | |
| last_update_date | timestamp | |

- Índice: `UQ_users_email` UNIQUE (email).
- Migración aditiva (crea la tabla `users`).

## Backend (módulo `src/auth/` + `src/users/`)

### Entidad y módulo de usuarios (`src/users/`)
- Entidad `User` (con `select: false` en password, enum de rol).
- `UsersService`: `create`, `findByEmail` (incluyendo password para login),
  `findById`, `findAll`, `deactivate`.

### Módulo de auth (`src/auth/`)
- **DTOs:** `RegisterDto` (email, password, fullName), `LoginDto` (email, password).
- **`AuthService`:**
  - `register(dto)`: valida email único, hashea password con bcrypt, crea usuario.
  - `login(dto)`: busca por email, compara password con bcrypt, si es válido
    firma y devuelve `{ accessToken, user }` (user sin password).
  - `validateUser(payload)`: usado por la estrategia JWT.
- **Estrategia JWT** (`jwt.strategy.ts`): valida el token, extrae el usuario.
- **Guards:**
  - `JwtAuthGuard`: exige token válido.
  - `RolesGuard`: lee los roles requeridos del decorador y compara con el del usuario.
- **Decoradores:**
  - `@Roles(...roles)`: marca qué roles puede acceder a un endpoint.
  - `@CurrentUser()`: inyecta el usuario logueado en el controller.
- **`AuthController`:**
  - `POST /api/auth/register` → crea usuario (rol EMPLOYEE por D5).
  - `POST /api/auth/login` → devuelve JWT.
  - `GET /api/auth/me` (protegido) → devuelve el usuario actual.

### Seed inicial (D5)
- Un script/seed que crea un usuario `ADMIN` si no existe, con email y password
  tomados de env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Se corre una vez.

### Variables de entorno nuevas
- `JWT_SECRET`, `JWT_EXPIRES_IN` (default `1d`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Agregar a `.env.example` y a la validación de env (F-01).

## Criterios de aceptación
- [ ] `POST /api/auth/register` crea un usuario con password hasheada (nunca en
      texto plano) y rol EMPLOYEE.
- [ ] `POST /api/auth/login` con credenciales correctas devuelve un JWT válido y
      el usuario **sin** el campo password.
- [ ] `POST /api/auth/login` con credenciales incorrectas devuelve 401.
- [ ] `GET /api/auth/me` sin token devuelve 401; con token válido devuelve el
      usuario actual.
- [ ] Un endpoint protegido con `@Roles('ADMIN')` devuelve 403 si lo llama un
      EMPLOYEE, y funciona si lo llama un ADMIN.
- [ ] El campo `password` no aparece en NINGUNA respuesta de la API.
- [ ] El seed crea un ADMIN inicial con credenciales de env.
- [ ] Registrar dos veces el mismo email devuelve error claro (409 o 400), no 500.

## Riesgos / notas
- **Fuga de password:** el error clásico es que `password` se cuele en alguna
  respuesta (ej. al devolver el user tras login). Verificar con `select: false` +
  revisar cada respuesta. _Es lo primero que mira un reclutador de seguridad._
- **Secreto del JWT:** nunca hardcodearlo ni commitearlo. Va en env y en
  `.env.example` con un valor de ejemplo obvio (`change-me`).
- **bcrypt salt rounds:** usar 10-12 rounds (balance seguridad/velocidad).
- **Timing de comparación:** bcrypt.compare ya maneja esto; no comparar hashes
  manualmente.
- **Este módulo habilita todo lo demás:** a partir de acá, cada spec de negocio
  va a decir qué endpoints requieren auth y qué rol. Dejar los guards y
  decoradores bien probados ahora ahorra dolores después.

## Tareas
- [ ] **DB:** migración tabla `users` + índice único email.
- [ ] **Back:** entidad `User` (enum rol, password select:false).
- [ ] **Back:** `UsersModule` + `UsersService` (create, findByEmail, findById…).
- [ ] **Back:** instalar dependencias (`@nestjs/jwt`, `@nestjs/passport`,
      `passport-jwt`, `bcrypt`).
- [ ] **Back:** `AuthModule` + `AuthService` (register, login, hash, firma JWT).
- [ ] **Back:** `JwtStrategy` + `JwtAuthGuard`.
- [ ] **Back:** `RolesGuard` + decorador `@Roles()` + `@CurrentUser()`.
- [ ] **Back:** `AuthController` (register, login, me).
- [ ] **Back:** seed de ADMIN inicial (credenciales de env).
- [ ] **Config:** agregar `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`,
      `ADMIN_PASSWORD` a `.env.example` y a la validación de env.
- [ ] **Prueba:** registrar, loguear, acceder a `/me`, y probar un endpoint
      protegido por rol (crear uno de prueba temporal si hace falta).
