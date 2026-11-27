
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
    }
  },
});
