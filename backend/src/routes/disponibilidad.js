/**
 * disponibilidad.js — Sistema inteligente de disponibilidad de técnicos
 * 
 * La IA calcula si un técnico está libre u ocupado en base a:
 * - Sus instalaciones confirmadas hoy (mínimo 2h por instalación)
 * - Complejidad del kit instalado (esencial=2h, total=3h, negocio=4h+)
 * - Si trabajan en pareja (se dividen el tiempo)
 * - Hora actual vs horario laboral (08:00-20:00)
 */
import express from "express";
import Instalacion from "../models/Instalacion.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// Duración en horas por kit
const KIT_HORAS = { esencial: 2, total: 3, negocio: 4.5 };
const JORNADA_INICIO = 8; // 08:00
const JORNADA_FIN = 20;   // 20:00

function calcularDisponibilidad(instalacionesHoy, horaActual, techId) {
  // Instalaciones de este técnico hoy
  const misInstalaciones = instalacionesHoy.filter(i => 
    i.techId === techId && 
    (i.status === "confirmada" || i.status === "pendiente")
  );

  if (misInstalaciones.length === 0) {
    return { available: true, reason: "Sin instalaciones hoy", horasOcupadas: 0, proximaLibre: null };
  }

  // Calcular bloques de tiempo ocupados
  let horasOcupadasTotal = 0;
  let ultimaInstalacionFin = JORNADA_INICIO;

  for (const inst of misInstalaciones.sort((a,b) => a.time?.localeCompare(b.time))) {
    const [h, m] = (inst.time || "09:00").split(":").map(Number);
    const inicio = h + m/60;
    const duracion = KIT_HORAS[inst.kit] || 2;
    // Si trabajan en pareja, reducir un 30% el tiempo
    const esPareja = inst.pairTechId ? true : false;
    const duracionReal = esPareja ? duracion * 0.7 : duracion;
    const fin = inicio + duracionReal;
    
    horasOcupadasTotal += duracionReal;
    if (fin > ultimaInstalacionFin) ultimaInstalacionFin = fin;
  }

  const horasLibresHoy = Math.max(0, JORNADA_FIN - JORNADA_INICIO - horasOcupadasTotal);
  
  // ¿Está ocupado ahora mismo?
  let ocupadoAhora = false;
  let proximaLibre = null;

  for (const inst of misInstalaciones) {
    const [h, m] = (inst.time || "09:00").split(":").map(Number);
    const inicio = h + m/60;
    const duracion = KIT_HORAS[inst.kit] || 2;
    const esPareja = inst.pairTechId ? true : false;
    const fin = inicio + (esPareja ? duracion * 0.7 : duracion);

    if (horaActual >= inicio && horaActual < fin) {
      ocupadoAhora = true;
      const finH = Math.floor(fin);
      const finM = Math.round((fin - finH) * 60);
      proximaLibre = `${String(finH).padStart(2,"0")}:${String(finM).padStart(2,"0")}h`;
      break;
    }
  }

  // Si hay hueco de al menos 2h antes del fin de jornada
  const tieneHueco = horasLibresHoy >= 2 && horaActual < (JORNADA_FIN - 2);

  return {
    available: !ocupadoAhora && tieneHueco,
    ocupadoAhora,
    reason: ocupadoAhora
      ? `En instalación hasta ${proximaLibre}`
      : tieneHueco
        ? `Libre — ${Math.floor(horasLibresHoy)}h disponibles hoy`
        : "Sin hueco suficiente hoy",
    horasOcupadas: Math.round(horasOcupadasTotal * 10) / 10,
    horasLibres: Math.round(horasLibresHoy * 10) / 10,
    proximaLibre,
    instalacionesHoy: misInstalaciones.length,
  };
}

// GET /api/disponibilidad/:techId — disponibilidad de un técnico
router.get("/:techId", async (req, res) => {
  try {
    const { techId } = req.params;
    const hoy = new Date().toISOString().split("T")[0];
    const horaActual = new Date().getHours() + new Date().getMinutes()/60;
    
    const instalacionesHoy = await Instalacion.find({ date: hoy });
    const disp = calcularDisponibilidad(instalacionesHoy, horaActual, techId);
    
    res.json(disp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/disponibilidad — disponibilidad de todos los técnicos
router.get("/", async (req, res) => {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const horaActual = new Date().getHours() + new Date().getMinutes()/60;
    const instalacionesHoy = await Instalacion.find({ date: hoy });

    // Obtener IDs únicos de técnicos desde instalaciones
    const techIds = [...new Set(instalacionesHoy.map(i => i.techId))];
    
    const result = {};
    for (const techId of techIds) {
      result[techId] = calcularDisponibilidad(instalacionesHoy, horaActual, techId);
    }

    res.json({ disponibilidad: result, fecha: hoy, hora: `${Math.floor(horaActual)}:${String(Math.round((horaActual%1)*60)).padStart(2,"0")}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export { calcularDisponibilidad };
export default router;
