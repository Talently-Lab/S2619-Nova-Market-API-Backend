import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../src/models/user.model.js';
import { createUser } from '../../src/services/create.user.service.js';

function mockUserModel(t, { existingUser = null } = {}) {
  const findByEmail = t.mock.method(
    UserModel,
    'findByEmail',
    async () => existingUser,
  );

  const create = t.mock.method(
    UserModel,
    'create',
    async (data) => ({ id: 7, ...data }),
  );

  return { findByEmail, create };
}

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

async function assertHttpError(promise, expectedStatusCode, expectedMessage) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.statusCode, expectedStatusCode);
    assert.equal(error.message, expectedMessage);
    return true;
  });
}

test('normaliza el email, crea el usuario y devuelve un JWT sin contraseña', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  const secret = 'secreto-solo-para-tests';
  process.env.JWT_SECRET = secret;

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  });

  const findByEmail = t.mock.method(
    UserModel,
    'findByEmail',
    async () => null,
  );

  const create = t.mock.method(
    UserModel,
    'create',
    async (data) => ({
      id: 7,
      ...data,
    }),
  );

  const result = await createUser({
    email: '  Ana@Example.com ',
    password: 'ClaveSegura1!',
  });

  assert.deepEqual(findByEmail.mock.calls[0].arguments, ['  Ana@Example.com ']);
  assert.deepEqual(create.mock.calls[0].arguments[0], {
    name: 'Ana',
    lastName: '',
    email: 'ana@example.com',
    password: 'ClaveSegura1!',
    roleId: 1,
  });

  const payload = jwt.verify(result.token, secret);
  assert.equal(payload.sub, '7');
  assert.equal(payload.email, 'ana@example.com');

  assert.equal(result.data.id, 7);
  assert.equal('password' in result.data, false);
});

const validPassword = 'ClaveSegura1!';

test('rechaza datos faltantes o un email inválido sin llamar al modelo', async (t) => {
  const { findByEmail, create } = mockUserModel(t);

  const invalidInputs = [
    { password: validPassword },
    { email: 'ana@example.com' },
    { email: 'ana@example.com', password: 123 },
    { email: 123, password: validPassword },
  ];

  for (const input of invalidInputs) {
    await assertHttpError(
      createUser(input),
      400,
      'El cuerpo de la solicitud debe contener email y password de tipos válidos.',
    );
  }

  assert.equal(findByEmail.mock.calls.length, 0);
  assert.equal(create.mock.calls.length, 0);
});

test('rechaza contraseñas que no cumplen todos los requisitos', async (t) => {
  const { findByEmail, create } = mockUserModel(t);

  const weakPasswords = [
    'clavesegura1!', // Sin mayúscula
    'CLAVESEGURA1!', // Sin minúscula
    'ClaveSegura!',  // Sin número
    'ClaveSegura1',  // Sin carácter especial
  ];

  for (const password of weakPasswords) {
    await assertHttpError(
      createUser({ email: 'ana@example.com', password }),
      400,
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.',
    );
  }

  assert.equal(findByEmail.mock.calls.length, 0);
  assert.equal(create.mock.calls.length, 0);
});


test('rechaza el registro si falta JWT_SECRET, antes de consultar el modelo', async (t) => {
  setJwtSecret(t, undefined);
  const { findByEmail, create } = mockUserModel(t);

  await assertHttpError(
    createUser({ email: 'ana@example.com', password: validPassword }),
    500,
    'JWT_SECRET no está configurado.',
  );

  assert.equal(findByEmail.mock.calls.length, 0);
  assert.equal(create.mock.calls.length, 0);
});

test('rechaza un email existente y no crea otro usuario', async (t) => {
  setJwtSecret(t, 'secreto-solo-para-tests');

  const { findByEmail, create } = mockUserModel(t, {
    existingUser: { id: 3, email: 'ana@example.com' },
  });

  await assertHttpError(
    createUser({ email: 'Ana@Example.com', password: validPassword }),
    409,
    'El email ya está registrado',
  );

  assert.deepEqual(findByEmail.mock.calls[0].arguments, ['Ana@Example.com']);
  assert.equal(create.mock.calls.length, 0);
});