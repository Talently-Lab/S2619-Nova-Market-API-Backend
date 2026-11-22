# Hallazgos fuera del alcance de S5/S6

## H1 — `auth.controller.js`: `GET /me` devuelve 201 en vez de 200
`loginUser` y `protectedProfile` responden con `status(201)` para operaciones de lectura.
El estándar HTTP indica 200 para lecturas y 201 solo para creación de recursos.
**No corregido** (fuera del alcance). Recomendación: corregir en un ticket de deuda técnica.

## H2 — `src/models/product.model.js` estaba vacío (0 bytes)
El archivo existía registrado en la estructura pero no tenía contenido.
Fue implementado completamente como parte de S5 (dentro del alcance).

## H3 — `category_id` en `products` no tiene FK declarada
La columna `category_id` existe en la tabla `products` pero no referencia ninguna tabla
`categories` ni tiene constraint de FK. Se mantiene como campo entero libre.
El campo `category_name` agregado en S5 es independiente y sí se usa en filtros y respuestas.

## H4 — `UserSubscriber` registra el decorador manualmente (`EventSubscriber()(UserSubscriber)`)
Patrón inusual pero funcional con ES modules + reflect-metadata.
No se toca.
