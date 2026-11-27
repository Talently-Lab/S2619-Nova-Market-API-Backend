export class SeedMissingRoles1795177743282 {
  name = 'SeedMissingRoles1795177743282';

  async up(queryRunner) {
    await queryRunner.query(`
      INSERT INTO roles (id, description)
      SELECT required_roles.id,
             CASE
               WHEN required_roles.id = 1 THEN 'Usuario'
               ELSE 'Rol ' || required_roles.id::text
             END
      FROM (
        SELECT 1 AS id
        UNION
        SELECT DISTINCT role_id AS id
        FROM users
      ) AS required_roles
      LEFT JOIN roles existing_role ON existing_role.id = required_roles.id
      WHERE existing_role.id IS NULL
      ON CONFLICT (id) DO NOTHING;
    `);

    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('roles', 'id'),
        GREATEST(COALESCE((SELECT MAX(id) FROM roles), 1), 1),
        true
      );
    `);
  }

  async down() {
    // Seeded roles are retained because users may reference them after this migration.
  }
}
