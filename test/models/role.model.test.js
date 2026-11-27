import test from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '../../src/entities/Role.js';
import { RoleModelFactory } from '../../src/models/role.model.js';

// Proporciona un repositorio falso para probar el modelo sin conectar a PostgreSQL.
function createRepository({ roleToFind = null } = {}) {
  const calls = [];
  return {
    calls,
    repository: {
      async findOneBy(criteria) {
        calls.push(criteria);
        return roleToFind;
      },
    },
  };
}

test('getDescription devuelve la descripción de una instancia Role', () => {
  const { repository } = createRepository();
  const model = RoleModelFactory(repository);
  const role = new Role({ id: 1, description: 'Usuario' });

  assert.equal(model.getDescription(role), 'Usuario');
});

test('getDescription rechaza valores que no son instancias Role', () => {
  const { repository } = createRepository();
  const model = RoleModelFactory(repository);

  assert.throws(
    () => model.getDescription({ id: 1, description: 'Usuario' }),
    {
      name: 'TypeError',
      message: 'Se esperaba una instancia de Role.',
    },
  );
});

test('findById devuelve el rol encontrado', async () => {
  const expectedRole = new Role({ id: 1, description: 'Usuario' });
  const { repository, calls } = createRepository({ roleToFind: expectedRole });
  const model = RoleModelFactory(repository);

  const result = await model.findById(1);

  assert.deepEqual(calls, [{ id: 1 }]);
  assert.equal(result, expectedRole);
});

test('findById rechaza IDs que no sean enteros positivos sin consultar el repositorio', async () => {
  const { repository, calls } = createRepository();
  const model = RoleModelFactory(repository);

  for (const id of [0, -1, 1.5, NaN, '1', null]) {
    await assert.rejects(
      model.findById(id),
      {
        name: 'TypeError',
        message: 'El ID debe ser un número entero positivo.',
      },
    );
  }

  assert.deepEqual(calls, []);
});
