import pino from "pino";

const logger = pino();
if (Bun.env.DEBUG) logger.level = Bun.env.NO_TRACE ? "debug" : "trace";
export default logger;
