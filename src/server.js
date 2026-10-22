

import 'dotenv/config';
import app from './app.js';
import { AppDataSource } from './config/database.js';

const PORT = process.env.PORT || 3000;

try {
  await AppDataSource.initialize();
  console.log('Conexión a PostgreSQL establecida correctamente.');

  app.listen(PORT, () => {
    console.log(`Nova Market API ejecutándose en el puerto ${PORT}`);
  });
} catch (error) {
  console.error('Error al conectar con PostgreSQL:', error.message);
  process.exit(1);
}
