import { runMigrations, sqlite } from "./db.js";
runMigrations();
sqlite.close();
console.log("Database migrations applied.");
