import express from "express";
import Instalacion from "../models/Instalacion.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// GET — listar todas (director ve todo, coordinadora ve las suyas)
router.get("/", async (req, res) => {
  try {
    const filter = (req.employee.role === "director" || req.employee.role === "televenta") ? {} : { coordinatorEmail: req.employee.email };
    const instalaciones = await Instalacion.find(filter).sort({ date: 1, time: 1 });
    res.json({ instalaciones });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST — crear nueva instalación/cita
router.post("/", async (req, res) => {
  try {
    const inst = await Instalacion.create(req.body);
    res.status(201).json({ instalacion: inst });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH — actualizar estado
router.patch("/:id", async (req, res) => {
  try {
    const inst = await Instalacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inst) return res.status(404).json({ error: "No encontrada" });
    res.json({ instalacion: inst });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE — cancelar
router.delete("/:id", async (req, res) => {
  try {
    await Instalacion.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
