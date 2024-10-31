import { logger } from "../middlewares/pino-logger.js";
import db from "./database.js";
import { users } from "./schema.js";

async function seed() {
  try {
    // Données de test
    const testUsers = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password456",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    // Insertion des données
    await db.insert(users).values(testUsers);
    logger.info("✅ Données de test insérées avec succès");
  } catch (error) {
    // TODO: why error isn't working with the logger ?
    logger.error("❌ Erreur lors du seed:", error);
    console.error(error, "error console");
    process.exit(1);
  }
}

seed();
