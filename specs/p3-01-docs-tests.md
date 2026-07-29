# P3-01 · Documentación (Swagger) + Tests

> **Fase 3.** Owner: Juan. Depende de: todas las anteriores.
> No agrega funcionalidad nueva: hace que el proyecto se vea y se comporte como
> uno profesional. Es lo que más separa un proyecto junior "de tutorial" de uno
> "listo para trabajo". No te la saltees: acá se gana la mitad de la impresión.

---

## Objetivo
Dos cosas que elevan el proyecto: (1) **documentación Swagger/OpenAPI** navegable
donde se ven y se prueban todos los endpoints, y (2) **tests automatizados** que
verifican las reglas de negocio críticas — sobre todo las de concurrencia
(solapamiento de turnos y descuento de stock), que son las que más impresionan.

## Historias de usuario
- Como reclutador/desarrollador, entro a `/api/docs` y veo toda la API documentada,
  con los endpoints, sus parámetros y respuestas, y puedo probarla desde el navegador.
- Como desarrollador, corro `npm test` y veo que las reglas críticas del sistema
  están cubiertas y pasan.
- Como Juan, muestro en el README que el proyecto tiene tests y documentación,
  con capturas.

## Alcance
- **Incluye:** configurar Swagger en todos los módulos (tags, descripciones,
  DTOs documentados, auth Bearer en la UI); tests unitarios de la lógica de negocio
  crítica; al menos un test de integración/e2e del flujo principal; un test de
  concurrencia (turnos o stock); README del proyecto completo con instrucciones,
  stack, capturas y explicación del método SDD.
- **Fuera de alcance:** cobertura 100% (se apunta a las reglas críticas, no a todo);
  tests de carga/performance; CI/CD completo (se puede dejar anotado como mejora, o
  agregar un GitHub Action simple si sobra tiempo).

## Decisiones locales
- **D1 — Priorizar tests de reglas de negocio, no de CRUD trivial.** No hace falta
  testear "crear devuelve 201". Hay que testear lo que tiene lógica: solapamiento de
  turnos, transiciones de estado, descuento de stock, transaccionalidad de vacunas.
  _La calidad del test importa más que la cantidad._
- **D2 — El test de concurrencia es la joya.** Escribir al menos un test que dispare
  dos operaciones en paralelo (dos turnos que se solapan, o dos salidas de stock) y
  verifique que el sistema se comporta bien (una sola gana / el nivel queda
  correcto). _Es lo que un reclutador técnico mira y dice "este entiende de verdad"._
- **D3 — Swagger con auth.** Configurar el candado Bearer en la UI de Swagger para
  poder probar endpoints protegidos pegando el token. _Que la doc sea usable, no
  solo decorativa._
- **D4 — README como carta de presentación.** El README del repo es lo primero que
  ve quien entra. Debe tener: qué es, stack, cómo levantarlo (Docker), link a
  Swagger, mención al método SDD (con link a la carpeta specs/), y capturas.

## Backend / Configuración

### Swagger
- Instalar `@nestjs/swagger`.
- Configurar en `main.ts`: título, descripción, versión, tag por módulo, y
  `addBearerAuth()` para el candado (D3). Servir en `/api/docs`.
- Decorar DTOs con `@ApiProperty()` (descripción, ejemplo) para que la doc muestre
  los campos bien.
- Decorar controllers con `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` en los
  endpoints principales.

### Tests
- **Unitarios** (Jest) de los services con lógica:
  - `AppointmentsService`: solapamiento (mismo vet solapa → error; otro vet ok;
    cancelado no cuenta), transiciones de estado inválidas, no-en-el-pasado.
  - `StockService`: applyMovement descuenta bien, ajuste genera diferencia,
    invariante nivel == suma de movimientos.
  - `ConsultationsService`: registrar desde turno marca ATENDIDO + actualiza peso.
  - `VaccinationsService`: con producto descuenta stock; sin producto no toca stock;
    transaccionalidad.
- **Integración/e2e** (al menos uno): flujo completo —
  registrar dueño → mascota → turno → atender (consulta) → vacunar (descuenta stock)
  — contra una base de test.
- **Concurrencia (D2):** un test que lanza dos `create` de turno solapados en
  paralelo (`Promise.all`) y verifica que solo uno se crea; o dos salidas de stock
  simultáneas y el nivel final es correcto.

## Documentación (README del proyecto)
- Secciones: descripción, características, stack, requisitos, cómo levantar (Docker,
  paso a paso), variables de entorno, link a Swagger (`/api/docs`), explicación del
  método SDD con link a `specs/`, capturas (Swagger, algún endpoint funcionando),
  y una sección "decisiones de diseño" que resuma las D más interesantes (lock de
  turnos, ledger de stock, etc.).

## Criterios de aceptación
- [ ] `/api/docs` muestra toda la API, agrupada por módulos (tags), con el candado
      Bearer funcionando para probar endpoints protegidos.
- [ ] Los DTOs se ven documentados en Swagger (campos, tipos, ejemplos).
- [ ] `npm test` corre y pasan los tests de las reglas críticas (solapamiento,
      estados, stock, transaccionalidad de vacunas).
- [ ] Existe al menos un test de concurrencia que verifica el comportamiento bajo
      operaciones simultáneas.
- [ ] Existe al menos un test e2e del flujo principal.
- [ ] El README del repo está completo, con instrucciones de levantado y capturas.
- [ ] El README enlaza a la carpeta `specs/` y explica el método SDD usado.

## Riesgos / notas
- **Base de datos de test:** los tests que tocan DB necesitan una base separada (o
  contenedor de test / SQLite en memoria para unitarios / Postgres de test para
  e2e). No correr tests contra la base de desarrollo. _Configurar bien el entorno
  de test evita sorpresas._
- **Tests de concurrencia son delicados:** requieren transacciones reales para
  reproducir la condición de carrera. Un test mal armado puede dar falsos verdes.
  Vale la pena hacerlo con cuidado porque es el más valioso.
- **No sobre-testear:** apuntar a las reglas de negocio (D1). Un proyecto con 15
  tests bien elegidos vale más que 100 tests de getters.
- **Swagger desactualizado:** mantener las anotaciones al día. Si un DTO cambia y la
  doc no, confunde. _Idealmente la doc sale de los DTOs, así se mantiene sola._

## Tareas
- [ ] **Back:** instalar y configurar `@nestjs/swagger` en `main.ts` (+ Bearer auth).
- [ ] **Back:** decorar DTOs con `@ApiProperty` y controllers con `@ApiTags`/`@ApiOperation`.
- [ ] **Test:** setup de entorno de test (base de test / config Jest).
- [ ] **Test:** unitarios de `AppointmentsService` (solapamiento, estados, pasado).
- [ ] **Test:** unitarios de `StockService` (applyMovement, ajuste, invariante).
- [ ] **Test:** unitarios de `ConsultationsService` y `VaccinationsService`
      (transaccionalidad, marca atendido, descuenta stock).
- [ ] **Test:** un e2e del flujo completo (dueño → mascota → turno → consulta → vacuna).
- [ ] **Test:** un test de concurrencia (turnos solapados o stock paralelo) (D2).
- [ ] **Docs:** README completo del proyecto (D4) con capturas y link a specs/.
- [ ] **Opcional:** GitHub Action que corra los tests en cada push.
