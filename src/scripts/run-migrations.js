
import 'dotenv/config';
import { AppDataSource } from '../config/database.js';

try {
  await AppDataSource.initialize();
  console.log('Conexión a PostgreSQL establecida.');

  const migrations = await AppDataSource.runMigrations();

  if (migrations.length === 0) {
    console.log('No hay migraciones pendientes.');
  } else {
    for (const migration of migrations) {
      console.log(`Migración ejecutada: ${migration.name}`);
    }
  }
} catch (error) {
  console.error('Error al ejecutar las migraciones:', error);
  process.exitCode = 1;
} finally {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
