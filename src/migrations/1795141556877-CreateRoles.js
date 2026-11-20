export class CreateRoles1795141556877 {
  name = 'CreateRoles1795141556877';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        description VARCHAR NOT NULL
      );
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      DROP TABLE roles;
    `);
  }
}
