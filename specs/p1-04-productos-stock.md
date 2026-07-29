# P1-04 · Productos + Stock

> **Fase 1 (MVP).** Owner: Juan. Depende de: F-02 (auth).
> Catálogo de productos que vende la veterinaria (alimento, accesorios,
> medicamentos, vacunas como insumo) + control de inventario. El stock se conecta
> después con las vacunas (P2-03), que descuentan del inventario al aplicarse.
> **Es la primera spec con lógica transaccional/concurrencia.**

---

## Objetivo
Dos entidades relacionadas: **`Product`** (catálogo con precio, costo, categoría) y
el **stock** (existencia por producto, con movimientos registrados). El diseño de
stock usa el patrón **ledger + nivel materializado** para poder descontar de forma
segura incluso con operaciones simultáneas.

## Historias de usuario
- Como empleado, doy de alta un producto (nombre, precio, costo, categoría) y le
  cargo un stock inicial.
- Como empleado, veo qué productos están por debajo del stock mínimo (para reponer).
- Como sistema, cuando se aplica una vacuna (P2-03) o se registra una salida, el
  stock se descuenta de forma atómica y queda un movimiento registrado.
- Como dueño, veo el margen (precio − costo) de cada producto.

## Alcance
- **Incluye:** CRUD de productos y categorías; stock por producto con movimientos
  (entrada/salida/ajuste); stock mínimo + alerta de bajo stock; valorización;
  el motor `applyMovement` transaccional (con lock) listo para que P2-03 lo use.
- **Fuera de alcance:** ventas completas con carrito/caja (eso quedó como X-01
  opcional); múltiples depósitos/sucursales (una sola ubicación en MVP);
  variantes de producto (talle/color).

## Decisiones locales
- **D1 — Ledger + nivel materializado.** (Igual patrón que usa el proyecto de
  referencia.) `stock_movements` = libro inmutable de toda variación (fuente de
  verdad/auditoría). `stock_levels` = existencia actual materializada por producto,
  para lectura rápida y para el lock al descontar. Invariante:
  `stock_levels.quantity == SUM(stock_movements.quantity)`.
- **D2 — Concurrencia con lock pesimista.** Al descontar stock se hace
  `SELECT ... FOR UPDATE` sobre la fila de `stock_levels` (o INSERT ON CONFLICT si
  no existe), para que dos operaciones simultáneas del mismo producto no dejen el
  stock inconsistente. _Este es el punto técnicamente delicado y el que más
  demuestra habilidad._
- **D3 — Permitir stock negativo, configurable.** Por defecto se permite descontar
  aunque quede negativo (no trabar la operación), pero se alerta. _En una vet, no
  querés que el sistema impida aplicar una vacuna por un descuadre de inventario._
  Flag conceptual `allowNegativeStock` (default true).
- **D4 — Productos que no llevan stock.** Un producto puede tener
  `track_stock=false` (ej. un servicio, o algo que no se inventaría). Esos no
  generan movimientos ni bloquean nada.
- **D5 — Permisos.** Ver productos/stock: ADMIN y EMPLOYEE. Crear/editar productos
  y hacer ajustes de stock: ADMIN y EMPLOYEE (recepción repone). Borrar producto:
  solo ADMIN (soft delete).
- **D6 — Categoría de IVA / margen.** Se guarda `cost` y `sale_price`; el margen se
  calcula (no se guarda). Alícuota de IVA opcional (no se factura en este proyecto,
  pero el campo queda por realismo).

## Modelo de datos

### `product_categories`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| name | varchar(120) NOT NULL | |
| active | boolean default true | |
| creation_date / last_update_date | timestamp | |

### `products`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| category_id | int FK→product_categories null | |
| sku | varchar(60) null | único parcial si no null |
| barcode | varchar(64) null | índice para búsqueda |
| name | varchar(200) NOT NULL | |
| description | varchar(500) null | |
| sale_price | decimal(20,6) NOT NULL | precio de venta |
| cost | decimal(20,6) NOT NULL default 0 | para margen |
| vat_rate | decimal(5,2) null | alícuota IVA opcional (D6) |
| unit | varchar(20) default 'UNIDAD' | UNIDAD/KG/LT |
| track_stock | boolean default true | si descuenta inventario (D4) |
| active | boolean default true | soft delete |
| creation_date / last_update_date | timestamp | |

- Índices: `IDX_products_name`, `IDX_products_barcode`,
  `UQ_products_sku` UNIQUE parcial (sku) WHERE sku IS NOT NULL.

### `stock_levels`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| product_id | int FK→products NOT NULL | |
| quantity | decimal(14,4) NOT NULL default 0 | existencia actual |
| min_quantity | decimal(14,4) default 0 | umbral de alerta |
| creation_date / last_update_date | timestamp | |

- `UQ_stock_levels_product` UNIQUE (product_id) — una fila de nivel por producto.

### `stock_movements`
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| product_id | int FK→products NOT NULL | |
| quantity | decimal(14,4) NOT NULL | **con signo**: + entrada, − salida |
| type | varchar(20) NOT NULL | enum: INITIAL/PURCHASE/SALE/ADJUSTMENT/RETURN |
| unit_cost | decimal(20,6) null | costo al momento (valorización) |
| reference_type | varchar(20) null | ej: 'VACCINE' / 'MANUAL' |
| reference_id | int null | id del origen (ej. la vacuna aplicada) |
| notes | varchar(300) null | |
| creation_date | timestamp default now() | |

- Índices: `IDX_movements_product`, `IDX_movements_reference`.

## Backend

### Módulo `src/products/`
- Entidades `Product`, `ProductCategory`.
- `ProductsService`: CRUD, `search` (nombre/sku/barcode ILIKE), `findByBarcode`.
- `ProductCategoriesService`: CRUD de categorías.
- Controllers `/api/products` y `/api/product-categories` con guards.

### Módulo `src/stock/`
- Entidades `StockLevel`, `StockMovement` + enum `StockMovementType`.
- **`StockService.applyMovement(manager, dto)`** — el corazón (D2):
  1. Recibe el `EntityManager` de una transacción externa (para componerse con
     P2-03: aplicar vacuna + descontar stock en la misma transacción).
  2. `SELECT ... FOR UPDATE` sobre `stock_levels` del producto (o crea la fila).
  3. Calcula nueva cantidad. Si es salida y quedaría negativo y `allowNegativeStock`
     es false → `ConflictException`. Si true → sigue y marca alerta.
  4. Inserta el `stock_movement` y actualiza `stock_levels.quantity`. Todo bajo el lock.
- `getLevel(productId)`, `listLowStock()` (quantity ≤ min_quantity),
  `adjust(productId, newQty, notes)` (genera ADJUSTMENT por la diferencia),
  `setInitialStock(productId, qty)`, `valuation()` (Σ quantity × costo),
  `listMovements(productId)`.
- Controller `/api/stock`: `GET /levels`, `GET /low`, `GET /valuation`,
  `GET /movements?productId=`, `POST /adjust`, `POST /initial`.

## Criterios de aceptación
- [ ] CRUD de productos y categorías; endpoints con JWT.
- [ ] Búsqueda de producto por nombre/sku/barcode.
- [ ] Margen calculado = sale_price − cost (y % si aplica).
- [ ] Cargar stock inicial crea un movimiento INITIAL y setea el nivel.
- [ ] Un ajuste manual genera un movimiento ADJUSTMENT con la diferencia y
      actualiza el nivel.
- [ ] `applyMovement` de salida descuenta y registra el movimiento **en la misma
      transacción**; si algo falla, no queda inconsistente.
- [ ] `stock_levels.quantity == SUM(movements)` se mantiene siempre.
- [ ] Productos con `track_stock=false` no generan movimientos.
- [ ] `GET /low` lista los productos bajo mínimo; `valuation` da el total correcto.
- [ ] (Si se testea concurrencia) dos salidas simultáneas del mismo producto no
      rompen el nivel — el lock las serializa.

## Riesgos / notas
- **Concurrencia (el punto clave):** NO hacer read-modify-write sin lock. Usar
  `FOR UPDATE` sobre `stock_levels` dentro de la transacción. Este es el mismo
  patrón que usa el proyecto de referencia en su spec de stock; es lo que más
  demuestra nivel. _Idealmente escribir un test que dispare dos salidas en
  paralelo y verifique el nivel final._
- **Compensación:** una salida que después se anula debe generar un movimiento
  inverso (RETURN), nunca borrar el movimiento original (ledger inmutable).
- **applyMovement recibe el manager externo:** esto es lo que permite que P2-03
  (aplicar vacuna) descuente stock en su misma transacción. Diseñarlo así desde
  ahora evita reescribirlo después.
- **Decimales de dinero y cantidad:** money `decimal(20,6)`, cantidad
  `decimal(14,4)`. Nunca float para plata.

## Tareas
- [ ] **DB:** migración `product_categories` + `products` + índices.
- [ ] **DB:** migración `stock_levels` + `stock_movements` + índices/únicos.
- [ ] **Back:** módulo `products` (entidades, DTOs, services, controllers).
- [ ] **Back:** módulo `stock` con `applyMovement` transaccional (lock D2).
- [ ] **Back:** endpoints de stock (levels, low, valuation, movements, adjust, initial).
- [ ] **Back:** registrar ambos módulos en `app.module`.
- [ ] **Prueba:** CRUD productos, stock inicial, ajuste, bajo-mínimo, valorización,
      producto sin track_stock, y (opcional pero recomendado) test de concurrencia.
