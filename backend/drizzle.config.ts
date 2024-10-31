/* eslint-disable style/semi */
/* eslint-disable style/quotes */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "sqlite",
  schema: "./src/config/schema.ts",
  dbCredentials: {
    url: "./training-user.sqlite",
  },
  verbose: true,
  strict: true,
});
