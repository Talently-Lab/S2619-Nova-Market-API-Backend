export class AddProductSoftDeleteAndUnique1795200000000 {
  name = 'AddProductSoftDeleteAndUnique1795200000000';

  async up(queryRunner) {
    // Soft delete
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS category_name VARCHAR(100) NULL;
    `);

    // UNIQUE en code (ya verificado que no hay duplicados)
    await queryRunner.query(`
      ALTER TABLE products
        ADD CONSTRAINT "UQ_products_code" UNIQUE (code);
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE products
        DROP CONSTRAINT IF EXISTS "UQ_products_code";
    `);

    await queryRunner.query(`
      ALTER TABLE products
        DROP COLUMN IF EXISTS deleted_at,
        DROP COLUMN IF EXISTS is_active,
        DROP COLUMN IF EXISTS category_name;
    `);
  }
}
