import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const connectDB = new DataSource({
  type: 'postgres',
  logging: process.env.DATABASE_LOGGING === 'true',
  synchronize: false,
  migrationsTableName: 'migrations',
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME || 'linkedin_maxxer',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  migrations: [__dirname + '/../migrations/*.ts'],
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
});

export default connectDB;
