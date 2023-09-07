import mysql from "mysql";
import logger from "../../logger.js";

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? "3306"),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

await new Promise((resolve, reject) => connection.connect((error) => (error ? reject(error) : resolve())));
logger.info("[DB]  CONNECTED");

connection.query(`CREATE DATABASE tcn`, (error) => {
    if (error) logger.info("[DB] DB 'tcn' exists");
    else logger.info("[DB] Created DB 'tcn'");
});

connection.changeUser({ database: "tcn" });

export default function (query, params = []) {
    return new Promise((resolve, reject) => connection.query(query, params, (error, result) => (error ? reject(error) : resolve(result))));
}
