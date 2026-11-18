import test from 'node:test';
import assert from 'node:assert/strict';
import { authController } from '../../src/controllers/auth.controller.js';

// Completa siempre ambas dependencias; cada test reemplaza solo el servicio que prueba.
function createController({ createUser, userLogin } = {}) {
  return authController({
    createUser: createUser ?? (async () => ({
      token: 'token-no-usado',
      data: {},
    })),
    userLogin: userLogin ?? (async () => 'token-no-usado'),
  });
}

test('responde 201 con el token y los datos del usuario', async () => {
  const requestBody = {
    email: 'ana@example.com',
    password: 'Password1!',
  };
  const expectedUser = {
    name: 'ana',
    email: 'ana@example.com',
    lastName: '',
    roleId: 1
  };

  const controller = createController({
    createUser: async (body) => {
      assert.equal(body, requestBody);
      return {
        token: 'token-de-prueba',
        data: expectedUser,
      };
    },
  });

  const req = { body: requestBody };
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let forwardedError;

  await controller.registerUser(req, res, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, undefined);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    jwt_token: 'token-de-prueba',
    user: expectedUser,
    status_code: 201,
    status_description: 'Usuario registrado exitosamente.',
  });
});

test('pasa a next el error que lanza el servicio', async () => {
  const expectedError = new Error('Fallo de prueba');

  const controller = createController({
    createUser: async () => {
      throw expectedError;
    },
  });

  let forwardedError;

  await controller.registerUser(
    { body: {} },
    {},
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, expectedError);
});

test('rechaza un body nulo y no llama al servicio', async () => {
  let createUserCalled = false;
  const controller = createController({
    createUser: async () => {
      createUserCalled = true;
    },
  });
  let forwardedError;

  await controller.registerUser(
    { body: null },
    {},
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(createUserCalled, false);
  assert.equal(forwardedError.statusCode, 400);
  assert.equal(
    forwardedError.message,
    'El cuerpo de la solicitud debe ser un objeto JSON válido.',
  );
});

test('responde 201 con el JWT al iniciar sesión correctamente', async () => {
  const requestBody = {
    email: 'admin@example.com',
    password: 'Contra123!',
  };
  const controller = createController({
    userLogin: async (body) => {
      assert.equal(body, requestBody);
      return 'jwt-de-prueba';
    },
  });
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let forwardedError;

  await controller.loginUser(
    { body: requestBody },
    res,
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, undefined);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    status_code: 201,
    status_description: 'El usuario pudo loguearse correctamente',
    jwt_token: 'jwt-de-prueba',
  });
});

test('pasa a next el error que lanza el servicio de login', async () => {
  const expectedError = new Error('Fallo de login');
  const controller = createController({
    userLogin: async () => {
      throw expectedError;
    },
  });
  let forwardedError;

  await controller.loginUser(
    { body: { email: 'admin@example.com', password: 'Contra123!' } },
    {},
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, expectedError);
});