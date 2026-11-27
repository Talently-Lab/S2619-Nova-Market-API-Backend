import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../src/models/user.model.js';
import { userLogin } from '../../src/services/user.login.service.js';

const VALID_EMAIL = 'admin@example.com';
const VALID_PASSWORD = 'Contra123!';

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

function mockUserModel(t, { user = null } = {}) {
  return {
    findByEmail: t.mock.method(UserModel, 'findByEmail', async () => user),
    getPasswordHash: t.mock.method(
      UserModel,
      'getPasswordHash',
      (foundUser) => foundUser.password,
    ),
    updateLastLogin: t.mock.method(
      UserModel,
      'updateLastLogin',
      async (foundUser) => foundUser,
    ),
  };
}

async function assertHttpError(promise, statusCode, message) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.statusCode, statusCode);
    assert.equal(error.message, message);
    return true;
  });
}

test('autentica, actualiza el último acceso y devuelve un JWT', async (t) => {
  const secret = 'login-test-secret';
  setJwtSecret(t, secret);
  const user = {
    id: 12,
    email: VALID_EMAIL,
    name: 'admin',
    lastName: '',
    roleId: 1,
    password: await bcrypt.hash(VALID_PASSWORD, 4),
    lastLogin: null,
  };
  const model = mockUserModel(t, { user });

  const token = await userLogin({
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
  });

  assert.deepEqual(model.findByEmail.mock.calls[0].arguments, [VALID_EMAIL]);
  assert.equal(model.getPasswordHash.mock.calls[0].arguments[0], user);
  assert.equal(model.updateLastLogin.mock.calls[0].arguments[0], user);

  const payload = jwt.verify(token, secret);
  assert.equal(payload.sub, String(user.id));
  assert.equal(payload.email, user.email);
  assert.equal(payload.roleId, user.roleId);
  assert.equal(typeof payload.exp, 'number');
});

test('rechaza credenciales ausentes o de tipos inválidos', async (t) => {
  setJwtSecret(t, 'login-test-secret');
  const model = mockUserModel(t);
  const invalidInputs = [
    null,
    [],
    {},
    { email: VALID_EMAIL },
    { email: 123, password: VALID_PASSWORD },
    { email: VALID_EMAIL, password: 123 },
  ];

  for (const userData of invalidInputs) {
    await assertHttpError(
      userLogin(userData),
      400,
      'El cuerpo de la solicitud debe contener email y password de tipos válidos.',
    );
  }

  assert.equal(model.findByEmail.mock.callCount(), 0);
});

test('rechaza una contraseña que supera el límite de bcrypt', async (t) => {
  setJwtSecret(t, 'login-test-secret');
  const model = mockUserModel(t);
  const password = `${'A'.repeat(69)}a1!!`;

  await assertHttpError(
    userLogin({ email: VALID_EMAIL, password }),
    400,
    'La contraseña es demasiado larga.',
  );

  assert.equal(model.findByEmail.mock.callCount(), 0);
});

test('falla con error interno si no está configurado JWT_SECRET', async (t) => {
  setJwtSecret(t, undefined);
  const model = mockUserModel(t);

  await assertHttpError(
    userLogin({ email: VALID_EMAIL, password: VALID_PASSWORD }),
    500,
    'JWT_SECRET no está configurado.',
  );

  assert.equal(model.findByEmail.mock.callCount(), 0);
});

test('responde con error genérico cuando el usuario no existe', async (t) => {
  setJwtSecret(t, 'login-test-secret');
  const model = mockUserModel(t);

  await assertHttpError(
    userLogin({ email: VALID_EMAIL, password: VALID_PASSWORD }),
    401,
    'Email o contraseña incorrectos.',
  );

  assert.equal(model.getPasswordHash.mock.callCount(), 0);
  assert.equal(model.updateLastLogin.mock.callCount(), 0);
});

test('responde con error genérico y no actualiza el acceso si la contraseña falla', async (t) => {
  setJwtSecret(t, 'login-test-secret');
  const user = {
    id: 12,
    email: VALID_EMAIL,
    password: await bcrypt.hash('OtraClave123!', 4),
  };
  const model = mockUserModel(t, { user });

  await assertHttpError(
    userLogin({ email: VALID_EMAIL, password: VALID_PASSWORD }),
    401,
    'Email o contraseña incorrectos.',
  );

  assert.equal(model.updateLastLogin.mock.callCount(), 0);
});
