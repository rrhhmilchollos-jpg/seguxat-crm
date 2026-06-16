import express from "express";
import Employee, { ROLES } from "../models/Employee.js";
import { requireAuth } from "../middleware/auth.js";
import { onlyDirector } from "../middleware/requireRole.js";
import { sendWelcomeEmail } from "../utils/email.js";

const router = express.Router();

router.use(requireAuth);

// Listar empleados (solo director)
router.get("/", onlyDirector, async (req, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  res.json({ employees });
});

// El propio empleado consulta y marca sus tareas (no necesita ser director).
// IMPORTANTE: estas rutas "/me/..." deben declararse ANTES de las rutas
// con parámetro "/:id/..." para que Express no interprete "me" como un id.
router.get("/me/tasks", async (req, res) => {
  res.json({ tasks: req.employee.tasks });
});

router.patch("/me/tasks/:taskId", async (req, res) => {
  const { done } = req.body || {};
  const task = req.employee.tasks.find((t) => t._id.toString() === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Tarea no encontrada" });

  task.done = !!done;
  await req.employee.save();
  res.json({ tasks: req.employee.tasks });
});

/**
 * Dar de alta un nuevo empleado.
 *
 * Solo el director puede crear cuentas. La contraseña se introduce AQUÍ,
 * en este momento, desde la app ya en ejecución — nunca queda escrita en
 * el código fuente. El empleado podrá cambiarla más adelante y deberá
 * vincular su cuenta de Google la primera vez que inicie sesión (paso 2
 * de la verificación).
 *
 * Body: { name, email, password, role, zone }
 */
router.post("/", onlyDirector, async (req, res) => {
  const { name, email, password, role, zone } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }
  if (role && !Object.values(ROLES).includes(role)) {
    return res.status(400).json({ error: "Rol no válido" });
  }

  const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ error: "Ya existe un empleado con ese email" });
  }

  const employee = await Employee.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash: await Employee.hashPassword(password),
    role: role || ROLES.COMERCIAL,
    zone: zone || "",
    createdBy: req.employee._id,
  });

  const emailResult = await sendWelcomeEmail({
    to: employee.email,
    name: employee.name,
    email: employee.email,
    password,
  });

  res.status(201).json({ employee, emailSent: emailResult.sent });
});

// Suspender / reactivar temporalmente (distinto de desactivar permanentemente)
router.patch("/:id/suspend", onlyDirector, async (req, res) => {
  const { suspended } = req.body || {};
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  if (employee.role === ROLES.DIRECTOR && employee._id.equals(req.employee._id) && suspended) {
    return res.status(400).json({ error: "No puedes suspender tu propia cuenta de director" });
  }

  employee.suspended = !!suspended;
  await employee.save();
  res.json({ employee });
});

// Eliminar un empleado definitivamente
router.delete("/:id", onlyDirector, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  if (employee.role === ROLES.DIRECTOR && employee._id.equals(req.employee._id)) {
    return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de director" });
  }

  await Employee.deleteOne({ _id: employee._id });
  res.json({ ok: true });
});

// Cambiar rol
router.patch("/:id/role", onlyDirector, async (req, res) => {
  const { role } = req.body || {};
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ error: "Rol no válido" });
  }

  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  employee.role = role;
  await employee.save();
  res.json({ employee });
});

// Restablecer contraseña de un empleado (el director la introduce aquí mismo)
// y se reenvía automáticamente por correo (cubre tanto "olvidé mi contraseña"
// como un reseteo proactivo por parte del director).
router.post("/:id/reset-password", onlyDirector, async (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  employee.passwordHash = await Employee.hashPassword(password);
  await employee.save();

  const emailResult = await sendWelcomeEmail({
    to: employee.email,
    name: employee.name,
    email: employee.email,
    password,
  });

  res.json({ ok: true, emailSent: emailResult.sent });
});

/**
 * Tareas diarias asignadas por el director a un empleado concreto.
 * Solo el director gestiona la lista (crear/marcar/eliminar); el propio
 * empleado las consulta a través de GET /api/employees/me/tasks.
 */
router.get("/:id/tasks", onlyDirector, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });
  res.json({ tasks: employee.tasks });
});

router.post("/:id/tasks", onlyDirector, async (req, res) => {
  const { title, description, dueDate } = req.body || {};
  if (!title) return res.status(400).json({ error: "El título de la tarea es obligatorio" });

  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  employee.tasks.push({
    title,
    description: description || "",
    dueDate: dueDate || null,
    createdBy: req.employee._id,
  });
  await employee.save();
  res.status(201).json({ tasks: employee.tasks });
});

router.delete("/:id/tasks/:taskId", onlyDirector, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

  employee.tasks = employee.tasks.filter((t) => t._id.toString() !== req.params.taskId);
  await employee.save();
  res.json({ tasks: employee.tasks });
});

export default router;
