import { UserModel } from '../models/user.model.js';
import { RoleModel } from '../models/role.model.js';
import { verifyAuthorizationHeader } from '../middlewares/auth.middleware.js';
import { createHttpError } from '../utils/http-error.js';

const INVALID_TOKEN_STATUS = 401;
const INVALID_TOKEN_MESSAGE = 'El token de autenticación no es válido.';

export async function protectedProfile(authorizationHeader) {
  const payload = verifyAuthorizationHeader(authorizationHeader);
  const user = await findUserFromPayload(payload);
  const roleDescription = await findRoleDescription(user.roleId);
  return buildProfile(user, roleDescription);
}

async function findUserFromPayload(payload) {
  const userId = Number(payload.sub);
  const user = await UserModel.findById(userId);
  if (!user) {
    throw createHttpError(INVALID_TOKEN_STATUS, INVALID_TOKEN_MESSAGE);
  }

  return user;
}

async function findRoleDescription(roleId) {
  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new Error(`No existe el rol ${roleId} asignado al usuario.`);
  }

  return RoleModel.getDescription(role);
}

function buildProfile(user, roleDescription) {
  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    role: roleDescription,
  };
}
