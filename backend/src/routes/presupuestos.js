import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendPresupuestoEmail } from "../utils/email.js";
import { crearLinkPagoPresupuesto, isStripeConfigured } from "../utils/stripe.js";

const router = express.Router();
router.use(requireAuth);

// Contador simple de numeración de presupuestos/facturas en memoria.
// (Se reinicia si el servidor se reinicia; suficiente para numeración de referencia,
// no es un libro contable oficial.)
let contador = Math.floor(Date.now() / 1000) % 100000;
function siguienteNumero() {
  contador += 1;
  return `SGX-${new Date().getFullYear()}-${String(contador).padStart(5, "0")}`;
}

/**
 * POST /api/presupuestos/enviar
 * Genera (opcionalmente) un link de pago de Stripe con el importe total
 * y envía el presupuesto/factura por correo al cliente vía Resend.
 *
 * body: {
 *   clientName, clientEmail, clientNif, isCompany, companyName,
 *   items: [{ nombre, cantidad, precioUnitario, cuotaUnitaria }],
 *   ivaPct: 0 | 21,
 *   isInvoice: boolean,
 *   crearLinkPago: boolean
 * }
 */
router.post("/enviar", async (req, res) => {
  try {
    const {
      clientName, clientEmail, clientNif, isCompany, companyName,
      items, ivaPct = 0, isInvoice = false, crearLinkPago = true,
    } = req.body || {};

    if (!clientEmail || !clientName) {
      return res.status(400).json({ error: "Faltan el nombre y el email del cliente" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El presupuesto no tiene ningún producto añadido" });
    }

    const subtotal = items.reduce((acc, it) => acc + (Number(it.precioUnitario) || 0) * (Number(it.cantidad) || 0), 0);
    const ivaAmount = ivaPct > 0 ? subtotal * (ivaPct / 100) : 0;
    const total = subtotal + ivaAmount;
    const numero = siguienteNumero();
    const repName = req.employee?.name || "";

    let paymentUrl = null;
    if (crearLinkPago && isStripeConfigured()) {
      const r = await crearLinkPagoPresupuesto({
        clientName: isCompany ? (companyName || clientName) : clientName,
        clientEmail,
        amountEur: total,
        description: `${isInvoice ? "Factura" : "Presupuesto"} ${numero} · ${items.map(i => i.nombre).join(", ")}`.slice(0, 250),
      });
      if (r.ok) paymentUrl = r.url;
      else console.warn("[presupuestos] No se generó link de pago:", r.reason);
    }

    const result = await sendPresupuestoEmail({
      to: clientEmail,
      clientName,
      clientNif,
      isCompany,
      companyName,
      items,
      subtotal,
      ivaPct,
      ivaAmount,
      total,
      paymentUrl,
      isInvoice,
      numero,
      repName,
    });

    if (!result.sent) {
      return res.status(502).json({ error: "No se pudo enviar el correo", detail: result.reason });
    }

    res.json({
      ok: true,
      numero,
      subtotal,
      ivaAmount,
      total,
      paymentUrl,
      stripeConfigured: isStripeConfigured(),
    });
  } catch (err) {
    console.error("[presupuestos] Error:", err);
    res.status(500).json({ error: "Error interno generando el presupuesto" });
  }
});

export default router;
