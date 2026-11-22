import { EntitySchema } from 'typeorm';
import { Order } from './Order.js';

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export const OrderEntity = new EntitySchema({
  name: 'Order',
  target: Order,
  tableName: 'orders',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    user_id: {
      type: 'int',
    },
    status: {
      type: 'varchar',
      length: 20,
      default: 'pending',
    },
    total: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    items: {
      type: 'one-to-many',
      target: 'OrderItem',
      inverseSide: 'order',
      eager: false,
    },
  },
});
