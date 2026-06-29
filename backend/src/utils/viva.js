/**
 * Integración con Viva Payments (viva.com) para generar enlaces de pago
 * de presupuestos mediante Smart Checkout.
 *
 * Variables de entorno necesarias:
 *   VIVA_MERCHANT_ID        - Nº de identificación del comerciante
 *   VIVA_API_KEY            - Clave API
 *   VIVA_CLIENT_ID          - Client ID de Smart Checkout
 *   VIVA_CLIENT_SECRET      - Client Secret de Smart Checkout
 *   VIVA_SOURCE_CODE        - Código de fuente de pago (4 dígitos, se crea en el panel de Viva)
 *
 * Flujo:
 *   1. Obtener access token OAuth2
 *   2. Crear Payment Order con importe y datos del cliente
 *   3. Devolver URL de Smart Checkout para que el cliente pague
 */

const TOKEN_URL = "https://accounts.vivapayments.com/connect/token";
const API_URL = "https://api.vivapayments.com";
const CHECKOUT_URL = "https://www.vivapayments.com/web/checkout";

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Verifica si Viva Payments está configurado.
 */
export function isVivaConfigured() {
  return !!(
    process.env.VIVA_CLIENT_ID &&
    process.env.VIVA_CLIENT_SECRET &&
    process.env.VIVA_MERCHANT_ID
  );
}

/**
 * Obtiene un access token OAuth2 de Viva.
 * Cachea el token hasta que expire.
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const clientId = process.env.VIVA_CLIENT_ID;
  const clientSecret = process.env.VIVA_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[viva] Error obteniendo access token:", res.status, errText);
    throw new Error(`Viva OAuth error: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);
  return cachedToken;
}

/**
 * Crea una Payment Order en Viva y devuelve la URL de Smart Checkout.
 *
 * @param {Object} params
 * @param {string} params.clientName - Nombre del cliente o empresa.
 * @param {string} params.clientEmail - Email del cliente.
 * @param {number} params.amountEur - Importe total en euros (con decimales).
 * @param {string} params.description - Descripción del presupuesto.
 * @param {string} [params.clientPhone] - Teléfono del cliente (opcional).
 * @returns {Promise<{ok: boolean, url?: string, orderCode?: string, reason?: string}>}
 */
export async function crearLinkPagoViva({
  clientName,
  clientEmail,
  amountEur,
  description,
  clientPhone,
}) {
  if (!isVivaConfigured()) {
    return { ok: false, reason: "Viva Payments no configurado (faltan variables de entorno)" };
  }

  // Viva espera el importe en céntimos (integer)
  const amountCents = Math.round(Number(amountEur) * 100);
  if (!amountCents || amountCents <= 0) {
    return { ok: false, reason: "Importe inválido para generar el cobro" };
  }

  try {
    const token = await getAccessToken();
    const sourceCode = process.env.VIVA_SOURCE_CODE || "Default";

    const body = {
      amount: amountCents,
      customerTrns: description || "Presupuesto Seguxat - Instalación y servicio de seguridad",
      customer: {
        email: clientEmail || undefined,
        fullName: clientName || undefined,
        phone: clientPhone || undefined,
        countryCode: "ES",
        requestLang: "es-ES",
      },
      paymentTimeout: 86400, // 24 horas para pagar
      preauth: false,
      allowRecurring: false,
      maxInstallments: 0,
      paymentNotification: true,
      disableExactAmount: false,
      disableCash: true,
      disableWallet: false,
      sourceCode: sourceCode,
      merchantTrns: `Presupuesto Seguxat · ${clientName || "Cliente"}`,
      tags: ["seguxat", "presupuesto", "crm"],
    };

    const res = await fetch(`${API_URL}/checkout/v2/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[viva] Error creando payment order:", res.status, errText);
      return { ok: false, reason: `Error Viva API: ${res.status} - ${errText}` };
    }

    const data = await res.json();
    const orderCode = data.orderCode;

    if (!orderCode) {
      return { ok: false, reason: "Viva no devolvió un orderCode válido" };
    }

    // La URL de Smart Checkout donde el cliente paga
    const checkoutUrl = `${CHECKOUT_URL}?ref=${orderCode}`;

    return { ok: true, url: checkoutUrl, orderCode: String(orderCode) };
  } catch (err) {
    console.error("[viva] Error creando enlace de pago:", err.message);
    return { ok: false, reason: err.message };
  }
}
