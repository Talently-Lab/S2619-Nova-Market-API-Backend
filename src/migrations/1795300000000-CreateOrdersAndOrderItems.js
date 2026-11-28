export class CreateOrdersAndOrderItems1795300000000 {
  name = 'CreateOrdersAndOrderItems1795300000000';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE orders (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL,
        status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        total       NUMERIC(10, 2) NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_orders_users_user_id"
          FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT "CHK_orders_status"
          CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'))
      );
    `);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id          SERIAL PRIMARY KEY,
        order_id    INTEGER NOT NULL,
        product_id  INTEGER NOT NULL,
        quantity    INTEGER NOT NULL CHECK (quantity >= 1),
        unit_price  NUMERIC(10, 2) NOT NULL,
        CONSTRAINT "FK_order_items_order_id"
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product_id"
          FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Índices para las consultas más frecuentes
    await queryRunner.query(`CREATE INDEX "IDX_orders_user_id"   ON orders (user_id);`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status"    ON orders (status);`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_order_id" ON order_items (order_id);`);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_order_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_user_id";`);
    await queryRunner.query(`DROP TABLE order_items;`);
    await queryRunner.query(`DROP TABLE orders;`);
  }
}
