import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Role } from '../../src/entities/Role.js';
import { User } from '../../src/entities/User.js';
import { RoleModel } from '../../src/models/role.model.js';
import { UserModel } from '../../src/models/user.model.js';
import { protectedProfile } from '../../src/services/protected.profile.service.js';

const JWT_SECRET = 'protected-profile-test-secret';
const AUTHORIZATION_HEADER = 'Bearer test-token';

// Configura el secreto solo durante este test e restaura el entorno al terminar.
function setJwtSecret(t, secret) {
  const previousSecret = process.env.JWT_SECRET;
  if (secret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = secret;
  }

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  });
}

// Sustituye los métodos de los modelos; t.mock restaura cada método al terminar el test.
function mockModels(t, {
  user = null,
  role = null,
  findUserError,
  findRoleError,
} = {}) {
  return {
    findUserById: t.mock.method(UserModel, 'findById', async () => {
      if (findUserError) throw findUserError;
      return user;
    }),
    findRoleById: t.mock.method(RoleModel, 'findById', async () => {
      if (findRoleError) throw findRoleError;
      return role;
    }),
    getRoleDescription: t.mock.method(
      RoleModel,
      'getDescription',
      (foundRole) => foundRole.description,
    ),
  };
}

// Firma tokens reales para que estos tests ejerciten la verificación JWT del middleware.
function createToken(payload, secret = JWT_SECRET) {
  return jwt.sign(payload, secret);
}

// Comprueba el código HTTP y el mensaje de los errores producidos por el servicio.
async function assertHttpError(promise, statusCode, message) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.statusCode, statusCode);
    assert.equal(error.message, message);
    return true;
  });
}

test('devuelve los datos actuales del usuario y la descripción de su rol', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const user = new User({
    id: 15,
    name: 'Ana',
    lastName: 'Pérez',
    email: 'ana@example.com',
    password: 'hash-que-no-debe-retornarse',
    roleId: 2,
  });
  const role = new Role({ id: 2, description: 'Administrador' });
  const models = mockModels(t, { user, role });
  const token = createToken({ sub: String(user.id) });

  const result = await protectedProfile(`Bearer ${token}`);

  assert.equal(models.findUserById.mock.calls[0].arguments[0], user.id);
  assert.equal(models.findRoleById.mock.calls[0].arguments[0], user.roleId);
  assert.equal(models.getRoleDescription.mock.calls[0].arguments[0], role);
  assert.deepEqual(result, {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
    role: 'Administrador',
  });
  assert.equal('password' in result, false);
});

test('rechaza un header Authorization mal formado', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const models = mockModels(t);

  await assertHttpError(
    protectedProfile('Token no-Bearer'),
    401,
    'El token de autenticación no es válido.',
  );

  assert.equal(models.findUserById.mock.callCount(), 0);
});

test('rechaza un token firmado con una clave incorrecta', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const models = mockModels(t);
  const token = createToken({ sub: '15' }, 'otra-clave');

  await assertHttpError(
    protectedProfile(`Bearer ${token}`),
    401,
    'El token de autenticación no es válido.',
  );

  assert.equal(models.findUserById.mock.callCount(), 0);
});

test('rechaza un token vencido', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const models = mockModels(t);
  const token = jwt.sign(
    { sub: '15' },
    JWT_SECRET,
    { expiresIn: -1 },
  );

  await assertHttpError(
    protectedProfile(`Bearer ${token}`),
    401,
    'El token de autenticación no es válido.',
  );

  assert.equal(models.findUserById.mock.callCount(), 0);
});

test('reporta error interno si falta JWT_SECRET', async (t) => {
  setJwtSecret(t, undefined);
  mockModels(t);
  const token = createToken({ sub: '15' });

  await assertHttpError(
    protectedProfile(`Bearer ${token}`),
    500,
    'JWT_SECRET no está configurado.',
  );
});

test('rechaza el token si el usuario ya no existe', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const models = mockModels(t);
  const token = createToken({ sub: '15' });

  await assertHttpError(
    protectedProfile(`Bearer ${token}`),
    401,
    'El token de autenticación no es válido.',
  );

  assert.equal(models.findRoleById.mock.callCount(), 0);
});

test('falla explícitamente si el usuario no tiene un rol existente', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const user = new User({ id: 15, roleId: 2 });
  const models = mockModels(t, { user });
  const token = createToken({ sub: '15' });

  await assert.rejects(
    protectedProfile(`Bearer ${token}`),
    /No existe el rol 2 asignado al usuario/,
  );

  assert.equal(models.getRoleDescription.mock.callCount(), 0);
});

test('propaga errores al consultar el usuario', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const token = createToken({ sub: '15' });
  const userLookupError = new Error('Error consultando usuario');
  const userModels = mockModels(t, { findUserError: userLookupError });

  await assert.rejects(
    protectedProfile(`Bearer ${token}`),
    (error) => error === userLookupError,
  );
  assert.equal(userModels.findRoleById.mock.callCount(), 0);
});

test('propaga errores al consultar el rol', async (t) => {
  setJwtSecret(t, JWT_SECRET);
  const token = createToken({ sub: '15' });
  const user = new User({ id: 15, roleId: 2 });
  const roleLookupError = new Error('Error consultando rol');
  const roleModels = mockModels(t, { user, findRoleError: roleLookupError });

  await assert.rejects(
    protectedProfile(`Bearer ${token}`),
    (error) => error === roleLookupError,
  );
  assert.equal(roleModels.getRoleDescription.mock.callCount(), 0);
});
