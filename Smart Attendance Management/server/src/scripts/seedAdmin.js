import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import { User } from "../models.js";

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@a2college.edu").toLowerCase();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log(`Admin already exists for ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123", 10);

  await User.create({
    name: process.env.DEFAULT_ADMIN_NAME || "System Admin",
    email,
    passwordHash,
    role: "admin"
  });

  console.log(`Admin created for ${email}`);
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error("Failed to seed admin", error);
  process.exit(1);
});
