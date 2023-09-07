import logger from "./logger.js";
import "./v1/index.js";

process.on("uncaughtException", (error) => logger.error(error));
