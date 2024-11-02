import { Hono } from "hono";
import { notFound, onError } from "stoker/middlewares";
import { CustomLogger } from "./middlewares/pino-logger.js";
import type { PinoLogger } from "hono-pino";

import { z } from "zod";
import db from "./config/database.js";
import { eq } from "drizzle-orm";
import { users } from "./config/schema.js";

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

const LoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Email format is invalid" })
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .trim()
    .min(6, { message: "Password must be 6 characters minimum" })
    .max(80, { message: "Password can't exceed 80 characters" }),
});

app.post("/login", async (c) => {
  try {
    const { email, password } = LoginSchema.parse(await c.req.json());

    const userFind = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!userFind) {
      return c.json({ error: "User not found" }, 404);
    }

    if (password !== userFind[0].password) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const userInfo = {
      name: userFind[0].name,
      email: userFind[0].email,
    };

    console.log(userInfo);

    return c.json({ message: "Login succesful", user: userInfo }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// TODO : POST route to sign in with jwt

app.notFound(notFound);
app.onError(onError);

export default app;
