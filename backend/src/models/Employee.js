import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Roles disponibles en el CRM de Seguxat (inspirados en la estructura de
// Securitas Direct / Verisure: venta directa, televenta, instalación y
// soporte/CRA, además del rol de dirección con acceso total).
export const ROLES = {
  DIRECTOR: "director", // acceso total: gestionar empleados, ver todo, moderar
  COMERCIAL: "comercial", // venta directa / visitas — pipeline, agenda y clientes asignados
  TELEVENTA: "televenta", // contacto telefónico de leads, primer filtro antes de pasar a comercial
  TECNICO: "tecnico", // técnico instalador — agenda de instalaciones y mantenimientos
  SOPORTE: "soporte", // soporte / CRA — atención postventa e incidencias de clientes
};

export const ROLE_LABELS = {
  [ROLES.DIRECTOR]: "Director",
  [ROLES.COMERCIAL]: "Comercial",
  [ROLES.TELEVENTA]: "Televenta",
  [ROLES.TECNICO]: "Técnico instalador",
  [ROLES.SOPORTE]: "Soporte / CRA",
};

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    done: { type: Boolean, default: false },
    dueDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: Object.values(ROLES), default: ROLES.COMERCIAL },
    zone: { type: String, default: "" }, // p.ej. "Ruzafa / Eixample"

    // Verificación en dos pasos vía Google: el empleado debe vincular su
    // cuenta de Google (debe coincidir el email) antes de poder iniciar sesión.
    googleId: { type: String, default: null },
    googleLinkedAt: { type: Date, default: null },

    active: { type: Boolean, default: true },
    suspended: { type: Boolean, default: false }, // suspensión temporal (distinta de desactivar/eliminar)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },

    // Tareas diarias asignadas por el director, visibles solo para este empleado.
    tasks: { type: [taskSchema], default: [] },
  },
  { timestamps: true }
);

employeeSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

employeeSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

// Nunca devolver el hash de la contraseña en JSON
employeeSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model("Employee", employeeSchema);
