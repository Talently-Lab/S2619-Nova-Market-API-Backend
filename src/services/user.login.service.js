import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { createHttpError } from '../utils/http-error.js';

const MAX_BCRYPT_PASSWORD_BYTES = 72;
const INVALID_CREDENTIALS_STATUS = 401;
const INVALID_CREDENTIALS_MESSAGE = 'Email o contraseña incorrectos.';
const TOKEN_EXPIRATION = '1h';

export const userLogin = async (userData) => {
  validateLoginInput(userData);
  const jwtSecret = getConfiguredJwtSecret();
  const user = await findUser(userData.email);
  await verifyPassword(user, userData.password);
  await UserModel.updateLastLogin(user);
  return generateJwtToken(user, jwtSecret);
};

function validateLoginInput(userData) {
  if (
    !userData
    || typeof userData !== 'object'
    || Array.isArray(userData)
    || typeof userData.email !== 'string'
    || !userData.email.trim()
    || typeof userData.password !== 'string'
    || !userData.password
  ) {
    throw createHttpError(400, 'El cuerpo de la solicitud debe contener email y password de tipos válidos.');
  }

  if (Buffer.byteLength(userData.password, 'utf8') > MAX_BCRYPT_PASSWORD_BYTES) {
    throw createHttpError(400, 'La contraseña es demasiado larga.');
  }
}

function getConfiguredJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createHttpError(500, 'JWT_SECRET no está configurado.');
  }

  return jwtSecret;
}

async function findUser(email) {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw createHttpError(INVALID_CREDENTIALS_STATUS, INVALID_CREDENTIALS_MESSAGE);
  }

  return user;
}

async function verifyPassword(user, password) {
  const passwordHash = UserModel.getPasswordHash(user);
  const passwordMatches = await bcrypt.compare(password, passwordHash);
  if (!passwordMatches) {
    throw createHttpError(INVALID_CREDENTIALS_STATUS, INVALID_CREDENTIALS_MESSAGE);
  }
}

function generateJwtToken(user, jwtSecret) {
  return jwt.sign(
    {
      roleId: user.roleId,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
    },
    jwtSecret,
    { subject: String(user.id), expiresIn: TOKEN_EXPIRATION },
  );
}
