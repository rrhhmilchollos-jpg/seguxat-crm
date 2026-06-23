import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendAriaUrgentAlert, logAriaError } from "../utils/email.js";

const router = express.Router();
router.use(requireAuth);

function fallbackResponse(userMsg, employeeName) {
  const msg = userMsg.toLowerCase();
  const nombre = employeeName || "compañero/a";
  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("hey") || msg.length < 10)
    return `¡Hola ${nombre}! 👋 Soy ARIA, tu asistente de Seguxat. Estoy aquí para ayudarte a gestionar el pipeline, revisar instalaciones y resolver cualquier duda. ¿En qué puedo ayudarte hoy?`;
  if (msg.includes("lead") || msg.includes("cliente") || msg.includes("cita"))
    return `Hola ${nombre}. Para gestionar leads y citas, ve a la sección **Citas** del menú. Puedes avanzar cualquier lead y usar "Agendar cita" para asignar comercial o técnico. ¿Qué necesitas exactamente?`;
  if (msg.includes("agenda") || msg.includes("instalaci") || msg.includes("técnico") || msg.includes("tecnico"))
    return `Hola ${nombre}. En **Agenda** ves todas las instalaciones por fecha, filtras por técnico o coordinadora y asignas nuevas citas. Los técnicos se sugieren por zona del cliente. ¿Qué instalación gestionas?`;
  if (msg.includes("pago") || msg.includes("iban") || msg.includes("cuenta") || msg.includes("banco"))
    return `Hola ${nombre}. Los datos bancarios están en **Pagos**: IBAN **BE18 9030 0915 8465**, titular **Manoprotectt** (Wise Europe). Cópialo desde esa sección para dárselo al cliente.`;
  if (msg.includes("resumen") || msg.includes("facturaci") || msg.includes("mrr"))
    return `Hola ${nombre}. Seguxat tiene **8.247 clientes activos**, **58.400 €/mes** de MRR y 74% de conversión. El detalle completo está en **Resumen**. ¿Qué métrica necesitas?`;
  if (msg.includes("kit") || msg.includes("precio") || msg.includes("producto"))
    return `Hola ${nombre}. Kits disponibles: **Hogar Esencial** 199€+24,90€/mes · **Hogar Total** 349€+34,90€/mes · **Business** 599€+49,90€/mes. Ver todo en **Catálogo**.`;
  return `Hola ${nombre}. Soy ARIA. He recibido tu consulta — "${userMsg.slice(0,60)}${userMsg.length>60?"...":""}". ¿Puedo ayudarte con el pipeline, instalaciones o catálogo de Seguxat?`;
}

router.post("/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;
  if (!messages || !systemPrompt) return res.status(400).json({ error: "Faltan parámetros" });

  const employeeName = req.employee?.name?.split(" ")[0] || "compañero/a";
  const employeeEmail = req.employee?.email || "";
  const lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sin API key — fallback silencioso + alerta urgente al director
  if (!apiKey) {
    logAriaError({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType: "ANTHROPIC_API_KEY no configurada" });
    sendAriaUrgentAlert({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType: "ANTHROPIC_API_KEY no configurada en Railway" });
    return res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system: systemPrompt, messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorType = `API Anthropic ${response.status}: ${data.error?.message || "Error desconocido"}`;
      logAriaError({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType });
      sendAriaUrgentAlert({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType });
      return res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
    }

    let reply = data.content?.[0]?.text || fallbackResponse(lastUserMsg, employeeName);

    // Primer mensaje — asegurar saludo personalizado
    const isFirst = messages.filter(m => m.role === "assistant").length === 0;
    if (isFirst && !reply.toLowerCase().includes(employeeName.toLowerCase())) {
      reply = `Hola ${employeeName}. ${reply}`;
    }

    res.json({ content: reply });

  } catch (error) {
    const errorType = `Error de red: ${error.message}`;
    logAriaError({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType });
    sendAriaUrgentAlert({ employeeName, employeeEmail, userMessage: lastUserMsg, errorType });
    res.json({ content: fallbackResponse(lastUserMsg, employeeName) });
  }
});

export default router;
