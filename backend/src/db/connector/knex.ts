import knex, { type Knex } from 'knex';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Knex is constructed during module evaluation, before Nest's ConfigModule starts.
// Load the project-root env file first so migrations and repositories see the same config.
loadEnv({ path: resolve(__dirname, '../../../../.env') });

const connection: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: { min: 0, max: 10 },
};

const knexConnection = knex(connection);

export default knexConnection;
