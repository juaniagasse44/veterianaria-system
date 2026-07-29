# VetSystem — Especificaciones (SDD)

Sistema de gestión para veterinarias. API REST construida con enfoque
**Spec-Driven Development**: primero se escribe la spec (qué / por qué / diseño /
criterios), se aprueba, y recién ahí se programa.

> **Regla no negociable:** no se programa contra una spec que no está aprobada.

---

## 1. Objetivo del proyecto

Backend para gestionar el día a día de una veterinaria: clientes y sus mascotas,
turnos con reglas reales, historia clínica, vacunas y un stock de productos
integrado con la parte médica. Pensado como proyecto de portfolio: prolijo,
documentado, testeado y desplegado.

---

## 2. Convenciones técnicas (fijas)

- **Backend:** NestJS + TypeScript
- **Base de datos:** PostgreSQL + TypeORM (migraciones)
- **Auth:** JWT con roles
- **Documentación:** Swagger (OpenAPI)
- **Tests:** Jest
- **Contenedores:** Docker + docker-compose
- **Despliegue:** Railway o Render

Owner: Juan (proyecto individual).

---

## 3. Estado actual

### En curso / próximo
- Siguiente: **P2-03 (Vacunas)**.

### Hecho
- **F-01 (Fundación)**: NestJS + TypeORM + PostgreSQL + Docker operativos.
  `docker-compose up` levanta API + DB, migraciones corren solas, `GET /api/health`
  responde `{ status: "ok" }`, validación global y formato de error D4 en su lugar.
- **F-02 (Autenticación y roles)**: entidad `User` (roles `ADMIN`/`EMPLOYEE`),
  registro, login con JWT, `JwtAuthGuard`, `RolesGuard`, `@Roles()`,
  `@CurrentUser()`, `GET /api/auth/me`, seed de ADMIN inicial (`npm run
  seed:admin`). Password nunca se devuelve en ninguna respuesta.
- **P1-01 (Dueños/clientes)**: CRUD completo (`/api/owners`) protegido por JWT,
  búsqueda por nombre/teléfono/documento (ILIKE), paginación, documento único
  parcial (permite múltiples `null`), baja lógica (`active=false`, solo ADMIN).
- **P1-02 (Mascotas)**: CRUD (`/api/pets`) relacionado 1-N con `Owner`, edad
  calculada desde `birth_date`, ficha del dueño muestra sus mascotas, regla de
  no dar de baja un dueño con mascotas activas (409).
- **P1-03 (Veterinarios)**: CRUD (`/api/veterinarians`), matrícula única
  parcial, ver/listar para ADMIN y EMPLOYEE, crear/editar/borrar solo ADMIN.
- **P1-04 (Productos + Stock)**: catálogo (`/api/products`,
  `/api/product-categories`) con margen calculado; stock con patrón ledger +
  nivel materializado (`stock_levels`/`stock_movements`), `StockService.applyMovement`
  transaccional con `SELECT ... FOR UPDATE` (probado con 20 descuentos
  concurrentes sobre el mismo producto, sin pérdidas).
- **P2-01 (Turnos)**: `/api/appointments` con control de solapamiento por
  veterinario usando advisory lock transaccional (`pg_advisory_xact_lock`),
  transiciones de estado (D4), reprogramación con revalidación, cancelados no
  cuentan para el solapamiento. Probado con 10 reservas simultáneas al mismo
  horario/veterinario: solo 1 ganó, el resto recibió 409.
- **P2-02 (Historia clínica)**: `/api/consultations`, registro clínico ligado a
  una mascota (turno opcional). Crear una consulta desde un turno lo marca
  ATENDIDO y, si trae `weight`, actualiza el peso actual de la mascota — todo en
  una sola transacción (D2/D3). Historia clínica por mascota ordenada por fecha.

---

## 4. Mapa de specs

| ID | Spec | Fase | Estado | Depende de |
|-------|------|------|--------|------------|
| F-01 | Fundación (setup NestJS + Postgres + TypeORM + Docker) | Fundación | ✅ Hecho | — |
| F-02 | Autenticación y roles (JWT) | Fundación | ✅ Hecho | F-01 |
| P1-01 | Dueños (clientes) | Fase 1 | ✅ Hecho | F-02 |
| P1-02 | Mascotas | Fase 1 | ✅ Hecho | P1-01 |
| P1-03 | Veterinarios | Fase 1 | ✅ Hecho | F-02 |
| P1-04 | Productos + Stock | Fase 1 | ✅ Hecho | F-02 |
| P2-01 | Turnos (con reglas de solapamiento) | Fase 2 | ✅ Hecho | P1-02, P1-03 |
| P2-02 | Historia clínica / consultas | Fase 2 | ✅ Hecho | P2-01 |
| P2-03 | Vacunas (descuenta stock) | Fase 2 | ☐ Pendiente | P1-02, P1-04 |
| P3-01 | Documentación Swagger + tests | Fase 3 | ☐ Pendiente | todo |

**Estados:** ☐ Pendiente · 🟡 En progreso · ✅ Hecho

### Extra opcional (solo si sobra tiempo, NO requerido para dar por terminado)
| ID | Spec | Nota |
|-------|------|------|
| X-01 | Ventas de productos | Similar a Tercer Tiempo, se suma solo si hay tiempo |
| X-02 | Caja / gastos | Ídem |

---

## 5. Orden de construcción

Los archivos de spec están en esta misma carpeta, nombrados para que el
**orden alfabético = orden de construcción**:

`f-01-fundacion.md` → `f-02-auth.md` → `p1-01-duenos.md` →
`p1-02-mascotas.md` → `p1-03-veterinarios.md` → `p1-04-productos-stock.md` →
`p2-01-turnos.md` → `p2-02-historia-clinica.md` → `p2-03-vacunas.md` →
`p3-01-docs-tests.md`

---

## 6. Cómo se trabaja cada spec

1. Se lee y aprueba la spec (objetivo, alcance, modelo de datos, criterios).
2. Se implementa marcando las tareas `- [ ]` → `- [x]` a medida que se avanza.
3. Al terminar, se actualiza este README: la fila pasa a ✅ y se anota en "Estado actual".
4. Se pasa a la siguiente.
