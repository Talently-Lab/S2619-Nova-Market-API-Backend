import { createHttpError } from '../utils/http-error.js';

/**
 * Middleware factory de autorización por rol.
 * Debe usarse después de `authenticate`.
 *
 * Uso: router.post('/', authenticate, requireRole('Admin'), handler)
 *
 * Los roles se comparan con la descripción almacenada en la tabla roles
 * y propagada en el JWT como `roleDescription`. Si el JWT solo trae
 * `roleId` numérico, se compara contra un mapa de IDs conocidos.
 *
 * Convención del proyecto (SeedMissingRoles + registros previos):
 *   role_id = 1 → 'Usuario'
 *   role_id = 2 → 'Admin'   (asumido; confirmar con tus datos)
 *
 * El middleware acepta el nombre del rol tal cual está en la BD
 * (ej. 'Admin', 'Usuario') o su alias en inglés ('admin', 'user')
 * de forma case-insensitive.
 */

const ROLE_ID_MAP = {
  1: 'Usuario',
  2: 'Admin',
};

export function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw createHttpError(401, 'El token de autenticación no es válido.');
      }

      const roleName = resolveRoleName(req.user);
      const hasAccess = normalizedAllowed.includes(roleName.toLowerCase());

      if (!hasAccess) {
        throw createHttpError(403, 'No tienes permisos para realizar esta acción.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Resuelve el nombre del rol desde el payload JWT.
 * Acepta `roleDescription` (string) o `roleId` (número, mapeado a nombre).
 */
function resolveRoleName(payload) {
  if (typeof payload.roleDescription === 'string' && payload.roleDescription.trim()) {
    return payload.roleDescription.trim();
  }

  const id = Number(payload.roleId);
  if (Number.isInteger(id) && ROLE_ID_MAP[id]) {
    return ROLE_ID_MAP[id];
  }

  throw createHttpError(403, 'No tienes permisos para realizar esta acción.');
}
