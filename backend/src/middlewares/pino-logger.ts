import { pinoLogger } from "hono-pino";
import pino from "pino";

// export function CustomLogger() {
//   return pinoLogger({
//     pino: {
//       level: process.env.LOG_LEVEL || "info",
//       transport: {
//         target: process.env.NODE_ENV === "production" ? "" : "pino-pretty",
//       },
//       redact: {
//         paths: ["req.headers.cookie", "req.headers.authorization"],
//       },
//     },
//     http: {
//       reqId: () => crypto.randomUUID(),
//     },
//   });
// }

export const logger = pino.default({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: process.env.NODE_ENV === "production" ? "" : "pino-pretty",
  },
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization"],
  },
});

export function CustomLogger() {
  return pinoLogger({
    pino: logger,
    http: {
      reqId: () => crypto.randomUUID(),
    },
  });
}
