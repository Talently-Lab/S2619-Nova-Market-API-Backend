export class LinkUserRole1795141556878 {
  name = 'LinkUserRole1795141556878';

  async up(queryRunner) {
    await queryRunner.query(`
      INSERT INTO roles (id, description)
      VALUES (1, 'Usuario')
      ON CONFLICT (id) DO NOTHING;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT "FK_users_roles_role_id"
      FOREIGN KEY (role_id) REFERENCES roles(id);
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT "FK_users_roles_role_id";
    `);
  }
}
