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
- Siguiente: **F-02 (Autenticación y roles)**.

### Hecho
- **F-01 (Fundación)**: NestJS + TypeORM + PostgreSQL + Docker operativos.
  `docker-compose up` levanta API + DB, migraciones corren solas, `GET /api/health`
  responde `{ status: "ok" }`, validación global y formato de error D4 en su lugar.

---

## 4. Mapa de specs

| ID | Spec | Fase | Estado | Depende de |
|-------|------|------|--------|------------|
| F-01 | Fundación (setup NestJS + Postgres + TypeORM + Docker) | Fundación | ✅ Hecho | — |
| F-02 | Autenticación y roles (JWT) | Fundación | ☐ Pendiente | F-01 |
| P1-01 | Dueños (clientes) | Fase 1 | ☐ Pendiente | F-02 |
| P1-02 | Mascotas | Fase 1 | ☐ Pendiente | P1-01 |
| P1-03 | Veterinarios | Fase 1 | ☐ Pendiente | F-02 |
| P1-04 | Productos + Stock | Fase 1 | ☐ Pendiente | F-02 |
| P2-01 | Turnos (con reglas de solapamiento) | Fase 2 | ☐ Pendiente | P1-02, P1-03 |
| P2-02 | Historia clínica / consultas | Fase 2 | ☐ Pendiente | P2-01 |
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
