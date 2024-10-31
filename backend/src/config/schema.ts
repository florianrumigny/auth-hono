import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// TODO: Faire un schema zod ?

// pour définir la table
export const users = sqliteTable("users", {
  // id unique - best practice to specify the name of the column (même nom que dans le query.sql)
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  // information user
  name: text("name_user").notNull(),
  email: text("email_user").notNull().unique(),

  // security
  password: text("password_login").notNull(),

  // Timestamps
  lastLogin: text("last_login")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  // Logs
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  //forget password
  resetToken: text("reset_token"),
  resetTokenExpiry: text("reset_token_expiry"),

  // account status - interger mode boolean because sqlite doesn't have a native boolean datatype
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
});
