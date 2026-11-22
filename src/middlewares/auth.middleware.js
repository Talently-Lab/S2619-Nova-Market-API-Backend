import jwt from 'jsonwebtoken';
import { createHttpError } from '../utils/http-error.js';

/**
 * Middleware Express: verifica el Bearer token y adjunta el payload en req.user.
 * Lanza 401 si el token está ausente o es inválido.
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = typeof req.get === 'function'
      ? req.get('authorization')
      : req.headers?.authorization;

    const payload = verifyAuthorizationHeader(authHeader);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

const INVALID_TOKEN_STATUS = 401;
const INVALID_TOKEN_MESSAGE = 'El token de autenticación no es válido.';
const BEARER_TOKEN_PATTERN = /^Bearer\s+(\S+)$/i;

export function verifyAuthorizationHeader(authorizationHeader) {
  const token = extractBearerToken(authorizationHeader);
  const jwtSecret = getJwtSecret();

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (!payload || typeof payload !== 'object') {
      throw createHttpError(INVALID_TOKEN_STATUS, INVALID_TOKEN_MESSAGE);
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createHttpError(INVALID_TOKEN_STATUS, INVALID_TOKEN_MESSAGE);
    }

    throw error;
  }
}

// Rechaza headers ausentes o que no usen el esquema Bearer.
function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') {
    throw createHttpError(INVALID_TOKEN_STATUS, INVALID_TOKEN_MESSAGE);
  }

  const match = authorizationHeader.trim().match(BEARER_TOKEN_PATTERN);
  if (!match) {
    throw createHttpError(INVALID_TOKEN_STATUS, INVALID_TOKEN_MESSAGE);
  }

  return match[1];
}

// Obtiene la clave de verificación, reportando la configuración faltante como error interno.
function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createHttpError(500, 'JWT_SECRET no está configurado.');
  }

  return jwtSecret;
}
