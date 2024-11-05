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
import { Resend } from "resend";
import env from "./env.js";
import { generateCode } from "./helpers/generateOTP.js";
import { decode, sign, verify, jwt } from "hono/jwt";
import { setSignedCookie } from "hono/cookie";

import type { JwtVariables } from "hono/jwt";

interface AppBindings {
  Variables: {
    logger: PinoLogger;
    jwt: JwtVariables;
  };
}

const app = new Hono<AppBindings>();
const resend = new Resend(env.RESEND_API_KEY);

app.use(CustomLogger());

app.use(
  "/auth/*",
  jwt({
    secret: env.SECRET_KEY_TOKEN,
    cookie: "auth",
  })
);

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
  otpCode: z
    .string({ required_error: "OtpCode is required" })
    .trim()
    .min(6, { message: "Must be 6 characters" })
    .max(6, { message: "Must be 6 characters" }),
});

// To omit some types
const RequestLoginSchema = LoginSchema.omit({
  password: true,
  otpCode: true,
});

// send the request to Login and send the otpcode to the user

// TODO : Integrate JWT and cookie system in the login
// Putting Jwt in cookie protect from XSS attacks, with httponly flag (not accessible to client side JS)

// Créer un middleware pour vérifier si le cookie est là pour la route get par exemple ?
// voir si middleware existe avec Hono
// Mettre en place un refresh token ?

app.post(
  "/request-login",
  zValidator("json", RequestLoginSchema),
  async (c) => {
    try {
      const { email } = c.req.valid("json");

      // TODO : voir pour ajouter quelque chose si la validation n'est pas correct ? (possible d'ajouter result dans la doc)

      // [userFind] to replace userFind[0].name etc
      const [userFind] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!userFind) {
        return c.json({ error: "User not found" }, 404);
      }

      const secretOtp = generateCode();

      // to save the code in the DB (need to resent a code after 15 minutes)
      const saveOtp = await db
        .update(users)
        .set({
          otpCode: secretOtp,
          otpExpiry: new Date(Date.now() + 15 * 60000),
        })
        .where(eq(users.email, email));

      // To send the email to the client with the secreOtp
      const sendEmail = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Connexion code",
        html: `You're connexion code is : ${secretOtp}`,
      });

      return c.json({ message: "Login succesful" }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

const VerifyCodeSchema = LoginSchema.omit({
  password: true,
});

// Request to verify the code and login

app.post("/verify-code", zValidator("json", VerifyCodeSchema), async (c) => {
  try {
    const { email, otpCode } = c.req.valid("json");

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return c.json({ error: "Something went wrong" }, 404);
    }

    if (user.otpCode !== otpCode) {
      return c.json({ error: "Invalid OTP" }, 401);
    }

    if (new Date() > new Date(user.otpExpiry ?? 0)) {
      return c.json({ error: "Expired OTP" }, 401);
    }

    const resetCode = await db
      .update(users)
      .set({
        otpCode: null,
        otpExpiry: null,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.email, email));

    // Créer le JWT - Hono helpers

    const accessToken = await sign(
      {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 5,
      },
      env.SECRET_KEY_TOKEN
    );

    console.log(accessToken);

    // On envoie un cookie qui servira à contenir les infos et les securiser
    // Le path:"/" est important pour envoyer à toutes les requêtes

    const cookie = await setSignedCookie(
      c,
      "auth",
      accessToken,
      env.SECRET_KEY_TOKEN,
      {
        path: "/",
        httpOnly: true,
        secure: env.NODE_ENV === "development", // "production", set as dev for local testing
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return c.json(
      {
        message: "Login Succesful",
        user: {
          name: user.name,
          email: user.email,
        },
      },
      200
    );
  } catch (error) {
    console.log(error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

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
      return c.json(
        { message: "Something went wrong", error: "Email already exist" },
        409
      );
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

app.get("/auth/profile/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)));

    if (!user) {
      return c.json({ message: "Something went wrong" }, 404);
    }

    return c.json(
      {
        message: "Get profile ok",
        user: { name: user.name, email: user.email },
      },
      200
    );
  } catch (error) {
    console.log(error);
    return c.json({ error: "Internal error servor" }, 500);
  }
});

app.notFound(notFound);
app.onError(onError);

export default app;
