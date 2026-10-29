
export class CreateProducts1792860000000 {
  name = 'CreateProducts1792860000000';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        code VARCHAR(150) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        image_url TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        views INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      DROP TABLE products;
    `);
  }
}

