# Plan de implementación S5 (Productos y Roles) y S6 (Pedidos)

> Fecha límite: 30/11  
> Rama: `feature/productos-pedidos` (parte de QA)

---

## 1. Diseño de entidades

### Product (ya existe — tabla `products`)

Campos actuales confirmados en la migración `CreateProducts`:

| Columna       | Tipo               | Notas                              |
|---------------|--------------------|------------------------------------|
| id            | SERIAL PK          |                                    |
| code          | VARCHAR(150)       | identificador de negocio, debe ser UNIQUE |
| name          | VARCHAR(150)       |                                    |
| description   | TEXT               | nullable                           |
| price         | NUMERIC(10,2)      |                                    |
| image_url     | TEXT               | nullable                           |
| stock         | INTEGER            | DEFAULT 0                          |
| category_id   | INTEGER            | referencia a categorías (sin FK declarada) |
| createdAt     | TIMESTAMP          |                                    |
| updatedAt     | TIMESTAMP          |                                    |
| views         | INTEGER            | DEFAULT 0                          |

**Faltan** (migración nueva requerida — `AddProductSoftDeleteAndUnique`):
- `deleted_at TIMESTAMP NULL` — columna de soft delete (TypeORM `deleteDate: true`).
- `is_active BOOLEAN NOT NULL DEFAULT true` — flag de visibilidad (admin puede desactivar sin eliminar).
- `UNIQUE` constraint en `code` (actualmente no existe).
- `category_name VARCHAR(100) NOT NULL` — el modelo no tiene tabla de categorías; `category_id` apunta al vacío. Dos opciones posibles (ver decisiones pendientes).

### Category (decisión pendiente — ver sección 4)

Dos alternativas:
- **Opción A** (simple): guardar `category_name` en la misma tabla `products`. No requiere nueva tabla ni FK.
- **Opción B** (relacional): crear tabla `categories(id, name)` y hacer que `category_id` apunte a ella con FK.

> **Decisión requerida (#D1)**: ¿prefieres Opción A o B? Por defecto propondré A (menos cambios, entrega más rápida).

### Order (nueva — tabla `orders`)

| Columna      | Tipo                        | Notas                        |
|--------------|-----------------------------|------------------------------|
| id           | SERIAL PK                   |                              |
| user_id      | INTEGER FK → users(id)      | NOT NULL                     |
| status       | VARCHAR (enum en app)       | pending / paid / shipped / delivered / cancelled |
| total        | NUMERIC(10,2)               | calculado en servidor        |
| created_at   | TIMESTAMP DEFAULT NOW()     |                              |
| updated_at   | TIMESTAMP DEFAULT NOW()     |                              |

> **Decisión requerida (#D2)**: ¿confirmas los 5 estados? ¿Alguno adicional (p.ej. `refunded`)?

Transiciones permitidas (propuesta):

```
pending  → paid | cancelled
paid     → shipped | cancelled
shipped  → delivered
delivered → (terminal, no más transiciones)
cancelled → (terminal)
```

### OrderItem (nueva — tabla `order_items`)

| Columna       | Tipo               | Notas                                    |
|---------------|--------------------|------------------------------------------|
| id            | SERIAL PK          |                                          |
| order_id      | INTEGER FK → orders(id) ON DELETE CASCADE |           |
| product_id    | INTEGER FK → products(id) |                           |
| quantity      | INTEGER NOT NULL   | ≥ 1                                      |
| unit_price    | NUMERIC(10,2)      | snapshot del precio al momento de crear  |

---

## 2. Endpoints por fase

### Fase 1 — S5 Productos y Roles

| # | Método | Ruta                       | Auth        | Acción                           |
|---|--------|----------------------------|-------------|----------------------------------|
| 1 | GET    | /api/products              | Pública     | Listar activos, no eliminados, con filtros |
| 2 | GET    | /api/products/categories   | Pública     | Listar categorías distintas      |
| 3 | GET    | /api/products/:code        | Pública     | Detalle por code (no eliminados) |
| 4 | POST   | /api/products              | Admin       | Crear producto                   |
| 5 | PUT    | /api/products/:code        | Admin       | Actualizar producto completo     |
| 6 | DELETE | /api/products/:code        | Admin       | Soft delete                      |

> Nota: el stub actual de `PATCH /:code` se reemplazará por `PUT /:code`.

### Fase 2 — S6 Pedidos

| # | Método | Ruta                        | Auth           | Acción                           |
|---|--------|-----------------------------|----------------|----------------------------------|
| 7 | POST   | /api/orders                 | Autenticado    | Crear orden (reemplaza /create)  |
| 8 | GET    | /api/orders/my              | Autenticado    | Mis órdenes con ítems            |
| 9 | GET    | /api/orders                 | Admin          | Todas las órdenes, paginadas     |
|10 | PATCH  | /api/orders/:id/status      | Admin          | Cambiar estado + reponer stock si cancela |

---

## 3. Migraciones nuevas necesarias

| Nombre sugerido                             | Qué hace                                                       | Fase |
|---------------------------------------------|----------------------------------------------------------------|------|
| `AddProductSoftDeleteAndUnique`             | Agrega `deleted_at`, `is_active`, UNIQUE en `code`            | 1    |
| `CreateOrdersAndOrderItems`                 | Crea tablas `orders` y `order_items` con FK                   | 2    |

> Si se elige Opción B para categorías, se agrega una migración `CreateCategories` en Fase 1.

---

## 4. Decisiones que necesito confirmar

| ID  | Pregunta                                                                                 | Propuesta por defecto |
|-----|------------------------------------------------------------------------------------------|----------------------|
| #D1 | Categorías: ¿tabla propia (`categories`) o campo `category_name` en `products`?         | Opción A: campo en products |
| #D2 | Estados de Order: ¿confirmas `pending/paid/shipped/delivered/cancelled`? ¿Falta alguno? | Los 5 propuestos     |
| #D3 | El stub de órdenes tiene `PATCH /:code` (con `code`). ¿Lo reemplazo completamente con los 4 endpoints nuevos de S6? | Sí, reemplazar |
| #D4 | El stub actual de productos usa `PATCH /:code`; el plan propone `PUT /:code`. ¿Confirmas PUT para actualización completa? | PUT |
| #D5 | ¿Se debe exponer `category_id` en las respuestas o solo `category_name`?                | Solo `category_name` |

---

## 5. Archivos a crear o modificar por fase

### Fase 1 — S5

**Crear:**
- `src/middlewares/role.middleware.js` — `requireRole(...roles)` factory
- `src/entities/Product.entity.js` — EntitySchema con `deleted_at`, `is_active`, `category_name` (si Opción A)
- `src/models/product.model.js` — operaciones CRUD + soft delete
- `src/services/product.service.js` — lógica de negocio (filtros, validaciones, unicidad de code)
- `src/migrations/<ts>-AddProductSoftDeleteAndUnique.js`
- `docs/HALLAZGOS.md`

**Modificar:**
- `src/controllers/product.controller.js` — implementar los 6 handlers
- `src/routes/product.routes.js` — agregar auth/role middleware, cambiar PATCH → PUT
- `src/config/database.js` — registrar la entidad Product actualizada

### Fase 2 — S6

**Crear:**
- `src/entities/Order.js` + `src/entities/Order.entity.js`
- `src/entities/OrderItem.js` + `src/entities/OrderItem.entity.js`
- `src/models/order.model.js`
- `src/services/order.service.js` — lógica de creación, transacciones, cambio de estado
- `src/controllers/order.controller.js`
- `src/migrations/<ts>-CreateOrdersAndOrderItems.js`

**Modificar:**
- `src/routes/order.routes.js` — reemplazar stubs con los 4 endpoints reales
- `src/config/database.js` — registrar Order y OrderItem

---

## Estado de fases

- [x] Fase 0 — Análisis y plan
- [x] Fase 1 — S5 Productos y Roles
- [x] Fase 2 — S6 Pedidos
