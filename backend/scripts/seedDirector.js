#!/usr/bin/env node
// Script de seed en CommonJS (compatible con Node.js v24+)
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { DIRECTOR_NAME, DIRECTOR_EMAIL, DIRECTOR_PASSWORD, MONGODB_URI } = process.env;

if (!DIRECTOR_NAME || !DIRECTOR_EMAIL || !DIRECTOR_PASSWORD) {
  console.error("Faltan DIRECTOR_NAME / DIRECTOR_EMAIL / DIRECTOR_PASSWORD en el .env.");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("Falta MONGODB_URI en el .env.");
  process.exit(1);
}

const employeeSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, default: "director" },
  zone:         { type: String, default: "Toda Valencia" },
  googleId:     { type: String, default: null },
  active:       { type: Boolean, default: true },
}, { timestamps: true });

const Employee = mongoose.model("Employee", employeeSchema);

async function main() {
  console.log("[seed] Conectando a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("[seed] Conectado a:", mongoose.connection.name);

  const email = DIRECTOR_EMAIL.toLowerCase().trim();
  let employee = await Employee.findOne({ email });

  if (employee) {
    employee.role   = "director";
    employee.active = true;
    await employee.save();
    console.log("[seed] Cuenta existente actualizada a director:", email);
  } else {
    const passwordHash = await bcrypt.hash(DIRECTOR_PASSWORD, 12);
    await Employee.create({ name: DIRECTOR_NAME, email, passwordHash, role: "director", zone: "Toda Valencia" });
    console.log("[seed] ✅ Cuenta de director creada correctamente:", email);
  }

  console.log("[seed] Recuerda: en el primer inicio de sesión deberás vincular tu cuenta de Google.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Error:", err.message);
  process.exit(1);
});
