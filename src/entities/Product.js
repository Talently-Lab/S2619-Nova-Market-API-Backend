
import { EntitySchema } from 'typeorm';

export const Product = new EntitySchema({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    code: {
      type: 'varchar',
      length: 150,
      unique: true,
    },
    name: {
      type: 'varchar',
      length: 150,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
    image_url: {
      type: 'text',
      nullable: true,
    },
    stock: {
      type: 'int',
      default: 0,
    },
    category_id: {
      type: 'int',
    },
    category_name: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
    views: {
      type: 'int',
      default: 0,
    },
    is_active: {
      type: 'boolean',
      default: true,
    },
    deleted_at: {
      type: 'timestamp',
      nullable: true,
      deleteDate: true,
    },
  },
});
