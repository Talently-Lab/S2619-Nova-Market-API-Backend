import test from 'node:test';
import assert from 'node:assert/strict';
import { UserModelFactory } from '../../src/models/user.model.js';

const VALID_EMAIL = 'ana@example.com';
const VALID_PASSWORD = 'password123';

function createRepository({ userToFind = null, error = null } = {}) {
  const calls = [];

  const repository = {
    create(data) {
      calls.push(['create', data]);
      return { ...data };
    },

    async save(user) {
      calls.push(['save', user]);

      if (error) {
        throw error;
      }

      return { id: 8, ...user };
    },

    async findOneBy(criteria) {
      calls.push(['findOneBy', criteria]);

      if (error) {
        throw error;
      }

      return userToFind;
    },
  };

  return { repository, calls };
}

async function assertBadRequest(promise, expectedMessage) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.statusCode, 400);
    assert.equal(error.message, expectedMessage);
    return true;
  });
}

test('create construye y guarda el usuario', async () => {
  const input = {
    name: 'Ana',
    lastName: '',
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
    roleId: 1,
  };
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);

  const result = await model.create(input);

  assert.deepEqual(calls, [
    ['create', input],
    ['save', input],
  ]);
  assert.deepEqual(result, { id: 8, ...input });
});

test('findByEmail devuelve el usuario encontrado', async () => {
  const expectedUser = { id: 8, email: VALID_EMAIL };
  const { repository, calls } = createRepository({
    userToFind: expectedUser,
  });
  const model = UserModelFactory(repository);

  const result = await model.findByEmail(VALID_EMAIL);

  assert.deepEqual(calls, [
    ['findOneBy', { email: VALID_EMAIL }],
  ]);
  assert.equal(result, expectedUser);
});

test('findByEmail devuelve null cuando no encuentra el usuario', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);

  const result = await model.findByEmail(VALID_EMAIL);

  assert.equal(result, null);
  assert.deepEqual(calls, [
    ['findOneBy', { email: VALID_EMAIL }],
  ]);
});

test('create rechaza email ausente o de tipo inválido', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);
  const invalidInputs = [
    { password: VALID_PASSWORD },
    { email: null, password: VALID_PASSWORD },
    { email: 123, password: VALID_PASSWORD },
    { email: '', password: VALID_PASSWORD },
  ];

  for (const input of invalidInputs) {
    await assertBadRequest(
      model.create(input),
      'Hay datos faltantes o inválidos. Asegúrese de proporcionar email y contraseña válidos.',
    );
  }

  assert.deepEqual(calls, []);
});

test('create rechaza contraseña ausente o de tipo inválido', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);
  const invalidInputs = [
    { email: VALID_EMAIL },
    { email: VALID_EMAIL, password: null },
    { email: VALID_EMAIL, password: 123 },
    { email: VALID_EMAIL, password: '' },
  ];

  for (const input of invalidInputs) {
    await assertBadRequest(
      model.create(input),
      'Hay datos faltantes o inválidos. Asegúrese de proporcionar email y contraseña válidos.',
    );
  }

  assert.deepEqual(calls, []);
});

test('create rechaza un email con formato inválido', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);

  await assertBadRequest(
    model.create({
      email: 'no-es-un-email',
      password: VALID_PASSWORD,
    }),
    'El email proporcionado no es válido.',
  );

  assert.deepEqual(calls, []);
});

test('create rechaza una contraseña de más de 72 bytes', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);
  const password = 'a'.repeat(73);

  assert.equal(Buffer.byteLength(password, 'utf8'), 73);

  await assertBadRequest(
    model.create({ email: VALID_EMAIL, password }),
    'La contraseña es demasiado larga.',
  );

  assert.deepEqual(calls, []);
});

test('create acepta una contraseña de exactamente 72 bytes', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);
  const password = 'a'.repeat(72);

  const result = await model.create({
    email: VALID_EMAIL,
    password,
  });

  assert.equal(Buffer.byteLength(password, 'utf8'), 72);
  assert.deepEqual(calls, [
    ['create', { email: VALID_EMAIL, password }],
    ['save', { email: VALID_EMAIL, password }],
  ]);
  assert.deepEqual(result, {
    id: 8,
    email: VALID_EMAIL,
    password,
  });
});

test('findByEmail normaliza el email antes de consultar', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);

  await model.findByEmail('ANA@EXAMPLE.COM');

  assert.deepEqual(calls, [
    ['findOneBy', { email: VALID_EMAIL }],
  ]);
});

test('findByEmail rechaza emails ausentes, de tipo inválido o con formato incorrecto', async () => {
  const { repository, calls } = createRepository();
  const model = UserModelFactory(repository);
  const invalidEmails = [
    undefined,
    null,
    123,
    '',
    'no-es-un-email',
  ];

  for (const email of invalidEmails) {
    await assertBadRequest(
      model.findByEmail(email),
      'El email proporcionado no es válido.',
    );
  }

  assert.deepEqual(calls, []);
});

test('create propaga el error del repositorio al guardar', async () => {
  const repositoryError = new Error('Error de repositorio');
  const { repository, calls } = createRepository({ error: repositoryError });
  const model = UserModelFactory(repository);

  await assert.rejects(
    model.create({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    }),
    (error) => error === repositoryError,
  );

  assert.deepEqual(calls.map(([method]) => method), ['create', 'save']);
});

test('findByEmail propaga el error del repositorio al consultar', async () => {
  const repositoryError = new Error('Error de repositorio');
  const { repository, calls } = createRepository({ error: repositoryError });
  const model = UserModelFactory(repository);

  await assert.rejects(
    model.findByEmail(VALID_EMAIL),
    (error) => error === repositoryError,
  );

  assert.deepEqual(calls, [
    ['findOneBy', { email: VALID_EMAIL }],
  ]);
});