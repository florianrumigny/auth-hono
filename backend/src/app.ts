import { Hono } from "hono";
import { logger } from "hono/logger";
import { notFound, onError } from "stoker/middlewares";
import { CustomLogger } from "./middlewares/pino-logger.js";
import { levels } from "pino";
import type { PinoLogger } from "hono-pino";

import { config } from "dotenv";
import { expand } from "dotenv-expand";

expand(config());

interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
}

const app = new Hono<AppBindings>();

app.use(CustomLogger());

app.get("/", (c) => {
  return c.text("Hello you!");
});

app.notFound(notFound);
app.onError(onError);

export default app;
