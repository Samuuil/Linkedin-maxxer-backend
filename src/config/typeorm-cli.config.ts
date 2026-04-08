import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'linkedin_maxxer',
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});
