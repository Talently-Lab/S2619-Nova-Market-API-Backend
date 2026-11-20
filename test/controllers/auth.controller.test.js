import test from 'node:test';
import assert from 'node:assert/strict';
import { authController } from '../../src/controllers/auth.controller.js';

// Completa los servicios de producción para que cada test sustituya solo la dependencia probada.
function createController({ createUser, userLogin, protectedProfile } = {}) {
  return authController({
    createUser: createUser ?? (async () => ({
      token: 'token-no-usado',
      data: {},
    })),
    userLogin: userLogin ?? (async () => 'token-no-usado'),
    protectedProfile: protectedProfile ?? (async () => ({})),
  });
}

// Simula la respuesta de Express para comprobar el estado y el JSON sin abrir un servidor.
function createResponse() {
  return {
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
  const res = createResponse();
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
  const res = createResponse();
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

test('responde 201 con el perfil restaurado', async () => {
  const authorizationHeader = 'Bearer token-de-prueba';
  const expectedUser = {
    id: 8,
    email: 'ana@example.com',
    role: 'Usuario',
  };
  const controller = createController({
    protectedProfile: async (header) => {
      assert.equal(header, authorizationHeader);
      return expectedUser;
    },
  });
  const res = createResponse();
  let forwardedError;

  await controller.protectedProfile(
    { headers: { authorization: authorizationHeader } },
    res,
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, undefined);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    status_code: 201,
    status_description: 'se obtuvieron los datos del usuario correctamente',
    user: expectedUser,
  });
});

test('rechaza un header Authorization vacío sin llamar al servicio', async () => {
  let protectedProfileCalled = false;
  const controller = createController({
    protectedProfile: async () => {
      protectedProfileCalled = true;
    },
  });
  let forwardedError;

  await controller.protectedProfile(
    { headers: {} },
    {},
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(protectedProfileCalled, false);
  assert.equal(forwardedError.statusCode, 401);
  assert.equal(forwardedError.message, 'Falta el header Authorization.');
});

test('pasa a next los errores del servicio protectedProfile', async () => {
  const expectedError = new Error('Token inválido');
  const controller = createController({
    protectedProfile: async () => {
      throw expectedError;
    },
  });
  let forwardedError;

  await controller.protectedProfile(
    { headers: { authorization: 'Bearer token-de-prueba' } },
    {},
    (error) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, expectedError);
});