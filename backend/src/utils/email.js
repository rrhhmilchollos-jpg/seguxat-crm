/**
 * Envío de emails transaccionales mediante Resend (https://resend.com).
 *
 * Necesita la variable de entorno RESEND_API_KEY. Si no está configurada,
 * el envío se omite silenciosamente (con un aviso en consola) para no
 * romper la creación de empleados en entornos de desarrollo.
 */
const RESEND_API_URL = "https://api.resend.com/emails";

// Mientras no se configure un dominio propio verificado en Resend, se debe
// usar esta dirección de remitente (la de pruebas que Resend ofrece a
// cualquier cuenta sin verificación de dominio).
const DEFAULT_FROM = "Seguxat CRM <onboarding@resend.dev>";

export async function sendWelcomeEmail({ to, name, email, password, loginUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; se omite el envío del correo de bienvenida.");
    return { sent: false, reason: "no-api-key" };
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  const url = loginUrl || process.env.FRONTEND_URL || "https://seguxat-crm-alpha.vercel.app";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color:#0d2240; font-size:22px;">Bienvenido/a a Seguxat CRM</h1>
      <p style="font-family: Arial, sans-serif; color:#334155; font-size:14px; line-height:1.5;">
        Hola ${name},<br/><br/>
        Se ha creado tu cuenta de empleado en el CRM de ventas de Seguxat. Estos son tus datos de acceso provisionales:
      </p>
      <table style="font-family: Arial, sans-serif; font-size:14px; color:#0f172a; background:#f8fafc; border-radius:8px; padding:16px; width:100%;">
        <tr><td style="padding:4px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Contraseña provisional:</strong></td><td>${password}</td></tr>
      </table>
      <p style="font-family: Arial, sans-serif; color:#334155; font-size:14px; line-height:1.5;">
        Te recomendamos cambiar esta contraseña en cuanto inicies sesión. En tu primer acceso deberás también vincular tu cuenta de Google como verificación en dos pasos.
      </p>
      <a href="${url}" style="display:inline-block; background:#f5a623; color:#0d2240; font-family: Arial, sans-serif; font-weight:bold; text-decoration:none; padding:10px 20px; border-radius:6px; margin-top:12px;">
        Acceder al CRM
      </a>
      <p style="font-family: Arial, sans-serif; color:#94a3b8; font-size:12px; margin-top:24px;">
        Seguxat — Seguridad que cuida de los tuyos.
      </p>
    </div>
  `;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Tu acceso al CRM de Seguxat",
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[email] Error al enviar correo de bienvenida:", res.status, errText);
    return { sent: false, reason: errText };
  }

  return { sent: true };
}

// ─── Alertas ARIA para el director ───────────────────────────────────────────

const DIRECTOR_EMAIL = "rrhh.milchollos@gmail.com";
const RESEND_API_KEY_VAL = process.env.RESEND_API_KEY;

// Log en memoria para el informe diario
const ariaErrorLog = [];

export function logAriaError({ employeeName, employeeEmail, userMessage, errorType, timestamp }) {
  ariaErrorLog.push({ employeeName, employeeEmail, userMessage, errorType, timestamp: timestamp || new Date().toISOString() });
}

export function getAriaErrorLog() { return [...ariaErrorLog]; }
export function clearAriaErrorLog() { ariaErrorLog.length = 0; }

// Email urgente al director cuando ARIA falla con un empleado
export async function sendAriaUrgentAlert({ employeeName, employeeEmail, userMessage, errorType }) {
  if (!RESEND_API_KEY_VAL) return;
  const ts = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY_VAL}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Seguxat CRM <onboarding@resend.dev>",
        to: [DIRECTOR_EMAIL],
        subject: `🚨 ARIA falló con ${employeeName} — Soporte urgente requerido`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px">
            <div style="background:#ef4444;color:#fff;padding:12px 16px;border-radius:8px;margin-bottom:20px">
              <strong>⚠️ ARIA — FALLO DETECTADO</strong> · ${ts}
            </div>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#94a3b8;width:160px">Empleado</td><td style="padding:8px 0;font-weight:bold">${employeeName}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Email</td><td style="padding:8px 0">${employeeEmail}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8">Tipo de error</td><td style="padding:8px 0;color:#fca5a5">${errorType}</td></tr>
              <tr><td style="padding:8px 0;color:#94a3b8;vertical-align:top">Mensaje del empleado</td><td style="padding:8px 0;font-style:italic">"${userMessage}"</td></tr>
            </table>
            <div style="margin-top:20px;padding:12px;background:#1e293b;border-radius:8px;font-size:13px;color:#64748b">
              ARIA respondió con fallback inteligente. El empleado no vio el error técnico.<br>
              Accede al CRM para revisar: <a href="https://crm.seguxat.es" style="color:#6366f1">crm.seguxat.es</a>
            </div>
          </div>`,
      }),
    });
  } catch (e) {
    console.error("[email] Error enviando alerta ARIA:", e.message);
  }
}

// ─── Presupuestos / facturas a clientes ──────────────────────────────────────

/**
 * Envía al cliente el presupuesto (o factura) generado en el Catálogo,
 * con desglose de líneas, IVA opcional y, si Stripe está configurado,
 * un botón de pago directo con el importe total.
 */
export async function sendPresupuestoEmail({
  to,
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
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; no se puede enviar el presupuesto.");
    return { sent: false, reason: "no-api-key" };
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  const fmt = (n) => Number(n || 0).toFixed(2).replace(".", ",");
  const titulo = isInvoice ? "Factura" : "Presupuesto";
  const fecha = new Date().toLocaleDateString("es-ES");

  const filasHtml = (items || [])
    .map(
      (it) => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:8px 4px;color:#0f172a;font-size:13px">${it.nombre}${it.cantidad > 1 ? ` <span style="color:#94a3b8">x${it.cantidad}</span>` : ""}</td>
        <td style="padding:8px 4px;text-align:right;color:#0f172a;font-size:13px;white-space:nowrap">${fmt(it.precioUnitario)} €</td>
        <td style="padding:8px 4px;text-align:right;color:#0f172a;font-size:13px;white-space:nowrap">${fmt(it.precioUnitario * it.cantidad)} €</td>
      </tr>`
    )
    .join("");

  const cuotaMensualTotal = (items || []).reduce((acc, it) => acc + (Number(it.cuotaUnitaria) || 0) * it.cantidad, 0);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#0f172a;">
      <div style="background:#0d2240;padding:20px 24px;border-radius:12px 12px 0 0;">
        <div style="color:#f5a623;font-size:12px;letter-spacing:2px;font-weight:bold;text-transform:uppercase;">SEGUXAT</div>
        <div style="color:#fff;font-size:20px;font-weight:bold;margin-top:4px;">${titulo} ${numero ? `Nº ${numero}` : ""}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:2px;">${fecha}</div>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <table style="width:100%;font-size:13px;margin-bottom:16px;">
          <tr><td style="color:#94a3b8;padding:2px 0;">${isCompany ? "Empresa" : "Cliente"}</td><td style="text-align:right;font-weight:bold;">${isCompany ? (companyName || clientName) : clientName}</td></tr>
          ${isCompany && clientName ? `<tr><td style="color:#94a3b8;padding:2px 0;">Persona de contacto</td><td style="text-align:right;">${clientName}</td></tr>` : ""}
          ${clientNif ? `<tr><td style="color:#94a3b8;padding:2px 0;">${isCompany ? "CIF" : "NIF"}</td><td style="text-align:right;">${clientNif}</td></tr>` : ""}
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <thead>
            <tr style="border-bottom:2px solid #0d2240">
              <th style="text-align:left;padding:6px 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Concepto</th>
              <th style="text-align:right;padding:6px 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Unidad</th>
              <th style="text-align:right;padding:6px 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Importe</th>
            </tr>
          </thead>
          <tbody>${filasHtml}</tbody>
        </table>

        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:4px 0;color:#475569;">Subtotal</td><td style="text-align:right;padding:4px 0;">${fmt(subtotal)} €</td></tr>
          ${ivaPct > 0
            ? `<tr><td style="padding:4px 0;color:#475569;">IVA (${ivaPct}%)</td><td style="text-align:right;padding:4px 0;">${fmt(ivaAmount)} €</td></tr>`
            : `<tr><td style="padding:4px 0;color:#475569;">IVA</td><td style="text-align:right;padding:4px 0;">No aplicado (exento / 0%)</td></tr>`}
          <tr><td style="padding:10px 0 2px;font-weight:bold;font-size:15px;border-top:2px solid #0d2240;">TOTAL ${isInvoice ? "A PAGAR" : "PRIMER PAGO"}</td><td style="text-align:right;padding:10px 0 2px;font-weight:bold;font-size:18px;border-top:2px solid #0d2240;color:#0d2240;">${fmt(total)} €</td></tr>
          ${cuotaMensualTotal > 0 ? `<tr><td style="padding:4px 0;color:#94a3b8;font-size:12px;" colspan="2">+ ${fmt(cuotaMensualTotal)} €/mes de monitorización y servicio, a partir del segundo mes</td></tr>` : ""}
        </table>

        ${paymentUrl ? `
        <div style="text-align:center;margin-top:24px;">
          <a href="${paymentUrl}" style="display:inline-block;background:#f5a623;color:#0d2240;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;">
            💳 Pagar ${fmt(total)} € ahora
          </a>
          <div style="color:#94a3b8;font-size:11px;margin-top:8px;">Pago seguro procesado por Stripe</div>
        </div>` : ""}

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;">
          ${isInvoice ? "Factura" : "Presupuesto"} emitido por Seguxat S.L. ${repName ? `· Comercial: ${repName}` : ""}<br/>
          ${!isInvoice ? "Presupuesto válido 30 días · Sin permanencia · " : ""}Cualquier duda, responde a este correo o llama al 910 626 738.
        </div>
      </div>
    </div>
  `;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `${titulo} Seguxat${numero ? ` Nº ${numero}` : ""} — ${isCompany ? companyName || clientName : clientName}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[email] Error al enviar presupuesto:", res.status, errText);
    return { sent: false, reason: errText };
  }

  return { sent: true };
}

// Informe diario de errores ARIA — llamar con cron cada día a las 08:00
export async function sendAriaDailyReport() {
  if (!RESEND_API_KEY_VAL) return;
  const errors = getAriaErrorLog();
  const ts = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  const rows = errors.length === 0
    ? "<tr><td colspan='4' style='padding:12px;text-align:center;color:#10b981'>✅ Sin errores en las últimas 24 horas</td></tr>"
    : errors.map(e => `<tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px">${new Date(e.timestamp).toLocaleTimeString("es-ES")}</td>
        <td style="padding:8px">${e.employeeName}</td>
        <td style="padding:8px;color:#fca5a5">${e.errorType}</td>
        <td style="padding:8px;font-style:italic;max-width:200px;overflow:hidden">${e.userMessage?.slice(0,80)}...</td>
      </tr>`).join("");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY_VAL}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Seguxat CRM <onboarding@resend.dev>",
        to: [DIRECTOR_EMAIL],
        subject: `📊 Informe diario ARIA — ${new Date().toLocaleDateString("es-ES")} · ${errors.length} incidencia(s)`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px">
            <h2 style="color:#fff;margin-top:0">📊 Informe diario ARIA · ${ts}</h2>
            <p style="color:#94a3b8">Resumen de incidencias del agente IA en las últimas 24 horas.</p>
            <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden">
              <thead><tr style="background:#0f172a">
                <th style="padding:10px;text-align:left;color:#64748b;font-size:12px">HORA</th>
                <th style="padding:10px;text-align:left;color:#64748b;font-size:12px">EMPLEADO</th>
                <th style="padding:10px;text-align:left;color:#64748b;font-size:12px">ERROR</th>
                <th style="padding:10px;text-align:left;color:#64748b;font-size:12px">MENSAJE</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:16px;font-size:13px;color:#475569">
              Total incidencias: <strong style="color:#fff">${errors.length}</strong> · 
              <a href="https://crm.seguxat.es" style="color:#6366f1">Acceder al CRM</a>
            </div>
          </div>`,
      }),
    });
    clearAriaErrorLog();
  } catch (e) {
    console.error("[email] Error enviando informe diario ARIA:", e.message);
  }
}
