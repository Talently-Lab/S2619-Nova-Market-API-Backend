export class CreateUsers1793581405432 {
  name = 'CreateUsers1793581405432';

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        "Last_Name" VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        role_id INTEGER NOT NULL,
        "Last_Login" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      DROP TABLE users;
    `);
  }
}
