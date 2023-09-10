import mysql from "mysql";
import logger from "./logger.ts";

const connection = mysql.createConnection({
    host: Bun.env.DATABASE_HOST,
    port: parseInt(Bun.env.DATABASE_PORT ?? "3306"),
    user: Bun.env.DATABASE_USER,
    password: Bun.env.DATABASE_PASSWORD,
});

await new Promise((resolve, reject) => connection.connect((error) => (error ? reject(error) : resolve(null))));
logger.info("[DB] CONNECTED");

const db = Bun.env.TEST || Bun.env.TEST_CLIENT ? "tcntest" : "tcn";

if (Bun.env.TEST) connection.query(`DROP DATABASE tcntest`, () => {});

connection.query(`CREATE DATABASE ${db}`, (error) => {
    if (error) logger.info(`[DB] DB '${db}' exists`);
    else logger.info(`[DB] Created DB '${db}'`);
});

connection.changeUser({ database: db });

export default function (query: string, params: readonly any[] = []): Promise<any> {
    return new Promise((resolve, reject) => connection.query(query, params, (error, result) => (error ? reject(error) : resolve(result))));
}
