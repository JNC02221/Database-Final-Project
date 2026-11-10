import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
] as const;

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const poolOptions: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

declare global {
  var mysqlPool: Pool | undefined;
}

const pool = global.mysqlPool ?? mysql.createPool(poolOptions);

if (process.env.NODE_ENV !== "production") {
  global.mysqlPool = pool;
}

export default pool;
export { pool };
