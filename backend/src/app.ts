import { Hono } from "hono";
import { notFound, onError } from "stoker/middlewares";
import { CustomLogger } from "./middlewares/pino-logger.js";
import type { PinoLogger } from "hono-pino";
import bcrypt from "bcrypt";

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
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

app.post("/login", zValidator("json", LoginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");

    // TODO : voir pour ajouter quelque chose si la validation n'est pas correct ? (possible d'ajouter result dans la doc)

    // [userFind] to replace userFind[0].name etc
    const [userFind] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!userFind) {
      return c.json({ error: "User not found" }, 404);
    }

    const isValidPassword = await bcrypt.compare(password, userFind.password);

    if (!isValidPassword) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const userInfo = {
      name: userFind.name,
      email: userFind.email,
    };

    console.log(userInfo);

    return c.json({ message: "Login succesful", user: userInfo }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// TODO : POST route to sign in with jwt

const SignSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(3, { message: "Name must be 3 characters minimum" })
    .max(50, { message: "Name can't exceed 50 characters" }),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Email format is invalid" })
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .trim()
    .min(6, { message: "Password must be 6 characters minimum" })
    .max(80, { message: "Password can't exceed 80 characters" })
    .regex(/[a-z]/, { message: "Password must contain 1 min" })
    .regex(/[A-Z]/, { message: "Password must contain 1 maj" })
    .regex(/[0-9]/, { message: "Password must contain 1 number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Le mot de passe doit contenir au moins un caractère spécial",
    }),
});

/*
- jwt ? cookie ?
*/

app.post("/signin", zValidator("json", SignSchema), async (c) => {
  try {
    const { name, email, password } = c.req.valid("json");

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return c.json({ message: "Something went wrong" }, 409);
    }

    const saltRounds = 12;

    const salt = await bcrypt.genSalt(saltRounds);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });

    return c.json({ message: "User created succesfully" }, 201);
  } catch (error) {
    console.log(error);
    c.json({ message: "Invalid server error" }, 500);
  }
});

app.notFound(notFound);
app.onError(onError);

export default app;
