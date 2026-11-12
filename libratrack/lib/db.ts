import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

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

function getPool(): Pool {
  const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
    (name) => !process.env[name],
  );
  if (missing.length) {
    throw new Error(`Missing required database environment variables: ${missing.join(", ")}`);
  }
  if (!global.mysqlPool) {
    global.mysqlPool = mysql.createPool(poolOptions);
  }
  return global.mysqlPool;
}

const pool = new Proxy({} as Pool, {
  get(_target, property) {
    const value = getPool()[property as keyof Pool];
    return typeof value === "function" ? value.bind(getPool()) : value;
  },
});

export default pool;
export { pool };
