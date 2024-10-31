import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import env from "../env.js";
import { users } from "./schema.js";

const sqlite = new Database(env.DATABASE_URL);

// permet de faire la connexion de la db avec drizzle + le wrapper permet d'ajouter des options comme le logger
const db = drizzle(sqlite, { logger: true, schema: { users } });

// process.on("exit", () => {
//   sqlite.close();
// });

export default db;
