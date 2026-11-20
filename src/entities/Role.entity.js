import { EntitySchema } from 'typeorm';
import { Role } from './Role.js';

export const RoleEntity = new EntitySchema({
  name: 'Role',
  target: Role,
  tableName: 'roles',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    description: {
      type: 'varchar',
    },
  },
});
