import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("training-user.sqlite");
const db = drizzle({ client: sqlite });

export default db;
