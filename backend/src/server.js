import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import leadRoutes from "./routes/leads.js";
import customerRoutes from "./routes/customers.js";
import instalacionRoutes from "./routes/instalaciones.js";
import ariaRoutes from "./routes/aria.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "seguxat-crm-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/instalaciones", instalacionRoutes);
app.use("/api/aria", ariaRoutes);

// Manejador de errores genérico
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] Seguxat CRM API escuchando en :${PORT}`);

      // ─── Informe diario ARIA → director a las 08:00 hora Madrid ──────────
      import("./utils/email.js").then(({ sendAriaDailyReport }) => {
        function scheduleDailyReport() {
          const now = new Date();
          const madrid = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
          const next = new Date(madrid);
          next.setHours(8, 0, 0, 0);
          if (next <= madrid) next.setDate(next.getDate() + 1);
          const msUntil = next - madrid;
          console.log(`[aria] Informe diario programado en ${Math.round(msUntil/3600000)}h`);
          setTimeout(() => {
            sendAriaDailyReport();
            setInterval(sendAriaDailyReport, 24 * 60 * 60 * 1000); // cada 24h
          }, msUntil);
        }
        scheduleDailyReport();
      }).catch(e => console.error("[aria] Error cron:", e.message));
    });
  })
  .catch((err) => {
    console.error("[db] No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  });
