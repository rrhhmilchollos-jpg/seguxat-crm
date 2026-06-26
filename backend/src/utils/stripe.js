/**
 * Integración con Stripe para generar enlaces de pago de presupuestos.
 *
 * Necesita la variable de entorno STRIPE_SECRET_KEY (clave secreta de tu
 * cuenta de Stripe — Dashboard > Developers > API keys). Mientras no esté
 * configurada, la creación de enlaces de pago devuelve un error controlado
 * para no romper el envío del presupuesto (el correo se envía igualmente,
 * sin botón de pago).
 */
import Stripe from "stripe";

let stripeClient = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Crea una Checkout Session de Stripe para el importe total del presupuesto
 * y devuelve la URL de pago lista para incluir en el correo al cliente.
 *
 * @param {Object} params
 * @param {string} params.clientName - Nombre del cliente o empresa.
 * @param {string} params.clientEmail - Email del cliente (se precompleta en Stripe).
 * @param {number} params.amountEur - Importe total a cobrar, en euros (con decimales).
 * @param {string} params.description - Descripción que verá el cliente en Stripe.
 * @param {string} params.successUrl - URL de redirección tras pago correcto.
 * @param {string} params.cancelUrl - URL de redirección si cancela.
 */
export async function crearLinkPagoPresupuesto({
  clientName,
  clientEmail,
  amountEur,
  description,
  successUrl,
  cancelUrl,
}) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, reason: "STRIPE_SECRET_KEY no configurada en el servidor" };
  }

  const amountCents = Math.round(Number(amountEur) * 100);
  if (!amountCents || amountCents <= 0) {
    return { ok: false, reason: "Importe inválido para generar el cobro" };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: clientEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Presupuesto Seguxat — ${clientName || "Cliente"}`,
              description: description || "Instalación y servicio de seguridad Seguxat",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || "https://seguxat.es/pago-ok",
      cancel_url: cancelUrl || "https://seguxat.es/pago-cancelado",
    });

    return { ok: true, url: session.url, sessionId: session.id };
  } catch (err) {
    console.error("[stripe] Error creando sesión de pago:", err.message);
    return { ok: false, reason: err.message };
  }
}
