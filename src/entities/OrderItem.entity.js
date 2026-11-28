import { EntitySchema } from 'typeorm';
import { OrderItem } from './OrderItem.js';

export const OrderItemEntity = new EntitySchema({
  name: 'OrderItem',
  target: OrderItem,
  tableName: 'order_items',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    order_id: {
      type: 'int',
    },
    product_id: {
      type: 'int',
    },
    quantity: {
      type: 'int',
    },
    unit_price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      joinColumn: { name: 'order_id' },
      inverseSide: 'items',
    },
  },
});
