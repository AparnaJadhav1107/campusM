import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import { connectDB, isMongo } from "./config/db.js";
import { usersRepo } from "./services/store.js";

/*
 * Manual seed — creates ONLY the admin account from the ADMIN_* env vars.
 * No students, no complaints, no demo accounts are ever created here.
 * Students create their own accounts from the Register page.
 * Run explicitly with:  npm run seed
 */
await connectDB();

const email = (process.env.ADMIN_EMAIL || "admin@campus.edu").toLowerCase();
const existing = await usersRepo.findByEmail(email);
if (existing) {
  console.log(`[Seed] Admin already exists: ${email} — nothing created.`);
} else {
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  await usersRepo.create({
    name: process.env.ADMIN_NAME || "Campus Admin",
    email,
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "Admin@123", rounds),
    role: "admin",
  });
  console.log(`[Seed] Admin account created: ${email} (mode: ${isMongo() ? "mongodb" : "in-memory file store"})`);
}
console.log("[Seed] Done. No students or complaints were created — the system starts empty.");
process.exit(0);
