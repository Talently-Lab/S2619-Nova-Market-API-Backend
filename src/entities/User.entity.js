import { EntitySchema } from 'typeorm';
import { User } from './User.js';

export const UserEntity = new EntitySchema({
  name: 'User',
  target: User,
  tableName: 'users',
  uniques: [
    {
      name: 'UQ_users_email',
      columns: ['email'],
    },
  ],
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    email: {
      type: 'varchar',
    },
    name: {
      type: 'varchar',
    },
    lastName: {
      type: 'varchar',
      name: 'Last_Name',
    },
    password: {
      type: 'varchar',
    },
    roleId: {
      type: 'int',
      name: 'role_id',
    },
    lastLogin: {
      type: 'timestamp',
      name: 'Last_Login',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});
