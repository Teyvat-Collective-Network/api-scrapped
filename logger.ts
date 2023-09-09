import pino from "pino";

const logger = pino();
if (Bun.env.DEBUG) logger.level = "trace";
export default logger;
