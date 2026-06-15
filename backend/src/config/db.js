import mongoose from "mongoose";
import dns from "dns";

// Algunos routers/proveedores de internet no resuelven correctamente los
// registros DNS "SRV" que usa `mongodb+srv://` (error típico:
// "querySrv ECONNREFUSED _mongodb._tcp...").
// Esto usa el DNS de Google SOLO para este programa, sin tocar la
// configuración de red de Windows/Mac.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en las variables de entorno");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("[db] Conectado a MongoDB:", mongoose.connection.name);
}
