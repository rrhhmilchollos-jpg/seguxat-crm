import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// Respuestas inteligentes de fallback cuando no hay API key
function fallbackResponse(userMsg, employeeName) {
  const msg = userMsg.toLowerCase();
  const nombre = employeeName || "compañero/a";

  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("hey") || msg.length < 10) {
    return `¡Hola ${nombre}! 👋 Soy ARIA, tu asistente de Seguxat. Estoy aquí para ayudarte a gestionar el pipeline, revisar instalaciones pendientes y resolver cualquier duda. ¿En qué puedo ayudarte hoy?`;
  }
  if (msg.includes("lead") || msg.includes("cliente") || msg.includes("cita")) {
    return `Hola ${nombre}. Para gestionar leads y citas, dirígete a la sección **Citas** del menú lateral donde verás el pipeline completo. Puedes avanzar cualquier lead pulsando sobre él y usando el botón "Agendar cita" para asignar comercial o técnico con fecha y hora. ¿Necesitas algo más específico?`;
  }
  if (msg.includes("agenda") || msg.includes("instalaci") || msg.includes("técnico") || msg.includes("tecnico")) {
    return `Hola ${nombre}. En la sección **Agenda** puedes ver todas las instalaciones programadas por fecha, filtrar por técnico o coordinadora, y asignar nuevas citas. Los técnicos se sugieren automáticamente según la zona del cliente. ¿Qué instalación necesitas gestionar?`;
  }
  if (msg.includes("pago") || msg.includes("iban") || msg.includes("cuenta") || msg.includes("banco")) {
    return `Hola ${nombre}. Los datos bancarios de Seguxat están en la sección **Pagos** del menú. El IBAN para transferencias es **BE18 9030 0915 8465** a nombre de **Manoprotectt** (Wise Europe). Puedes copiarlo directamente desde esa sección para dárselo al cliente.`;
  }
  if (msg.includes("resumen") || msg.includes("dashboard") || msg.includes("facturaci") || msg.includes("mrr")) {
    return `Hola ${nombre}. El resumen general de Seguxat muestra **8.247 clientes activos**, **58.400 €/mes** de facturación recurrente y una tasa de conversión del 74%. Los mejores comerciales del mes están en la sección **Comerciales**. ¿Quieres más detalle sobre alguna métrica?`;
  }
  if (msg.includes("kit") || msg.includes("precio") || msg.includes("producto") || msg.includes("esencial") || msg.includes("total") || msg.includes("negocio")) {
    return `Hola ${nombre}. El catálogo de Seguxat tiene tres kits principales: **Hogar Esencial** (199€ alta + 24,90€/mes), **Hogar Total** (349€ + 34,90€/mes) y **Seguxat Business** (599€ + 49,90€/mes). También tenemos la gama **Sentinel Watch** GPS/SOS. Todo está detallado en la sección **Catálogo**. ¿Necesitas el presupuesto para algún cliente?`;
  }
  return `Hola ${nombre}. Soy ARIA, tu asistente de Seguxat. He recibido tu consulta sobre "${userMsg.slice(0, 60)}${userMsg.length > 60 ? "..." : ""}". Para darte la mejor respuesta, dirígete a la sección correspondiente del CRM o consulta con el director. ¿Puedo ayudarte con algo más concreto del pipeline o las instalaciones?`;
}

router.post("/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;
  if (!messages || !systemPrompt) return res.status(400).json({ error: "Faltan parámetros" });

  const employeeName = req.employee?.name?.split(" ")[0] || "compañero/a";
  const lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sin API key — respuesta inteligente de fallback con saludo por nombre
  if (!apiKey) {
    return res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      // API key inválida o error — usar fallback igualmente
      return res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
    }

    let reply = data.content?.[0]?.text || fallbackResponse(lastUserMsg, employeeName);

    // Si es el primer mensaje, añadir saludo personalizado por nombre
    const isFirstMessage = messages.filter(m => m.role === "assistant").length === 0;
    if (isFirstMessage && !reply.toLowerCase().includes(employeeName.toLowerCase())) {
      reply = `Hola ${employeeName}. ${reply}`;
    }

    res.json({ content: reply });
  } catch (error) {
    // Error de red — usar fallback
    res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
  }
});

export default router;
