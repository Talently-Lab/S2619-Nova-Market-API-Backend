import { AppDataSource } from '../config/database.js';
import { RoleEntity } from '../entities/Role.entity.js';
import { Role } from '../entities/Role.js';

const roleRepository = AppDataSource.getRepository(RoleEntity);

export function RoleModelFactory(repository) {
  return {
    findById: async (id) => {
      validatePositiveIntegerId(id);
      return repository.findOneBy({ id });
    },
    getDescription: (role) => {
      validateRoleInstance(role);
      return role.description;
    },
  };
}

export const RoleModel = RoleModelFactory(roleRepository);

function validateRoleInstance(role) {
  if (!(role instanceof Role)) {
    throw new TypeError('Se esperaba una instancia de Role.');
  }
}

function validatePositiveIntegerId(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('El ID debe ser un número entero positivo.');
  }
}
