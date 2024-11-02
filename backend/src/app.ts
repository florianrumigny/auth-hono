import { Hono } from "hono";
import { notFound, onError } from "stoker/middlewares";
import { CustomLogger } from "./middlewares/pino-logger.js";
import type { PinoLogger } from "hono-pino";

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
- installer bcrypt pour hasher mdp / faire la validation
- si utilisateur existe déjà, on envoie une erreur
- sinon on peut créer l'utilisateur (requete pour insérer un utilisateur)
- on return une validation comme quoi l'utilisateur est bien enregistré en bdd
*/

app.post("/signin", async (c) => {
  try {
  } catch (error) {
    console.log(error);
    c.json({ message: "Invalid server error" }, 500);
  }
});

app.notFound(notFound);
app.onError(onError);

export default app;
