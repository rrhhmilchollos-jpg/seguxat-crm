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
