import mongoose from "mongoose";

const instalacionSchema = new mongoose.Schema(
  {
    leadId:        { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
    leadName:      { type: String, required: true },
    zone:          { type: String, required: true },
    kit:           { type: String, enum: ["esencial","total","negocio"], required: true },
    techId:        { type: String, required: true },   // ID interno del técnico (t1..t30)
    techName:      { type: String, default: "" },
    techEmail:     { type: String, default: "" },
    date:          { type: String, required: true },   // "2026-06-25"
    time:          { type: String, required: true },   // "09:00"
    coordinatorId: { type: String, required: true },   // "k1" | "k2"
    coordinatorName: { type: String, default: "" },
    coordinatorEmail: { type: String, default: "" },
    clientPhone:   { type: String, default: "" },
    clientEmail:   { type: String, default: "" },
    status:        { type: String, enum: ["pendiente","confirmada","realizada","cancelada"], default: "pendiente" },
    notified:      { type: Boolean, default: false },
    notes:         { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Instalacion", instalacionSchema);
