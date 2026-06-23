import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Workflow, CalendarDays, Users, Package, Trophy,
  Search, MapPin, Phone, Plus, TrendingUp, Clock, ShieldCheck,
  ArrowRight, ArrowLeft, X, CheckCircle2, Building2, Bell,
  LogOut, UserCog, Mail, Lock, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, FileSignature, Wrench, Eye, Filter, Download,
  MoreHorizontal, Zap, Target, Activity, Star, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Area, AreaChart,
} from "recharts";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = "https://seguxat-crm-production.up.railway.app/api";
const GOOGLE_CLIENT_ID = "560128973845-o2otvdgfboc3igncs9rovd506bt64l5e.apps.googleusercontent.com";

// ─── DATOS BASE ─────────────────────────────────────────────────────────────
const REPS = [
  { id: "r1", name: "Laura Gómez",  initials: "LG", zone: "Centro / Ciutat Vella",    color: "bg-amber-500"  },
  { id: "r2", name: "Marc Ferrer",  initials: "MF", zone: "Ruzafa / Eixample",         color: "bg-teal-600"   },
  { id: "r3", name: "Sara Beltrán", initials: "SB", zone: "Benimaclet / Algirós",      color: "bg-sky-600"    },
  { id: "r4", name: "Iván Soler",   initials: "IS", zone: "Patraix / Jesús",           color: "bg-violet-600" },
];

const STAGES = [
  { id: "nuevo",       label: "Nuevo lead",             color: "bg-slate-400"   },
  { id: "contactado",  label: "Contactado",             color: "bg-sky-500"     },
  { id: "cita",        label: "Cita agendada",          color: "bg-amber-500"   },
  { id: "visita",      label: "Visita realizada",       color: "bg-orange-500"  },
  { id: "propuesta",   label: "Propuesta enviada",      color: "bg-violet-500"  },
  { id: "contrato",    label: "Contrato firmado",       color: "bg-teal-600"    },
  { id: "instalacion", label: "Instalación programada", color: "bg-emerald-600" },
];

const KITS = {
  esencial: { name: "Hogar Esencial", alta: 199,  cuota: 24.9, desc: "Central + 2 sensores apertura + 1 detector movimiento + sirena + app" },
  total:    { name: "Hogar Total",    alta: 349,  cuota: 34.9, desc: "Central + 4 sensores + 2 cámaras HD + sirena ext. + detector humo + videoverificación" },
  negocio:  { name: "Negocio",        alta: 599,  cuota: 49.9, desc: "Central + sensores perimetrales + cámaras HD + botón pánico + respuesta prioritaria" },
};

const KIT_FEATURES = {
  esencial: [
    "Central de alarma con batería de respaldo 24h",
    "2 sensores de apertura puerta/ventana",
    "1 detector de movimiento por infrarrojos",
    "Sirena interior 90dB",
    "App móvil de control y notificaciones",
    "Conexión a Central Receptora de Alarmas 24/7",
  ],
  total: [
    "Central de alarma con batería de respaldo 24h",
    "4 sensores de apertura puerta/ventana",
    "2 cámaras HD interior/exterior con videoverificación",
    "Sirena exterior autoalimentada con flash",
    "Detector de humo conectado",
    "App móvil con histórico de eventos y clips de vídeo",
    "Conexión a Central Receptora de Alarmas 24/7 con verificación por vídeo",
  ],
  negocio: [
    "Central de alarma profesional multi-zona",
    "Sensores perimetrales para accesos y escaparates",
    "Cámaras HD con grabación en la nube",
    "Botón de pánico para personal",
    "Respuesta prioritaria de la Central ante alertas",
    "Gestión de horarios de apertura/cierre del negocio",
    "Informes mensuales de actividad para el titular",
  ],
};

const SENTINEL_MODELS = [
  {
    id: "sentinel-classic", name: "Sentinel Classic", price: 89, cuota: 9.9,
    desc: "El reloj GPS y botón SOS original de Seguxat.",
    features: ["GPS + red móvil 4G","Botón SOS de doble pulsación","Altavoz y micrófono para llamada bidireccional","Autonomía hasta 5 días","Resistencia IP67"],
  },
  {
    id: "sentinel-active", name: "Sentinel Active", price: 119, cuota: 12.9,
    desc: "Para deportistas y profesionales con detección de caídas.",
    features: ["Todo lo de Sentinel Classic","Detección automática de caídas","Resistencia a golpes reforzada","Modo 'ruta segura' con seguimiento en tiempo real"],
  },
  {
    id: "sentinel-kids", name: "Sentinel Kids", price: 79, cuota: 8.9,
    desc: "Localización y botón SOS para niños, con zonas seguras.",
    features: ["GPS de alta precisión","Botón SOS único y sencillo","Zonas seguras con aviso de entrada/salida","Sin acceso a internet ni redes sociales"],
  },
];

const ADDONS = [
  { name: "Cámara HD adicional",              price: 79, cuota: 4.9 },
  { name: "Sensor de apertura adicional",     price: 29, cuota: 0   },
  { name: "Detector de humo adicional",       price: 45, cuota: 0   },
  { name: "Mando a distancia armado/desarmado",price: 25, cuota: 0  },
  { name: "Llavero de proximidad",            price: 19, cuota: 0   },
];

const INITIAL_LEADS = [
  { id:1,  name:"Carmen Ibáñez",   zone:"El Carmen",    phone:"612 345 001", kit:"esencial", source:"Puerta a puerta", rep:"r1", stage:"nuevo",       days:1 },
  { id:2,  name:"Roberto Sanz",    zone:"Camins al Grau",phone:"612 345 002",kit:"total",    source:"Web",             rep:"r3", stage:"nuevo",       days:2 },
  { id:3,  name:"Almudena Pla",    zone:"Cabanyal",     phone:"612 345 003", kit:"esencial", source:"Referido",        rep:"r2", stage:"nuevo",       days:1 },
  { id:4,  name:"Bar El Rincón",   zone:"Ruzafa",       phone:"612 345 004", kit:"negocio",  source:"Campaña verano",  rep:"r2", stage:"nuevo",       days:3 },
  { id:5,  name:"Federico Llorca", zone:"Patraix",      phone:"612 345 005", kit:"esencial", source:"Puerta a puerta", rep:"r4", stage:"contactado",  days:2 },
  { id:6,  name:"Marisa Donat",    zone:"Benimaclet",   phone:"612 345 006", kit:"total",    source:"Escudo Vecinal",  rep:"r3", stage:"contactado",  days:4 },
  { id:7,  name:"Quique Navarro",  zone:"Jesús",        phone:"612 345 007", kit:"esencial", source:"Referido",        rep:"r4", stage:"contactado",  days:1 },
  { id:8,  name:"Pilar Esteve",    zone:"Algirós",      phone:"612 345 008", kit:"total",    source:"Web",             rep:"r3", stage:"cita",        days:1, cita:"Hoy · 17:30" },
  { id:9,  name:"Vicente Roig",    zone:"Ciutat Vella", phone:"612 345 009", kit:"esencial", source:"Puerta a puerta", rep:"r1", stage:"cita",        days:3, cita:"Mañana · 10:00" },
  { id:10, name:"Farmacia Soler",  zone:"Eixample",     phone:"612 345 010", kit:"negocio",  source:"Referido",        rep:"r2", stage:"cita",        days:2, cita:"Jueves · 12:00" },
  { id:11, name:"Teresa Bofill",   zone:"Pla del Real", phone:"612 345 011", kit:"total",    source:"Campaña verano",  rep:"r3", stage:"visita",      days:2 },
  { id:12, name:"Jaume Tormo",     zone:"Jesús",        phone:"612 345 012", kit:"esencial", source:"Puerta a puerta", rep:"r4", stage:"visita",      days:5 },
  { id:13, name:"Inma Calatayud",  zone:"Ruzafa",       phone:"612 345 013", kit:"total",    source:"Referido",        rep:"r2", stage:"propuesta",   days:3 },
  { id:14, name:"Óscar Membrillo", zone:"Centro",       phone:"612 345 014", kit:"esencial", source:"Escudo Vecinal",  rep:"r1", stage:"propuesta",   days:1 },
  { id:15, name:"Gimnasio Pulso",  zone:"Algirós",      phone:"612 345 015", kit:"negocio",  source:"Web",             rep:"r3", stage:"contrato",    days:1 },
  { id:16, name:"Lola Ferrandis",  zone:"Benimaclet",   phone:"612 345 016", kit:"total",    source:"Referido",        rep:"r3", stage:"instalacion", days:2, cita:"Viernes · 09:00" },
];

const CUSTOMERS = [
  { id:1, name:"Mari Carmen Soriano",    zone:"Ruzafa, Valencia",     kit:"total",    since:"03/2026", status:"Activo",                next:"Revisión 09/2026",  rep:"r2" },
  { id:2, name:"Antonio Belda",          zone:"Benimaclet, Valencia", kit:"esencial", since:"01/2026", status:"Activo",                next:"Revisión 07/2026",  rep:"r3" },
  { id:3, name:"Restaurante La Pepica",  zone:"Cabanyal, Valencia",   kit:"negocio",  since:"11/2025", status:"Activo",                next:"Revisión 11/2026",  rep:"r2" },
  { id:4, name:"Encarna Tortosa",        zone:"Patraix, Valencia",    kit:"esencial", since:"02/2026", status:"Pendiente instalación", next:"Instalación 18/06", rep:"r4" },
  { id:5, name:"Familia Gironés",        zone:"Algirós, Valencia",    kit:"total",    since:"05/2026", status:"Activo",                next:"Revisión 11/2026",  rep:"r3" },
  { id:6, name:"Ferretería Casanova",    zone:"Eixample, Valencia",   kit:"negocio",  since:"04/2026", status:"Activo",                next:"Revisión 10/2026",  rep:"r2" },
  { id:7, name:"Lola Ferrandis",         zone:"Benimaclet, Valencia", kit:"total",    since:"06/2026", status:"Pendiente instalación", next:"Instalación 19/06", rep:"r3" },
  { id:8, name:"Manuel Peris",           zone:"Jesús, Valencia",      kit:"esencial", since:"12/2025", status:"Activo",                next:"Revisión 12/2026",  rep:"r4" },
];

const VENTAS_MES = [
  { mes:"Ene", instalaciones:8,  citas:14 },
  { mes:"Feb", instalaciones:11, citas:18 },
  { mes:"Mar", instalaciones:9,  citas:16 },
  { mes:"Abr", instalaciones:14, citas:22 },
  { mes:"May", instalaciones:12, citas:20 },
  { mes:"Jun", instalaciones:16, citas:26 },
];

const LEADS_ORIGEN = [
  { name:"Puerta a puerta", value:35, color:"#f59e0b" },
  { name:"Referidos",       value:25, color:"#0d9488" },
  { name:"Web",             value:20, color:"#6366f1" },
  { name:"Escudo Vecinal",  value:12, color:"#0284c7" },
  { name:"Campañas",        value:8,  color:"#ec4899" },
];

const REP_PERF = [
  { rep:"r1", ventas:9,  objetivo:10 },
  { rep:"r2", ventas:13, objetivo:10 },
  { rep:"r3", ventas:11, objetivo:10 },
  { rep:"r4", ventas:7,  objetivo:10 },
];

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const ZONAS = ["Valencia Norte","Valencia Sur","Valencia Centro","Burjassot","Paterna","Mislata","Torrent","Paiporta","Alboraya","Godella","Bétera","Manises"];
const TIPOS_CITA = ["Visita comercial","Instalación sistema","Firma contrato","Visita técnica","Revisión equipo","Demostración producto"];

// ─── AGENTS CONFIG ──────────────────────────────────────────────────────────
const AGENTS_CFG = {
  karla: {
    name:"Karla Romero", role:"Agente Televentas", initials:"KR",
    bgClass:"bg-violet-600", ringColor:"ring-violet-400",
    badgeBg:"bg-violet-50", badgeText:"text-violet-700", badgeBorder:"border-violet-200",
    accentHex:"#7c3aed", lightHex:"#ede9fe", darkHex:"#3b0764",
    slotBg:"bg-violet-50", slotBorder:"border-violet-200", slotText:"text-violet-800",
    saveBg:"bg-violet-600 hover:bg-violet-700",
  },
  maria: {
    name:"María González", role:"Agente Televentas", initials:"MG",
    bgClass:"bg-teal-600", ringColor:"ring-teal-400",
    badgeBg:"bg-teal-50", badgeText:"text-teal-700", badgeBorder:"border-teal-200",
    accentHex:"#0d9488", lightHex:"#ccfbf1", darkHex:"#042f2e",
    slotBg:"bg-teal-50", slotBorder:"border-teal-200", slotText:"text-teal-800",
    saveBg:"bg-teal-600 hover:bg-teal-700",
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function repById(id) { return REPS.find(r => r.id === id); }

function generateAgentSchedule(agent) {
  const data = {};
  const seeds = { karla: 7, maria: 13 };
  const seed = seeds[agent];
  const tipos = TIPOS_CITA;
  const clientes = ["García Martínez","López Ruiz","Fernández Díaz","Torres Sánchez","Martín Pérez","Navarro Gil","Romero Cruz","Vidal Mora","Pérez Cano","Blasco Ferri"];
  for (let m = 5; m <= 11; m++) {
    const daysInMonth = new Date(2025, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(2025, m, d);
      const dow = (dt.getDay() + 6) % 7;
      if (dow >= 5) continue;
      const s = seed * (m + 1) * d;
      const numSlots = 2 + (s % 4);
      const used = new Set();
      const slots = [];
      for (let i = 0; i < numSlots; i++) {
        const hi = (s * (i + 3) + i * 17) % HOURS.length;
        if (used.has(hi)) continue;
        used.add(hi);
        slots.push({
          hora: HOURS[hi],
          tipo: tipos[(s * (i + 1)) % tipos.length],
          zona: ZONAS[(s + i * 3) % ZONAS.length],
          cliente: clientes[(s + i * 5) % clientes.length],
          locked: true,
          ref: `SGX-2025-${String(m * 100 + d * 10 + i).padStart(4,"0")}`,
        });
      }
      if (slots.length) data[`2025-${m}-${d}`] = slots;
    }
  }
  return data;
}

const PRELOADED = { karla: generateAgentSchedule("karla"), maria: generateAgentSchedule("maria") };

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function Avatar({ rep, size = "w-8 h-8" }) {
  return (
    <div className={`${size} ${rep.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {rep.initials}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</div>
        <div className="text-sm text-slate-500 mt-1 truncate">{label}</div>
        {sub && <div className="text-xs text-teal-600 mt-1 font-medium">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-600"}`}>
          {trend >= 0 ? "+" : ""}{trend}%
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = {
    "Activo":                "bg-teal-50 text-teal-700 border-teal-200",
    "Pendiente instalación": "bg-amber-50 text-amber-700 border-amber-200",
    "Suspendido":            "bg-red-50 text-red-600 border-red-200",
    "Inactivo":              "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${s[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === "Activo" ? "bg-teal-500" : status === "Pendiente instalación" ? "bg-amber-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function DashboardView() {
  const totalLeadsActivos = INITIAL_LEADS.filter(l => l.stage !== "instalacion").length;
  const citasSemana = INITIAL_LEADS.filter(l => l.stage === "cita").length;
  const mrr = CUSTOMERS.filter(c => c.status === "Activo").reduce((acc, c) => acc + KITS[c.kit].cuota, 0);
  const convRate = Math.round((INITIAL_LEADS.filter(l => ["contrato","instalacion"].includes(l.stage)).length / INITIAL_LEADS.length) * 100);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Leads activos" value={totalLeadsActivos} sub="+4 esta semana" icon={Workflow}    accent="bg-slate-800" trend={12} />
        <StatCard label="Citas agendadas" value={citasSemana}    sub="Esta semana"    icon={CalendarDays} accent="bg-amber-500" trend={8}  />
        <StatCard label="Conversión lead→contrato" value={`${convRate}%`} sub="Últimos 30 días" icon={TrendingUp} accent="bg-teal-600" trend={3} />
        <StatCard label="MRR activo" value={`${mrr.toFixed(0)} €`} sub={`${CUSTOMERS.filter(c=>c.status==="Activo").length} clientes`} icon={ShieldCheck} accent="bg-violet-600" trend={6} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Instalaciones y citas por mes" sub="Últimos 6 meses" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VENTAS_MES}>
                <defs>
                  <linearGradient id="gInstall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gCitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip cursor={{ fill:"#f8fafc" }} contentStyle={{ borderRadius:10, border:"1px solid #e2e8f0", fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,.06)" }} />
                <Area type="monotone" dataKey="instalaciones" stroke="#f59e0b" strokeWidth={2} fill="url(#gInstall)" name="Instalaciones" />
                <Area type="monotone" dataKey="citas"         stroke="#0d9488" strokeWidth={2} fill="url(#gCitas)"   name="Citas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-amber-500 rounded-full inline-block" /> Instalaciones</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-teal-600 rounded-full inline-block" /> Citas</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Leads por origen" sub="Últimos 30 días" />
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LEADS_ORIGEN} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                  {LEADS_ORIGEN.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:8, border:"1px solid #e2e8f0", fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-1">
            {LEADS_ORIGEN.map(o => (
              <div key={o.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                  <span className="text-slate-600">{o.name}</span>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">{o.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Ranking comercial — junio" />
          <div className="space-y-4">
            {[...REP_PERF].sort((a,b)=>b.ventas-a.ventas).map((p,i)=>{
              const rep = repById(p.rep);
              const pct = Math.min(100, Math.round((p.ventas/p.objetivo)*100));
              const medals = ["🥇","🥈","🥉",""];
              return (
                <div key={p.rep} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{medals[i] || i+1}</span>
                  <Avatar rep={rep} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-900">{rep.name}</span>
                      <span className="text-slate-400 tabular-nums text-xs">{p.ventas}/{p.objetivo} ventas</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct>=100?"bg-teal-500":"bg-amber-500"}`} style={{width:`${pct}%`}} />
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${pct>=100?"bg-teal-50 text-teal-700":"bg-amber-50 text-amber-700"}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Próximas citas" sub="Hoy y mañana" />
          <div className="space-y-2">
            {INITIAL_LEADS.filter(l=>l.cita).slice(0,5).map((l,i)=>{
              const rep = repById(l.rep);
              const typeColors = { "cita":"bg-amber-100 text-amber-700", "instalacion":"bg-teal-100 text-teal-700" };
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="text-xs font-bold text-slate-600 tabular-nums w-24 shrink-0">{l.cita}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{l.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/>{l.zone}</div>
                  </div>
                  <Avatar rep={rep} size="w-7 h-7" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PIPELINE ──────────────────────────────────────────────────────────────
function NewLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:"", zone:"", phone:"", kit:"esencial", source:"Puerta a puerta", rep:"r1" });
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">Nuevo lead</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre / negocio</label>
            <input value={form.name} onChange={e=>f("name",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" placeholder="Ej: Manuela Ferri" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</label>
              <input value={form.zone} onChange={e=>f("zone",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" placeholder="Ej: Ruzafa" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teléfono</label>
              <input value={form.phone} onChange={e=>f("phone",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" placeholder="6XX XXX XXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interés</label>
              <select value={form.kit} onChange={e=>f("kit",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50">
                {Object.entries(KITS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Comercial</label>
              <select value={form.rep} onChange={e=>f("rep",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50">
                {REPS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen</label>
            <select value={form.source} onChange={e=>f("source",e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50">
              {["Puerta a puerta","Referido","Web","Escudo Vecinal","Campaña verano"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={()=>{ if(form.name&&form.zone){onAdd(form);onClose();} }} className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl py-2.5 text-sm font-bold text-white">Crear lead</button>
        </div>
      </div>
    </div>
  );
}

function LeadPanel({ lead, onClose, onMove }) {
  const rep = repById(lead.rep);
  const kit = KITS[lead.kit];
  const stageIdx = STAGES.findIndex(s => s.id === lead.stage);
  return (
    <div className="fixed inset-y-0 right-0 w-88 bg-white border-l border-slate-100 shadow-2xl p-6 flex flex-col z-20" style={{width:340}}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${STAGES[stageIdx].color}`}>{STAGES[stageIdx].label}</span>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
      </div>
      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        {lead.kit==="negocio" && <Building2 className="w-5 h-5 text-slate-400"/>}{lead.name}
      </h3>
      <div className="text-sm text-slate-500 mt-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{lead.zone}, Valencia</div>
      <div className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/>{lead.phone}</div>

      <div className="mt-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 space-y-2.5">
        {[["Producto","Kit",kit.name],["Alta + cuota","Precio",`${kit.alta} € + ${kit.cuota.toFixed(2)}€/mes`],["Origen","Origen",lead.source],["En esta fase","Días",`${lead.days} día${lead.days!==1?"s":""}`]].map(([label,,val])=>(
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900">{val}</span>
          </div>
        ))}
        {lead.cita && (
          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
            <span className="text-slate-500">Próxima cita</span>
            <span className="font-semibold text-teal-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{lead.cita}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Comercial asignado</div>
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
          <Avatar rep={rep} size="w-10 h-10"/>
          <div><div className="text-sm font-semibold text-slate-900">{rep.name}</div><div className="text-xs text-slate-500">{rep.zone}</div></div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Flujo de etapas</div>
        <div className="flex gap-1">
          {STAGES.map((s,i)=>(
            <div key={s.id} className={`flex-1 h-1.5 rounded-full ${i<=stageIdx?"bg-amber-400":"bg-slate-200"}`}/>
          ))}
        </div>
        <div className="text-xs text-slate-400 mt-1">{stageIdx+1} de {STAGES.length} etapas</div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
        <button disabled={stageIdx===0} onClick={()=>onMove(lead.id,-1)} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 disabled:opacity-30 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4"/> Atrás
        </button>
        <button disabled={stageIdx===STAGES.length-1} onClick={()=>onMove(lead.id,1)} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-30">
          Avanzar <ArrowRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}

function PipelineView() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  function moveStage(id,dir) {
    setLeads(prev=>prev.map(l=>{
      if(l.id!==id) return l;
      const idx=STAGES.findIndex(s=>s.id===l.stage);
      return {...l, stage:STAGES[Math.min(STAGES.length-1,Math.max(0,idx+dir))].id, days:0};
    }));
    setSelected(sel=>sel&&sel.id===id?{...sel,stage:STAGES[Math.min(STAGES.length-1,Math.max(0,STAGES.findIndex(s=>s.id===sel.stage)+dir))].id,days:0}:sel);
  }
  function addLead(form) {
    setLeads(prev=>[...prev,{id:Math.max(...prev.map(l=>l.id))+1,...form,stage:"nuevo",days:0}]);
  }

  const filtered = leads.filter(l=>!search||l.name.toLowerCase().includes(search.toLowerCase())||l.zone.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-500">{filtered.length} leads</span>
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2">
            <Plus className="w-4 h-4"/> Nuevo lead
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 flex-1">
        {STAGES.map(stage=>{
          const items = filtered.filter(l=>l.stage===stage.id);
          const value = items.reduce((acc,l)=>acc+KITS[l.kit].cuota,0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-60 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}/>
                <h3 className="text-sm font-bold text-slate-700 flex-1">{stage.label}</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1" style={{maxHeight:"calc(100vh - 270px)"}}>
                {items.map(lead=>{
                  const rep = repById(lead.rep);
                  return (
                    <button key={lead.id} onClick={()=>setSelected(lead)}
                      className="w-full text-left bg-white border border-slate-100 rounded-2xl p-3 hover:border-amber-300 hover:shadow-md transition-all group">
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-1.5 mb-1">
                        {lead.kit==="negocio"&&<Building2 className="w-3.5 h-3.5 text-slate-400"/>}{lead.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3"/>{lead.zone}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{KITS[lead.kit].name}</span>
                        <Avatar rep={rep} size="w-6 h-6"/>
                      </div>
                      {lead.cita&&<div className="text-xs text-teal-600 mt-2 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg"><Clock className="w-3 h-3"/>{lead.cita}</div>}
                    </button>
                  );
                })}
                {items.length===0&&<div className="text-xs text-slate-300 text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">Sin leads</div>}
              </div>
              <div className="text-xs text-slate-400 mt-2 tabular-nums font-medium">{value.toFixed(2).replace(".",",")} €/mes pot.</div>
            </div>
          );
        })}
      </div>
      {selected&&<LeadPanel lead={selected} onClose={()=>setSelected(null)} onMove={moveStage}/>}
      {showModal&&<NewLeadModal onClose={()=>setShowModal(false)} onAdd={addLead}/>}
    </div>
  );
}

// ─── AGENDA AVANZADA ────────────────────────────────────────────────────────
function AgendaView() {
  const [activeAgent, setActiveAgent] = useState("karla");
  const [months, setMonths] = useState({ karla:5, maria:5 });
  const [selected, setSelected] = useState({ karla:null, maria:null });
  const [custom, setCustom] = useState({ karla:{}, maria:{} });
  const [showForm, setShowForm] = useState({ karla:false, maria:false });
  const [form, setForm] = useState({ hora:"08:00", tipo:"Visita comercial", cliente:"", zona:"Valencia Norte", direccion:"", telefono:"", ref:"" });
  const [viewMode, setViewMode] = useState("month"); // month | week

  const cfg = AGENTS_CFG[activeAgent];
  const m = months[activeAgent];
  const sel = selected[activeAgent];

  function getSlots(agent, mo, d) {
    const key = `2025-${mo}-${d}`;
    return [...(PRELOADED[agent][key]||[]), ...(custom[agent][key]||[])];
  }

  function navMonth(dir) {
    setMonths(prev=>({ ...prev, [activeAgent]: Math.max(5, Math.min(11, prev[activeAgent]+dir)) }));
    setSelected(prev=>({...prev,[activeAgent]:null}));
  }

  function selectDay(d) {
    const dt = new Date(2025, m, d);
    if((dt.getDay()+6)%7>=5) return;
    setSelected(prev=>({...prev,[activeAgent]:d}));
    setShowForm(prev=>({...prev,[activeAgent]:false}));
  }

  function saveSlot() {
    if(!form.cliente.trim()) return;
    const key = `2025-${m}-${sel}`;
    setCustom(prev=>({
      ...prev,
      [activeAgent]: {
        ...prev[activeAgent],
        [key]: [...(prev[activeAgent][key]||[]), {...form, locked:false}]
      }
    }));
    setShowForm(prev=>({...prev,[activeAgent]:false}));
    setForm({ hora:"08:00", tipo:"Visita comercial", cliente:"", zona:"Valencia Norte", direccion:"", telefono:"", ref:"" });
  }

  // Calendar render
  const firstDow = (new Date(2025, m, 1).getDay()+6)%7;
  const daysInMonth = new Date(2025, m+1, 0).getDate();

  const monthStats = (() => {
    let totalCitas=0, totalLibres=0, tipos={};
    for(let d=1;d<=daysInMonth;d++){
      const dt=new Date(2025,m,d); if((dt.getDay()+6)%7>=5) continue;
      const slots=getSlots(activeAgent,m,d);
      totalCitas+=slots.length;
      totalLibres+=(HOURS.length-slots.length);
      slots.forEach(s=>{ tipos[s.tipo]=(tipos[s.tipo]||0)+1; });
    }
    return {totalCitas,totalLibres,tipos};
  })();

  const tipoIcon = (tipo) => {
    if(tipo.includes("Instal")) return <Wrench className="w-3.5 h-3.5"/>;
    if(tipo.includes("Firma")) return <FileSignature className="w-3.5 h-3.5"/>;
    if(tipo.includes("Revisión")) return <RefreshCw className="w-3.5 h-3.5"/>;
    return <Eye className="w-3.5 h-3.5"/>;
  };

  const tipoColor = (tipo) => {
    if(tipo.includes("Instal")) return "bg-blue-100 text-blue-700 border-blue-200";
    if(tipo.includes("Firma")) return "bg-amber-100 text-amber-700 border-amber-200";
    if(tipo.includes("Revisión")) return "bg-purple-100 text-purple-700 border-purple-200";
    if(tipo.includes("Demostración")) return "bg-pink-100 text-pink-700 border-pink-200";
    return "bg-teal-100 text-teal-700 border-teal-200";
  };

  const chipColor = (tipo) => {
    if(tipo.includes("Instal")) return "bg-blue-500";
    if(tipo.includes("Firma")) return "bg-amber-500";
    if(tipo.includes("Revisión")) return "bg-purple-500";
    return "bg-teal-500";
  };

  const selSlots = sel ? getSlots(activeAgent, m, sel) : [];
  const isFormOpen = showForm[activeAgent];

  return (
    <div className="space-y-4">
      {/* Agent selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
          {Object.entries(AGENTS_CFG).map(([key,c])=>(
            <button key={key} onClick={()=>setActiveAgent(key)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeAgent===key?"bg-slate-900 text-white shadow-sm":"text-slate-500 hover:text-slate-900"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${c.bgClass}`}>{c.initials}</span>
              {c.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{MONTHS[m]} 2025</span>
          <button onClick={()=>navMonth(-1)} disabled={m<=5} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
          <button onClick={()=>navMonth(1)} disabled={m>=11} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 shadow-sm"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Citas este mes", val:monthStats.totalCitas, icon:CalendarDays, color:"text-"+activeAgent==="karla"?"violet-600":"teal-600", bg:"bg-slate-50" },
          { label:"Huecos libres",  val:monthStats.totalLibres, icon:Clock, color:"text-teal-600", bg:"bg-teal-50" },
          { label:"Días hábiles",   val:Array.from({length:daysInMonth},(_,i)=>i+1).filter(d=>(new Date(2025,m,d).getDay()+6)%7<5).length, icon:Activity, color:"text-slate-600", bg:"bg-slate-50" },
          { label:"Bloques/día",    val:HOURS.length, icon:Zap, color:"text-amber-600", bg:"bg-amber-50" },
        ].map(s=>(
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 border border-white`}>
            <div className="flex items-center gap-2 mb-0.5">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`}/>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Calendar */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${cfg.bgClass}`}>{cfg.initials}</div>
              <div>
                <div className="font-bold text-slate-900">{cfg.name}</div>
                <div className="text-xs text-slate-500">{cfg.role} · Agenda {MONTHS[m]}</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* DOW headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d=>(
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
                const dt = new Date(2025,m,d);
                const dow = (dt.getDay()+6)%7;
                const isWe = dow>=5;
                const isSel = sel===d;
                const isToday = (new Date().getFullYear()===2025&&new Date().getMonth()===m&&new Date().getDate()===d);
                const slots = getSlots(activeAgent,m,d);
                const free = HOURS.length - slots.length;

                return (
                  <button key={d} onClick={()=>!isWe&&selectDay(d)} disabled={isWe}
                    className={`relative min-h-[72px] rounded-xl p-1.5 text-left transition-all border
                      ${isWe?"bg-slate-50 opacity-40 cursor-default border-transparent":"cursor-pointer border-slate-100 hover:border-slate-300"}
                      ${isSel?`border-2 shadow-md`:""}
                    `}
                    style={isSel?{borderColor:cfg.accentHex,background:cfg.lightHex}:{}}>
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full mb-1
                      ${isToday?"text-white":"text-slate-600"}`}
                      style={isToday?{background:cfg.accentHex}:{}}>
                      {d}
                    </div>
                    <div className="space-y-0.5">
                      {slots.slice(0,2).map((s,i)=>(
                        <div key={i} className={`w-full h-1.5 rounded-full ${chipColor(s.tipo)}`}/>
                      ))}
                      {slots.length>0&&(
                        <div className="text-[9px] font-semibold text-slate-400 mt-0.5">{slots.length} cita{slots.length!==1?"s":""}</div>
                      )}
                      {!isWe&&free>0&&slots.length===0&&(
                        <div className="text-[9px] text-teal-400 font-medium">{free} libre</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-50">
              {[
                ["bg-teal-500","Visita / comercial"],
                ["bg-blue-500","Instalación"],
                ["bg-amber-500","Firma contrato"],
                ["bg-purple-500","Revisión"],
              ].map(([bg,label])=>(
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${bg}`}/>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule panel */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          {!sel ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
                <p className="text-sm font-medium text-slate-400">Selecciona un día</p>
                <p className="text-xs text-slate-300 mt-1">Haz clic en cualquier día hábil para ver y gestionar el horario</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    {sel} de {MONTHS[m]}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{selSlots.length} cita{selSlots.length!==1?"s":""} · {HOURS.length-selSlots.length} huecos libres</div>
                </div>
                <button onClick={()=>setShowForm(p=>({...p,[activeAgent]:!isFormOpen}))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isFormOpen?"bg-slate-100 text-slate-600":"text-white"}`}
                  style={!isFormOpen?{background:cfg.accentHex}:{}}>
                  <Plus className="w-3.5 h-3.5"/>{isFormOpen?"Cancelar":"Nueva cita"}
                </button>
              </div>

              {/* New appointment form */}
              {isFormOpen&&(
                <div className="p-4 border-b border-slate-50 bg-slate-50">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Nueva cita — {sel} de {MONTHS[m]}</div>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 font-medium block mb-1">Hora</label>
                        <select value={form.hora} onChange={e=>setForm(p=>({...p,hora:e.target.value}))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2" style={{"--tw-ring-color":cfg.accentHex}}>
                          {HOURS.filter(h=>!selSlots.find(s=>s.hora===h)).map(h=><option key={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium block mb-1">Tipo</label>
                        <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2">
                          {TIPOS_CITA.map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Cliente *</label>
                      <input value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))} placeholder="Nombre del cliente"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 font-medium block mb-1">Zona / Técnico</label>
                        <select value={form.zona} onChange={e=>setForm(p=>({...p,zona:e.target.value}))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2">
                          {ZONAS.map(z=><option key={z}>{z}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium block mb-1">Ref. contrato</label>
                        <input value={form.ref} onChange={e=>setForm(p=>({...p,ref:e.target.value}))} placeholder="SGX-2025-XXXX"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Dirección de visita</label>
                      <input value={form.direccion} onChange={e=>setForm(p=>({...p,direccion:e.target.value}))} placeholder="Calle, número, municipio"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2"/>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Teléfono</label>
                      <input value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="+34 6XX XXX XXX"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2"/>
                    </div>
                    <button onClick={saveSlot} disabled={!form.cliente.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                      style={{background:cfg.accentHex}}>
                      Guardar cita
                    </button>
                  </div>
                </div>
              )}

              {/* Time blocks */}
              <div className="overflow-y-auto flex-1" style={{maxHeight:420}}>
                {HOURS.map(h=>{
                  const slot = selSlots.find(s=>s.hora===h);
                  return (
                    <div key={h} className={`flex items-stretch border-b border-slate-50 last:border-0 min-h-[52px] group`}>
                      <div className="w-14 flex items-center justify-end pr-3 shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-300">{h}</span>
                      </div>
                      {slot ? (
                        <div className={`flex-1 m-1.5 rounded-xl px-3 py-2 flex items-center gap-2 border ${slot.locked?"border-slate-200 bg-slate-50":"border-dashed"}`}
                          style={!slot.locked?{borderColor:cfg.accentHex,background:cfg.lightHex}:{}}>
                          <div className={`w-1 self-stretch rounded-full shrink-0`} style={{background:slot.locked?"#cbd5e1":cfg.accentHex}}/>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg border ${tipoColor(slot.tipo)}`}>
                                {tipoIcon(slot.tipo)}{slot.tipo}
                              </span>
                              {slot.locked&&<span className="text-xs text-slate-400">🔒</span>}
                            </div>
                            <div className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{slot.cliente}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5"/>{slot.zona}</span>
                              {slot.ref&&<span className="text-xs text-slate-300 font-mono">{slot.ref}</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 m-1.5 rounded-xl border border-dashed border-slate-100 flex items-center px-3 group-hover:border-slate-200 group-hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={()=>{ setShowForm(p=>({...p,[activeAgent]:true})); setForm(f=>({...f,hora:h})); }}>
                          <span className="text-xs text-slate-300 group-hover:text-slate-400 transition-colors"><Plus className="w-3 h-3 inline mr-1"/>Disponible</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
function ClientesView() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [customers, setCustomers] = useState(CUSTOMERS);
  const filtered = customers.filter(c=>{
    const matchSearch = !search||c.name.toLowerCase().includes(search.toLowerCase())||c.zone.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus==="todos"||(filterStatus==="activos"&&c.status==="Activo")||(filterStatus==="pendientes"&&c.status==="Pendiente instalación");
    return matchSearch&&matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente o zona..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
          {[["todos","Todos"],["activos","Activos"],["pendientes","Pendientes"]].map(([val,label])=>(
            <button key={val} onClick={()=>setFilterStatus(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus===val?"bg-slate-900 text-white":"text-slate-500 hover:text-slate-900"}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} clientes</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3 text-left font-semibold">Cliente</th>
              <th className="px-5 py-3 text-left font-semibold">Zona</th>
              <th className="px-5 py-3 text-left font-semibold">Plan</th>
              <th className="px-5 py-3 text-left font-semibold">Alta</th>
              <th className="px-5 py-3 text-left font-semibold">Estado</th>
              <th className="px-5 py-3 text-left font-semibold">Próximo evento</th>
              <th className="px-5 py-3 text-left font-semibold">Comercial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(c=>(
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{c.name}</td>
                <td className="px-5 py-3.5 text-slate-500 text-sm">{c.zone}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">{KITS[c.kit].name}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-sm tabular-nums">{c.since}</td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status}/></td>
                <td className="px-5 py-3.5 text-slate-500 text-sm">{c.next}</td>
                <td className="px-5 py-3.5"><Avatar rep={repById(c.rep)} size="w-7 h-7"/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&(
          <div className="py-12 text-center text-slate-400 text-sm">No se encontraron clientes</div>
        )}
      </div>
    </div>
  );
}

// ─── CATÁLOGO ────────────────────────────────────────────────────────────────
function CatalogoView() {
  const [tab, setTab] = useState("kits");
  const [kit, setKit] = useState("total");
  const [sentinel, setSentinel] = useState(null);
  const [extraAddons, setExtraAddons] = useState([]);
  const [clientName, setClientName] = useState("");
  const [generated, setGenerated] = useState(false);

  const sk = KITS[kit];
  const sm = sentinel ? SENTINEL_MODELS.find(s=>s.id===sentinel) : null;
  const addonTotal = extraAddons.reduce((a,n)=>a+ADDONS[n].price,0);
  const addonMensual = extraAddons.reduce((a,n)=>a+ADDONS[n].cuota,0);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit">
        {[["kits","Kits de alarma"],["sentinel","Gama Sentinel"],["addons","Complementos"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab===id?"bg-slate-900 text-white":"text-slate-500 hover:text-slate-900"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab==="kits"&&(
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(KITS).map(([k,v])=>(
            <div key={k} className={`rounded-2xl border p-5 bg-white transition-all ${kit===k?"border-amber-400 shadow-lg ring-2 ring-amber-100":"border-slate-100 shadow-sm hover:shadow-md"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">{v.name}</h3>
                {kit===k&&<CheckCircle2 className="w-5 h-5 text-amber-500"/>}
              </div>
              <p className="text-sm text-slate-500 mb-4">{v.desc}</p>
              <ul className="space-y-2 mb-5 flex-1">
                {KIT_FEATURES[k].map((f,i)=>(
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5"/>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{v.alta} €</div>
                <div className="text-xs text-slate-400 mb-4">instalación · {v.cuota.toFixed(2).replace(".",",")} €/mes</div>
                <button onClick={()=>{setKit(k);setGenerated(false);}}
                  className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all ${kit===k?"bg-slate-900 text-white":"border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  {kit===k?"Seleccionado":"Seleccionar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="sentinel"&&(
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SENTINEL_MODELS.map(s=>(
            <div key={s.id} className={`rounded-2xl border p-5 bg-white transition-all ${sentinel===s.id?"border-violet-400 shadow-lg ring-2 ring-violet-100":"border-slate-100 shadow-sm hover:shadow-md"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                {sentinel===s.id&&<CheckCircle2 className="w-5 h-5 text-violet-500"/>}
              </div>
              <p className="text-sm text-slate-500 mb-4">{s.desc}</p>
              <ul className="space-y-2 mb-5">
                {s.features.map((f,i)=>(
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5"/>{f}
                  </li>
                ))}
              </ul>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.price} €</div>
              <div className="text-xs text-slate-400 mb-4">dispositivo · {s.cuota.toFixed(2).replace(".",",")} €/mes</div>
              <button onClick={()=>{setSentinel(s.id);setGenerated(false);}}
                className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all ${sentinel===s.id?"bg-violet-600 text-white":"border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                {sentinel===s.id?"Seleccionado":"Seleccionar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="addons"&&(
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {ADDONS.map((a,i)=>{
            const checked = extraAddons.includes(i);
            return (
              <div key={i} onClick={()=>{ setExtraAddons(p=>checked?p.filter(x=>x!==i):[...p,i]); setGenerated(false); }}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${checked?"bg-amber-50":"hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${checked?"border-amber-500 bg-amber-500":"border-slate-300"}`}>
                    {checked&&<CheckCircle2 className="w-3.5 h-3.5 text-white"/>}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{a.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {a.price} € {a.cuota>0&&<span className="text-slate-400 font-normal text-xs">+ {a.cuota.toFixed(2).replace(".",",")} €/mes</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget generator */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <SectionHeader title="Generador de presupuesto" sub="Combina kits, Sentinel y complementos para el cliente" />
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input value={clientName} onChange={e=>{setClientName(e.target.value);setGenerated(false);}} placeholder="Nombre del cliente"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"/>
          <button onClick={()=>setGenerated(true)} disabled={!clientName}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2">
            <Download className="w-4 h-4"/> Generar presupuesto
          </button>
        </div>
        {generated&&(
          <div className="border border-amber-200 rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Presupuesto Seguxat</div>
                <div className="text-xl font-bold text-slate-900">{clientName}</div>
              </div>
              <div className="text-xs text-slate-400">{new Date().toLocaleDateString("es-ES")}</div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm py-2 border-b border-amber-200">
                <span className="text-slate-600">Kit de seguridad</span>
                <span className="font-semibold text-slate-900">{sk.name} — {sk.alta} €</span>
              </div>
              {sm&&<div className="flex justify-between text-sm py-2 border-b border-amber-200">
                <span className="text-slate-600">Dispositivo Sentinel</span>
                <span className="font-semibold text-slate-900">{sm.name} — {sm.price} €</span>
              </div>}
              {extraAddons.length>0&&extraAddons.map(i=>(
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-slate-500">{ADDONS[i].name}</span>
                  <span className="text-slate-700">{ADDONS[i].price} €</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Inversión inicial</span>
                <span className="font-bold text-slate-900 tabular-nums">{(sk.alta+(sm?.price||0)+addonTotal).toFixed(2).replace(".",",")} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cuota mensual</span>
                <span className="font-bold text-teal-600 tabular-nums">{(sk.cuota+(sm?.cuota||0)+addonMensual).toFixed(2).replace(".",",")} €/mes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMERCIALES ─────────────────────────────────────────────────────────────
function ComercialesView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {REPS.map(rep=>{
        const perf = REP_PERF.find(p=>p.rep===rep.id);
        const activeLeads = INITIAL_LEADS.filter(l=>l.rep===rep.id&&l.stage!=="instalacion").length;
        const pct = Math.min(100, Math.round((perf.ventas/perf.objetivo)*100));
        const comision = perf.ventas * 35;
        const stageBreakdown = STAGES.slice(0,5).map(s=>({ stage:s.label, count:INITIAL_LEADS.filter(l=>l.rep===rep.id&&l.stage===s.id).length, color:s.color })).filter(x=>x.count>0);
        return (
          <div key={rep.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <Avatar rep={rep} size="w-14 h-14"/>
              <div>
                <div className="text-lg font-bold text-slate-900">{rep.name}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{rep.zone}</div>
              </div>
              <div className={`ml-auto text-lg font-bold px-3 py-1.5 rounded-xl ${pct>=100?"bg-teal-50 text-teal-700":"bg-amber-50 text-amber-700"}`}>{pct}%</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[["Leads activos",activeLeads,"text-slate-900"],["Ventas junio",perf.ventas,"text-amber-600"],["Comisión",`${comision}€`,"text-teal-600"]].map(([l,v,c])=>(
                <div key={l} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold tabular-nums ${c}`}>{v}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Objetivo mensual</span>
                <span className="tabular-nums font-semibold">{perf.ventas} / {perf.objetivo}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct>=100?"bg-teal-500":"bg-amber-500"}`} style={{width:`${pct}%`}}/>
              </div>
            </div>
            {stageBreakdown.length>0&&(
              <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                {stageBreakdown.map(x=>(
                  <span key={x.stage} className={`text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600`}>
                    {x.stage}: <strong>{x.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
function GoogleButton({ onCredential, label }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let t;
    if(window.google?.accounts?.id){setReady(true);}
    else {
      const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client"; s.async=true; s.defer=true;
      s.onload=()=>setReady(true); s.onerror=()=>setBlocked(true);
      document.head.appendChild(s);
      t=setTimeout(()=>{if(!window.google?.accounts?.id)setBlocked(true);},2500);
    }
    return()=>clearTimeout(t);
  },[]);
  useEffect(()=>{
    if(!ready||!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:r=>onCredential(r.credential),auto_select:false});
    window.google.accounts.id.disableAutoSelect();
    const el=document.getElementById("google-signin-button");
    if(el) window.google.accounts.id.renderButton(el,{theme:"outline",size:"large",width:280});
  },[ready]);
  if(blocked) return (
    <div className="text-center">
      <button onClick={()=>onCredential(null)} className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <ShieldCheck className="w-4 h-4 text-teal-600"/> {label||"Verificar con Google"}
      </button>
      <p className="text-xs text-slate-400 mt-2">No se pudo cargar el botón de Google en esta vista previa.</p>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <div id="google-signin-button"/>
      {!ready&&<Loader2 className="w-4 h-4 text-slate-400 animate-spin"/>}
    </div>
  );
}

function LoginView({ onLogin }) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [step,setStep]=useState("credentials");
  const [pendingToken,setPendingToken]=useState(null);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [offline,setOffline]=useState(false);

  async function submitCredentials(e) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const data=await res.json();
      if(!res.ok){setError(data.error||"No se pudo iniciar sesión");return;}
      setPendingToken(data.pendingToken);
      setStep(data.step==="google-link-required"?"google-link":"google-verify");
    } catch{setOffline(true);}finally{setLoading(false);}
  }

  async function submitGoogle(idToken) {
    setError(null); setLoading(true);
    const path=step==="google-link"?"google-link":"google-verify";
    try {
      const res=await fetch(`${API_BASE}/auth/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pendingToken,googleIdToken:idToken})});
      const data=await res.json();
      if(!res.ok){setError(data.error||"No se pudo verificar con Google");return;}
      onLogin(data.employee,data.token);
    } catch{setOffline(true);}finally{setLoading(false);}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_,i)=>(
          <div key={i} className="absolute rounded-full opacity-5 bg-amber-500"
            style={{width:300+i*200,height:300+i*200,top:`${20+i*25}%`,left:`${-10+i*35}%`,transform:"translate(-50%,-50%)"}}/>
        ))}
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-xl">
            <ShieldCheck className="w-8 h-8 text-white"/>
          </div>
          <div className="font-black text-4xl tracking-tight text-white">SEGU<span className="text-amber-400">X</span>AT</div>
          <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">CRM de ventas · Acceso seguro</div>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-7">
          {step==="credentials"&&(
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" placeholder="tu@seguxat.es"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <div className="relative mt-1.5">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50" placeholder="••••••••"/>
                </div>
              </div>
              {error&&<div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:"Iniciar sesión"}
              </button>
            </form>
          )}
          {(step==="google-verify"||step==="google-link")&&(
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-teal-600"/>
              </div>
              <p className="text-sm text-slate-600">
                {step==="google-link"?"Primer inicio: vincula tu cuenta de Google.":"Verificación en dos pasos: confirma con Google."}
              </p>
              <GoogleButton onCredential={submitGoogle} label={step==="google-link"?"Vincular con Google":"Verificar con Google"}/>
              {error&&<div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertCircle className="w-4 h-4"/>{error}</div>}
              <button onClick={()=>{setStep("credentials");setError(null);}} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto">
                <ArrowLeft className="w-3 h-3"/> Volver
              </button>
            </div>
          )}
          {offline&&(
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mb-2"><AlertCircle className="w-3.5 h-3.5"/> Sin conexión con el servidor.</p>
              <button onClick={()=>onLogin({_id:"demo",name:"Ivan (demo)",email:"director@seguxat.es",role:"director",zone:"Toda Valencia"},null)}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 mx-auto">
                Continuar en modo demo <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROLE CONFIG ─────────────────────────────────────────────────────────────
const ROLE_LABELS = { director:"Director", comercial:"Comercial", televenta:"Televenta", tecnico:"Técnico instalador", soporte:"Soporte / CRA" };
const ROLE_GUIDES = {
  televenta: {
    summary:"Coordinas la agenda de visitas: confirmas con el cliente día y hora, y dejas todo anotado en el CRM para que el técnico sepa dónde ir.",
    steps:[
      {title:"1. Revisa solicitudes nuevas",detail:"Entran por la web o por teléfono. Las verás en Pipeline → columna «Nuevo»."},
      {title:"2. Llama para ofrecer cita",detail:"Propón día y hora de visita técnica. Usa el teléfono de empresa."},
      {title:"3. Anota la visita en el CRM",detail:"Mueve el lead a «Cita» en el Pipeline y añade fecha/hora en Agenda."},
      {title:"4. Confirma el día antes",detail:"Llama de nuevo para confirmar que la visita sigue en pie."},
      {title:"5. Avisa de cambios",detail:"Si cancelan o cambian la hora, actualízalo en el CRM y avisa a dirección."},
    ],
  },
  comercial: {
    summary:"Generas y cierras ventas: buscas clientes nuevos, los visitas o llamas, y haces el seguimiento hasta firmar el contrato.",
    steps:[
      {title:"1. Revisa tu pipeline",detail:"Actualiza la fase de cualquier lead con el que hayas hablado."},
      {title:"2. Prospección",detail:"Busca clientes potenciales en tu zona y añádelos como «Nuevo lead»."},
      {title:"3. Llamadas o visitas",detail:"Presenta los kits de Seguxat y detecta interés real."},
      {title:"4. Actualiza el CRM",detail:"Anota el resultado de cada contacto."},
      {title:"5. Presupuestos",detail:"Prepara o envía propuestas desde el Catálogo."},
    ],
  },
  tecnico: {
    summary:"Realizas instalaciones y mantenimientos en casa del cliente según la agenda asignada.",
    steps:[
      {title:"1. Revisa tu agenda del día",detail:"Visitas técnicas con dirección y franja horaria."},
      {title:"2. Confirma material",detail:"Revisa el kit contratado antes de salir."},
      {title:"3. Realiza la instalación",detail:"Sigue el procedimiento estándar de Seguxat."},
      {title:"4. Marca completado",detail:"Actualiza el estado en el CRM al terminar."},
      {title:"5. Reporta incidencias",detail:"Si algo no fue según lo previsto, anótalo y avisa."},
    ],
  },
  soporte: {
    summary:"Atiendes clientes instalados: incidencias, dudas y coordinación con la CRA.",
    steps:[
      {title:"1. Revisa incidencias abiertas",detail:"Mensajes o llamadas de clientes con problemas."},
      {title:"2. Diagnostica",detail:"Determina si es fallo técnico, de uso, o de facturación."},
      {title:"3. Resuelve o escala",detail:"Si puedes por teléfono, hazlo; si no, agenda visita técnica."},
      {title:"4. Anota la resolución",detail:"Deja constancia de qué se hizo y cuándo."},
      {title:"5. Seguimiento",detail:"Confirma con el cliente que el problema quedó resuelto."},
    ],
  },
  director:{summary:"Tienes visión completa del negocio: empleados, pipeline, clientes y catálogo.",steps:[]},
};

// ─── EMPLOYEE DASHBOARD ──────────────────────────────────────────────────────
function EmployeeDashboardView({ token, currentUser }) {
  const [tasks,setTasks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showGuide,setShowGuide]=useState(true);

  async function load() {
    if(!token){setLoading(false);setError("offline");return;}
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/employees/me/tasks`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setTasks(data.tasks||[]); setError(null);
    } catch{setError("offline");}finally{setLoading(false);}
  }

  useEffect(()=>{load();},[token]);

  async function toggleTask(task) {
    if(!token) return;
    setTasks(prev=>prev.map(t=>t._id===task._id?{...t,done:!t.done}:t));
    await fetch(`${API_BASE}/employees/me/tasks/${task._id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({done:!task.done})});
  }

  function extractTime(title){const m=title?.match(/^(\d{1,2}:\d{2})\s*·/);return m?m[1]:null;}
  function cleanTitle(title){return title?.replace(/^\d{1,2}:\d{2}\s*·\s*/,"");}

  const pending=tasks.filter(t=>!t.done);
  const done=tasks.filter(t=>t.done);
  const guide=ROLE_GUIDES[currentUser.role];
  const roleLabel=ROLE_LABELS[currentUser.role]||currentUser.role;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="text-lg font-bold">Hola, {currentUser.name.split(" ")[0]} 👋</div>
        <div className="text-sm text-slate-400 mt-1">{roleLabel} · {currentUser.zone||"Seguxat"}</div>
        {pending.length>0&&<div className="text-sm text-amber-400 mt-2 font-medium">{pending.length} tarea{pending.length!==1?"s":""} pendiente{pending.length!==1?"s":""}</div>}
      </div>

      {error==="offline"&&(
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-2xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0"/>No se pudo conectar con el backend para cargar tus tareas.
        </div>
      )}

      {guide&&(
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button onClick={()=>setShowGuide(!showGuide)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-sm">📘</span>
              </div>
              <span className="text-sm font-bold text-slate-900">Guía: {roleLabel}</span>
            </div>
            <span className="text-xs text-slate-400">{showGuide?"Ocultar":"Mostrar"}</span>
          </button>
          {showGuide&&(
            <div className="px-5 pb-5 border-t border-slate-50 pt-4">
              <p className="text-sm text-slate-600 mb-4">{guide.summary}</p>
              {guide.steps.length>0&&(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {guide.steps.map((s,i)=>(
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{i+1}</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.title.replace(/^\d+\.\s*/,"")}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <SectionHeader title="Tus tareas de hoy"
          action={tasks.length>0&&<span className="text-xs text-slate-400">{pending.length} pendientes · {done.length} completadas</span>}/>
        {loading?(
          <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Cargando tareas...</div>
        ):tasks.length===0?(
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-400 shadow-sm">
            Sin tareas asignadas todavía. Tu director las irá añadiendo aquí.
          </div>
        ):(
          <div className="space-y-3">
            {pending.length>0&&(
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pendientes</div>
                <div className="space-y-2">
                  {pending.map(t=>{
                    const hora=extractTime(t.title); const titulo=cleanTitle(t.title);
                    return (
                      <button key={t._id} onClick={()=>toggleTask(t)}
                        className="w-full text-left flex items-start gap-3 border border-slate-100 rounded-xl p-3 hover:border-amber-300 hover:bg-amber-50 transition-all">
                        {hora&&<div className="w-14 text-xs font-bold text-amber-600 tabular-nums pt-0.5 shrink-0">{hora}</div>}
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-300 mt-0.5 shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{titulo}</div>
                          {t.description&&<div className="text-xs text-slate-500 mt-0.5">{t.description.split("\n")[0]}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {done.length>0&&(
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Completadas</div>
                <div className="space-y-2">
                  {done.map(t=>{
                    const hora=extractTime(t.title); const titulo=cleanTitle(t.title);
                    return (
                      <button key={t._id} onClick={()=>toggleTask(t)}
                        className="w-full text-left flex items-start gap-3 border border-slate-50 rounded-xl p-3 opacity-60 hover:opacity-80 transition-all">
                        {hora&&<div className="w-14 text-xs text-slate-400 tabular-nums pt-0.5 shrink-0">{hora}</div>}
                        <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 shrink-0"/>
                        <div className="text-sm text-slate-500 line-through">{titulo}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EMPLEADOS ───────────────────────────────────────────────────────────────
function EmpleadosView({ token, currentUser }) {
  const [employees,setEmployees]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [resetTarget,setResetTarget]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [tasksTarget,setTasksTarget]=useState(null);

  async function load() {
    if(!token){setLoading(false);setError("offline");return;}
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/employees`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setEmployees(data.employees); setError(null);
    } catch{setError("offline");}finally{setLoading(false);}
  }

  useEffect(()=>{load();},[token]);

  async function toggleActive(emp) {
    if(!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}/active`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({active:!emp.active})});
    load();
  }
  async function toggleSuspend(emp) {
    if(!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}/suspend`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({suspended:!emp.suspended})});
    load();
  }
  async function deleteEmployee(emp) {
    if(!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    setConfirmDelete(null); load();
  }
  async function changeRole(emp,newRole) {
    if(!token||newRole===emp.role) return;
    await fetch(`${API_BASE}/employees/${emp._id}/role`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({role:newRole})});
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Solo el director puede crear, suspender o eliminar empleados.</p>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2.5">
          <Plus className="w-4 h-4"/> Nuevo empleado
        </button>
      </div>
      {error==="offline"&&(
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-2xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0"/>No se pudo conectar con {API_BASE}/employees.
        </div>
      )}
      {loading?(
        <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Cargando...</div>
      ):employees.length>0?(
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                {["Nombre","Email","Rol","Zona","Google","Estado","Acciones"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map(emp=>{
                const isSelf=emp._id===currentUser._id;
                const status=!emp.active?"Inactivo":emp.suspended?"Suspendido":"Activo";
                return (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{emp.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{emp.email}</td>
                    <td className="px-5 py-3.5">
                      {isSelf?(
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${emp.role==="director"?"bg-slate-900 text-white":"bg-slate-100 text-slate-700"}`}>
                          {ROLE_LABELS[emp.role]||emp.role}
                        </span>
                      ):(
                        <select value={emp.role} onChange={e=>changeRole(emp,e.target.value)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                          {Object.entries(ROLE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{emp.zone||"—"}</td>
                    <td className="px-5 py-3.5">
                      {emp.googleId?<CheckCircle2 className="w-4 h-4 text-teal-500"/>:<span className="text-xs text-slate-300">Pendiente</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={status}/></td>
                    <td className="px-5 py-3.5">
                      {!isSelf&&(
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            ["Tareas",()=>setTasksTarget(emp),"text-slate-400 hover:text-amber-600"],
                            ["Credenciales",()=>setResetTarget(emp),"text-slate-400 hover:text-amber-600"],
                            [emp.suspended?"Reactivar":"Suspender",()=>toggleSuspend(emp),"text-slate-400 hover:text-amber-600"],
                            [emp.active?"Desactivar":"Activar",()=>toggleActive(emp),"text-slate-400 hover:text-slate-700"],
                            ["Eliminar",()=>setConfirmDelete(emp),"text-slate-400 hover:text-red-600"],
                          ].map(([label,fn,cls])=>(
                            <button key={label} onClick={fn} className={`text-xs font-medium ${cls} transition-colors`}>{label}</button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ):null}
      {showModal&&<NewEmployeeModal token={token} onClose={()=>setShowModal(false)} onCreated={load}/>}
      {resetTarget&&<ResetPasswordModal token={token} employee={resetTarget} onClose={()=>setResetTarget(null)} onDone={load}/>}
      {tasksTarget&&<TasksModal token={token} employee={tasksTarget} onClose={()=>setTasksTarget(null)}/>}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar empleado</h3>
            <p className="text-sm text-slate-600 mb-5">Esto eliminará permanentemente la cuenta de <strong>{confirmDelete.name}</strong>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={()=>deleteEmployee(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl py-2.5 text-sm font-bold text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetPasswordModal({ token, employee, onClose, onDone }) {
  const [password,setPassword]=useState("");
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(null);
  async function submit() {
    setError(null);
    if(!password||password.length<8){setError("Mínimo 8 caracteres");return;}
    if(!token){setError("Sin conexión con el backend");return;}
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/employees/${employee._id}/reset-password`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({password})});
      const data=await res.json();
      if(!res.ok){setError(data.error||"No se pudo restablecer la contraseña");return;}
      setDone(data.emailSent);
      setTimeout(()=>{onDone();onClose();},1500);
    } catch{setError("No se pudo conectar con el backend");}finally{setLoading(false);}
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Reenviar credenciales</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        <p className="text-sm text-slate-500 mb-3">Nueva contraseña provisional para <strong>{employee.name}</strong>.</p>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nueva contraseña (mín. 8 caracteres)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"/>
        {error&&<div className="flex items-center gap-2 text-xs text-red-600 mt-2"><AlertCircle className="w-3.5 h-3.5"/>{error}</div>}
        {done!==null&&<div className="flex items-center gap-2 text-xs text-teal-600 mt-2"><CheckCircle2 className="w-3.5 h-3.5"/>{done?"Correo enviado.":"Contraseña actualizada."}</div>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:"Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TasksModal({ token, employee, onClose }) {
  const [tasks,setTasks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [adding,setAdding]=useState(false);

  async function load() {
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/employees/${employee._id}/tasks`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json(); setTasks(data.tasks||[]);
    } catch{setTasks([]);}finally{setLoading(false);}
  }
  useEffect(()=>{load();},[employee._id]);

  async function addTask() {
    if(!title.trim()) return; setAdding(true);
    try {
      await fetch(`${API_BASE}/employees/${employee._id}/tasks`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({title,description})});
      setTitle(""); setDescription(""); load();
    }finally{setAdding(false);}
  }
  async function removeTask(taskId) {
    await fetch(`${API_BASE}/employees/${employee._id}/tasks/${taskId}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    load();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-slate-900">Tareas — {employee.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Estas tareas aparecen en el dashboard personal del empleado.</p>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 space-y-2.5">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título de la tarea"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Descripción (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
          <button onClick={addTask} disabled={adding||!title.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl py-2.5 flex items-center justify-center gap-2">
            {adding?<Loader2 className="w-4 h-4 animate-spin"/>:<Plus className="w-4 h-4"/>} Añadir tarea
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading?(
            <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Cargando...</div>
          ):tasks.length===0?(
            <div className="text-sm text-slate-400 italic text-center py-6">Sin tareas asignadas.</div>
          ):tasks.map(t=>(
            <div key={t._id} className="flex items-start justify-between gap-3 border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-2">
                {t.done?<CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 shrink-0"/>:<div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 shrink-0"/>}
                <div>
                  <div className={`text-sm font-semibold ${t.done?"text-slate-400 line-through":"text-slate-900"}`}>{t.title}</div>
                  {t.description&&<div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                </div>
              </div>
              <button onClick={()=>removeTask(t._id)} className="text-xs text-slate-300 hover:text-red-500 transition-colors shrink-0">Eliminar</button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cerrar</button>
      </div>
    </div>
  );
}

function NewEmployeeModal({ token, onClose, onCreated }) {
  const [form,setForm]=useState({name:"",email:"",password:"",role:"comercial",zone:""});
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  async function submit() {
    setError(null);
    if(!form.name||!form.email||!form.password){setError("Completa nombre, email y contraseña");return;}
    if(form.password.length<8){setError("La contraseña debe tener al menos 8 caracteres");return;}
    if(!token){setError("Sin conexión con el backend");return;}
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/employees`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setError(data.error||"No se pudo crear el empleado");return;}
      onCreated(); onClose();
    } catch{setError("No se pudo conectar con el backend");}finally{setLoading(false);}
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">Nuevo empleado</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        <div className="space-y-3">
          {[["Nombre completo","text","name","Nombre completo"],["Email","email","email","tu@seguxat.es"]].map(([label,type,key,ph])=>(
            <div key={key}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</label>
              <input type={type} value={form[key]} onChange={e=>f(key,e.target.value)} placeholder={ph}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"/>
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contraseña inicial (mín. 8 caracteres)</label>
            <input type="password" value={form.password} onChange={e=>f("password",e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Rol</label>
              <select value={form.role} onChange={e=>f("role",e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50">
                <option value="comercial">Comercial</option>
                <option value="televenta">Televenta</option>
                <option value="tecnico">Técnico instalador</option>
                <option value="soporte">Soporte / CRA</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Zona</label>
              <input value={form.zone} onChange={e=>f("zone",e.target.value)} placeholder="Ej: Benimaclet"
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"/>
            </div>
          </div>
          {error&&<div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:"Crear empleado"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Resumen",    icon:LayoutDashboard },
  { id:"pipeline",  label:"Pipeline",   icon:Workflow        },
  { id:"agenda",    label:"Agenda",     icon:CalendarDays    },
  { id:"clientes",  label:"Clientes",   icon:Users           },
  { id:"catalogo",  label:"Catálogo",   icon:Package         },
];
const DIRECTOR_ONLY_NAV = [
  { id:"comerciales", label:"Comerciales", icon:Trophy   },
  { id:"empleados",   label:"Empleados",   icon:UserCog  },
];
const PAGE_TITLES = {
  dashboard:"Resumen general", pipeline:"Pipeline de ventas", agenda:"Agenda de agentes",
  clientes:"Clientes", catalogo:"Catálogo y presupuestos", comerciales:"Equipo comercial", empleados:"Empleados",
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function SeguxatCRM() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);

  if(!currentUser) {
    return <LoginView onLogin={(employee,tok)=>{setCurrentUser(employee);setToken(tok);}}/>;
  }

  const isDirector = currentUser.role === "director";
  const nav = isDirector ? [...NAV, ...DIRECTOR_ONLY_NAV] : NAV;

  const views = {
    dashboard:  isDirector ? <DashboardView/> : <EmployeeDashboardView token={token} currentUser={currentUser}/>,
    pipeline:   <PipelineView/>,
    agenda:     <AgendaView/>,
    clientes:   <ClientesView/>,
    catalogo:   <CatalogoView/>,
    comerciales:<ComercialesView/>,
    empleados:  <EmpleadosView token={token} currentUser={currentUser}/>,
  };

  function logout(){ setCurrentUser(null); setToken(null); setActive("dashboard"); }

  const initials = currentUser.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 text-sm overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <div className="font-black text-2xl tracking-tight">SEGU<span className="text-amber-400">X</span>AT</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">CRM · Ventas</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(item=>{
            const Icon=item.icon; const isActive=active===item.id;
            return (
              <button key={item.id} onClick={()=>setActive(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive?"bg-white/10 text-white":"text-slate-500 hover:text-white hover:bg-white/5"}`}>
                <Icon className={`w-4 h-4 shrink-0 ${isActive?"text-amber-400":""}`}/>
                {item.label}
                {isActive&&<span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400"/>}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-black text-slate-900 shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate">{ROLE_LABELS[currentUser.role]||currentUser.role}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" className="text-slate-600 hover:text-white transition-colors">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div>
            <h1 className="text-base font-bold text-slate-900">{PAGE_TITLES[active]}</h1>
            <p className="text-xs text-slate-400">Lunes, 23 de junio de 2025</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={()=>setNotifOpen(!notifOpen)} className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Bell className="w-4 h-4 text-slate-600"/>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"/>
              </button>
              {notifOpen&&(
                <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Notificaciones</span>
                    <button onClick={()=>setNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                  </div>
                  {[
                    {icon:"📅",text:"Pilar Esteve — cita hoy 17:30",sub:"Algirós · Visita comercial"},
                    {icon:"🔧",text:"Encarna Tortosa — instalación pendiente",sub:"Patraix · Mañana 09:00"},
                    {icon:"✅",text:"Gimnasio Pulso — contrato firmado",sub:"Algirós · Hace 2 horas"},
                  ].map((n,i)=>(
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <span className="text-lg mt-0.5">{n.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{n.text}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{n.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-black text-slate-900">{initials}</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
          {views[active]}
        </main>
      </div>
    </div>
  );
}
