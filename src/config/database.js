
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '../entities/Product.js';
import { UserEntity } from '../entities/User.entity.js';
import { UserSubscriber } from '../subscribers/UserSubscriber.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  applicationName: 'nova-market-api',
  entities: [Product, UserEntity],
  subscribers: [UserSubscriber],
  migrations: ['src/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});
