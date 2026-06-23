import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Workflow, CalendarDays, Users, Package, Trophy,
  Search, MapPin, Phone, Plus, TrendingUp, Clock, ShieldCheck,
  ArrowRight, ArrowLeft, X, CheckCircle2, Building2, Bell,
  LogOut, UserCog, Mail, Lock, Loader2, AlertCircle, CreditCard, Copy, Banknote,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

// ============================================================
// CONFIG — backend API y verificación con Google
// ============================================================
// URL del backend de Seguxat CRM una vez desplegado (Railway/Vercel).
// En desarrollo local sería algo como "http://localhost:4000/api".
const API_BASE = "https://seguxat-crm-production.up.railway.app/api";

// Sustituye por el Client ID real de tu proyecto en Google Cloud Console
// (APIs y servicios -> Credenciales -> ID de cliente de OAuth 2.0 -> Web).
const GOOGLE_CLIENT_ID = "560128973845-o2otvdgfboc3igncs9rovd506bt64l5e.apps.googleusercontent.com";

// ============================================================
// DATA
// ============================================================
const REPS = [
  { id: "r1", name: "Laura Gómez", initials: "LG", zone: "Centro / Ciutat Vella", color: "bg-amber-500" },
  { id: "r2", name: "Marc Ferrer", initials: "MF", zone: "Ruzafa / Eixample", color: "bg-teal-600" },
  { id: "r3", name: "Sara Beltrán", initials: "SB", zone: "Benimaclet / Algirós", color: "bg-sky-600" },
  { id: "r4", name: "Iván Soler", initials: "IS", zone: "Patraix / Jesús", color: "bg-violet-600" },
];

const STAGES = [
  { id: "nuevo", label: "Nuevo lead", color: "bg-slate-400" },
  { id: "contactado", label: "Contactado", color: "bg-sky-500" },
  { id: "cita", label: "Cita agendada", color: "bg-amber-500" },
  { id: "visita", label: "Visita realizada", color: "bg-orange-500" },
  { id: "propuesta", label: "Propuesta enviada", color: "bg-violet-500" },
  { id: "contrato", label: "Contrato firmado", color: "bg-teal-600" },
  { id: "instalacion", label: "Instalación programada", color: "bg-emerald-600" },
];

const KITS = {
  esencial: { name: "Hogar Esencial", alta: 199, cuota: 24.9, desc: "Central + 2 sensores apertura + 1 detector movimiento + sirena + app" },
  total: { name: "Hogar Total", alta: 349, cuota: 34.9, desc: "Central + 4 sensores + 2 cámaras HD + sirena ext. + detector humo + videoverificación" },
  negocio: { name: "Negocio", alta: 599, cuota: 49.9, desc: "Central + sensores perimetrales + cámaras HD + botón pánico + respuesta prioritaria" },
};

// Catálogo extendido para la sección "Catálogo y presupuestos": detalle de
// equipamiento por kit, gama Sentinel (relojes GPS/SOS) y complementos.
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
    id: "sentinel-classic",
    name: "Sentinel Classic",
    price: 89,
    cuota: 9.9,
    desc: "El reloj GPS y botón SOS original de Seguxat. Pensado para mayores y para quienes pasan muchas horas solos.",
    features: ["GPS + red móvil 4G", "Botón SOS de doble pulsación", "Altavoz y micrófono para llamada bidireccional", "Autonomía hasta 5 días", "Resistencia IP67 (agua y polvo)"],
  },
  {
    id: "sentinel-active",
    name: "Sentinel Active",
    price: 119,
    cuota: 12.9,
    desc: "Pensado para deportistas, senderistas y profesionales que se desplazan a diario. Añade detección de caídas.",
    features: ["Todo lo de Sentinel Classic", "Detección automática de caídas", "Resistencia a golpes reforzada", "Modo 'ruta segura' con seguimiento en tiempo real"],
  },
  {
    id: "sentinel-kids",
    name: "Sentinel Kids",
    price: 79,
    cuota: 8.9,
    desc: "Localización y botón SOS pensado para niños, con zonas seguras configurables por los padres desde la app.",
    features: ["GPS de alta precisión", "Botón SOS único, sencillo de usar", "Zonas seguras con aviso de entrada/salida", "Sin acceso a internet ni redes sociales"],
  },
];

const ADDONS = [
  { name: "Cámara HD adicional", price: 79, cuota: 4.9 },
  { name: "Sensor de apertura adicional", price: 29, cuota: 0 },
  { name: "Detector de humo adicional", price: 45, cuota: 0 },
  { name: "Mando a distancia armado/desarmado", price: 25, cuota: 0 },
  { name: "Llavero de proximidad", price: 19, cuota: 0 },
];

const INITIAL_LEADS = [
  { id: 1, name: "Carmen Ibáñez", zone: "El Carmen", phone: "612 345 001", kit: "esencial", source: "Puerta a puerta", rep: "r1", stage: "nuevo", days: 1 },
  { id: 2, name: "Roberto Sanz", zone: "Camins al Grau", phone: "612 345 002", kit: "total", source: "Web", rep: "r3", stage: "nuevo", days: 2 },
  { id: 3, name: "Almudena Pla", zone: "Cabanyal", phone: "612 345 003", kit: "esencial", source: "Referido", rep: "r2", stage: "nuevo", days: 1 },
  { id: 4, name: "Bar El Rincón", zone: "Ruzafa", phone: "612 345 004", kit: "negocio", source: "Campaña verano", rep: "r2", stage: "nuevo", days: 3 },
  { id: 5, name: "Federico Llorca", zone: "Patraix", phone: "612 345 005", kit: "esencial", source: "Puerta a puerta", rep: "r4", stage: "contactado", days: 2 },
  { id: 6, name: "Marisa Donat", zone: "Benimaclet", phone: "612 345 006", kit: "total", source: "Escudo Vecinal", rep: "r3", stage: "contactado", days: 4 },
  { id: 7, name: "Quique Navarro", zone: "Jesús", phone: "612 345 007", kit: "esencial", source: "Referido", rep: "r4", stage: "contactado", days: 1 },
  { id: 8, name: "Pilar Esteve", zone: "Algirós", phone: "612 345 008", kit: "total", source: "Web", rep: "r3", stage: "cita", days: 1, cita: "Hoy · 17:30" },
  { id: 9, name: "Vicente Roig", zone: "Ciutat Vella", phone: "612 345 009", kit: "esencial", source: "Puerta a puerta", rep: "r1", stage: "cita", days: 3, cita: "Mañana · 10:00" },
  { id: 10, name: "Farmacia Soler", zone: "Eixample", phone: "612 345 010", kit: "negocio", source: "Referido", rep: "r2", stage: "cita", days: 2, cita: "Jueves · 12:00" },
  { id: 11, name: "Teresa Bofill", zone: "Pla del Real", phone: "612 345 011", kit: "total", source: "Campaña verano", rep: "r3", stage: "visita", days: 2 },
  { id: 12, name: "Jaume Tormo", zone: "Jesús", phone: "612 345 012", kit: "esencial", source: "Puerta a puerta", rep: "r4", stage: "visita", days: 5 },
  { id: 13, name: "Inma Calatayud", zone: "Ruzafa", phone: "612 345 013", kit: "total", source: "Referido", rep: "r2", stage: "propuesta", days: 3 },
  { id: 14, name: "Óscar Membrillo", zone: "Centro", phone: "612 345 014", kit: "esencial", source: "Escudo Vecinal", rep: "r1", stage: "propuesta", days: 1 },
  { id: 15, name: "Gimnasio Pulso", zone: "Algirós", phone: "612 345 015", kit: "negocio", source: "Web", rep: "r3", stage: "contrato", days: 1 },
  { id: 16, name: "Lola Ferrandis", zone: "Benimaclet", phone: "612 345 016", kit: "total", source: "Referido", rep: "r3", stage: "instalacion", days: 2, cita: "Viernes · 09:00" },
];

const CUSTOMERS = [
  { id: 1, name: "Mari Carmen Soriano", zone: "Ruzafa, Valencia", kit: "total", since: "03/2026", status: "Activo", next: "Revisión 09/2026", rep: "r2" },
  { id: 2, name: "Antonio Belda", zone: "Benimaclet, Valencia", kit: "esencial", since: "01/2026", status: "Activo", next: "Revisión 07/2026", rep: "r3" },
  { id: 3, name: "Restaurante La Pepica", zone: "Cabanyal, Valencia", kit: "negocio", since: "11/2025", status: "Activo", next: "Revisión 11/2026", rep: "r2" },
  { id: 4, name: "Encarna Tortosa", zone: "Patraix, Valencia", kit: "esencial", since: "02/2026", status: "Pendiente instalación", next: "Instalación 18/06", rep: "r4" },
  { id: 5, name: "Familia Gironés", zone: "Algirós, Valencia", kit: "total", since: "05/2026", status: "Activo", next: "Revisión 11/2026", rep: "r3" },
  { id: 6, name: "Ferretería Casanova", zone: "Eixample, Valencia", kit: "negocio", since: "04/2026", status: "Activo", next: "Revisión 10/2026", rep: "r2" },
  { id: 7, name: "Lola Ferrandis", zone: "Benimaclet, Valencia", kit: "total", since: "06/2026", status: "Pendiente instalación", next: "Instalación 19/06", rep: "r3" },
  { id: 8, name: "Manuel Peris", zone: "Jesús, Valencia", kit: "esencial", since: "12/2025", status: "Activo", next: "Revisión 12/2026", rep: "r4" },
];

const VENTAS_MES = [
  { mes: "Ene", instalaciones: 312, facturacion: 89400 },
  { mes: "Feb", instalaciones: 287, facturacion: 82100 },
  { mes: "Mar", instalaciones: 341, facturacion: 97600 },
  { mes: "Abr", instalaciones: 398, facturacion: 114200 },
  { mes: "May", instalaciones: 421, facturacion: 120800 },
  { mes: "Jun", instalaciones: 389, facturacion: 111500 },
];

const LEADS_ORIGEN = [
  { name: "Puerta a puerta", value: 35, color: "#0f172a" },
  { name: "Referidos", value: 25, color: "#0d9488" },
  { name: "Web", value: 20, color: "#f59e0b" },
  { name: "Escudo Vecinal", value: 12, color: "#0284c7" },
  { name: "Campañas", value: 8, color: "#7c3aed" },
];

const REP_PERF = [
  { rep: "r1", ventas: 87, objetivo: 80 },
  { rep: "r2", ventas: 103, objetivo: 90 },
  { rep: "r3", ventas: 94, objetivo: 90 },
  { rep: "r4", ventas: 71, objetivo: 80 },
];

// Técnicos instaladores con zonas de cobertura
const TECHNICIANS = [
  { id: "t1", name: "Carlos Mendoza", initials: "CM", zones: ["Patraix", "Jesús", "La Punta"], phone: "611 001 001", email: "carlos.mendoza@seguxat.es", color: "bg-emerald-600", available: true },
  { id: "t2", name: "Rubén Palau", initials: "RP", zones: ["Ruzafa", "Eixample", "Gran Via"], phone: "611 001 002", email: "ruben.palau@seguxat.es", color: "bg-sky-600", available: true },
  { id: "t3", name: "Adrián Valls", initials: "AV", zones: ["Benimaclet", "Algirós", "Pla del Real"], phone: "611 001 003", email: "adrian.valls@seguxat.es", color: "bg-violet-600", available: false },
  { id: "t4", name: "Sergio Mora", initials: "SM", zones: ["Centro", "Ciutat Vella", "Cabanyal", "El Carmen"], phone: "611 001 004", email: "sergio.mora@seguxat.es", color: "bg-rose-600", available: true },
];

// Coordinadoras con correo y color
const COORDINATORS = [
  { id: "k1", name: "Karla Gisela", initials: "KG", email: "vkarlagisela@gmail.com", color: "bg-pink-500" },
  { id: "k2", name: "María Olmos", initials: "MO", email: "maria@seguxat.es", color: "bg-indigo-500" },
];

// Instalaciones confirmadas (estado global compartido con Agenda)
const INITIAL_INSTALACIONES = [];

const AGENDA = [
  { day: "Lunes 16", items: [
    { time: "09:00", name: "Encarna Tortosa", type: "Instalación", zone: "Patraix", rep: "r4" },
    { time: "11:30", name: "Vicente Roig", type: "Primera visita", zone: "Ciutat Vella", rep: "r1" },
    { time: "17:00", name: "Marisa Donat", type: "Cita comercial", zone: "Benimaclet", rep: "r3" },
  ]},
  { day: "Martes 17", items: [
    { time: "10:00", name: "Federico Llorca", type: "Primera visita", zone: "Patraix", rep: "r4" },
    { time: "16:30", name: "Pilar Esteve", type: "Cita comercial", zone: "Algirós", rep: "r3" },
  ]},
  { day: "Miércoles 18", items: [
    { time: "09:30", name: "Encarna Tortosa", type: "Instalación", zone: "Patraix", rep: "r4" },
    { time: "12:00", name: "Farmacia Soler", type: "Cita comercial", zone: "Eixample", rep: "r2" },
    { time: "18:00", name: "Óscar Membrillo", type: "Firma contrato", zone: "Centro", rep: "r1" },
  ]},
  { day: "Jueves 19", items: [
    { time: "09:00", name: "Lola Ferrandis", type: "Instalación", zone: "Benimaclet", rep: "r3" },
    { time: "12:00", name: "Farmacia Soler", type: "Cita comercial", zone: "Eixample", rep: "r2" },
  ]},
  { day: "Viernes 20", items: [
    { time: "09:00", name: "Lola Ferrandis", type: "Instalación", zone: "Benimaclet", rep: "r3" },
    { time: "11:00", name: "Gimnasio Pulso", type: "Instalación", zone: "Algirós", rep: "r3" },
  ]},
  { day: "Sábado 21", items: [
    { time: "10:00", name: "Inma Calatayud", type: "Cita comercial", zone: "Ruzafa", rep: "r2" },
  ]},
];

const NAV = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "pipeline", label: "Citas", icon: Workflow },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "catalogo", label: "Catálogo", icon: Package },
  { id: "pagos", label: "Pagos", icon: CreditCard },
];

// Solo visible para el director: ranking comparativo de todo el equipo.
const DIRECTOR_ONLY_NAV = [
  { id: "comerciales", label: "Comerciales", icon: Trophy },
];

const PAGE_TITLES = {
  dashboard: "Resumen general",
  pipeline: "Gestión de citas",
  agenda: "Agenda de visitas",
  clientes: "Clientes",
  catalogo: "Catálogo y presupuestos",
  pagos: "Datos de pago de la empresa",
  agente: "ARIA — Agente IA Autónoma",
  comerciales: "Equipo comercial",
  empleados: "Empleados",
};

// ============================================================
// HELPERS
// ============================================================
function repById(id) { return REPS.find((r) => r.id === id); }

function Avatar({ rep, size = "w-8 h-8" }) {
  return (
    <div className={`${size} ${rep.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {rep.initials}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-serif font-bold text-slate-900 tabular-nums leading-none">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{label}</div>
        {sub && <div className="text-xs text-teal-600 mt-1 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "Activo": "bg-teal-50 text-teal-700 border-teal-200",
    "Pendiente instalación": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

// ============================================================
// VIEWS
// ============================================================
function DashboardView() {
  const totalLeadsActivos = 347;
  const citasSemana = 64;
  const mrr = 58400;
  const clientesActivos = 1847;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads activos en citas" value="1.284" sub="+94 esta semana" icon={Workflow} accent="bg-slate-900" />
        <StatCard label="Citas esta semana" value="218" sub="6 días · 48 comerciales activos" icon={CalendarDays} accent="bg-amber-500" />
        <StatCard label="Tasa de conversión" value="74%" sub="Lead → Contrato (últ. 30 días)" icon={TrendingUp} accent="bg-teal-600" />
        <StatCard label="Facturación mensual" value="111.500 €" sub="4.230 clientes en monitorización" icon={ShieldCheck} accent="bg-sky-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-serif text-base font-bold text-slate-900 mb-1">Instalaciones por mes</h3>
          <p className="text-sm text-slate-500 mb-4">Últimos 6 meses · Junio: <strong>111.500 €</strong> facturados · Media anual: 102.600 €/mes</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VENTAS_MES}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Bar dataKey="instalaciones" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Instalaciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-serif text-base font-bold text-slate-900 mb-1">Leads por origen</h3>
          <p className="text-sm text-slate-500 mb-2">Últimos 30 días</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LEADS_ORIGEN} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {LEADS_ORIGEN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {LEADS_ORIGEN.map((o) => (
              <div key={o.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                  <span className="text-slate-600">{o.name}</span>
                </div>
                <span className="text-slate-900 font-medium tabular-nums">{o.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-serif text-base font-bold text-slate-900 mb-3">Ranking comercial — junio · Objetivo: 90 contratos</h3>
          <div className="space-y-3">
            {[...REP_PERF].sort((a, b) => b.ventas - a.ventas).map((p, i) => {
              const rep = repById(p.rep);
              const pct = Math.min(100, Math.round((p.ventas / p.objetivo) * 100));
              return (
                <div key={p.rep} className="flex items-center gap-3">
                  <span className="text-sm font-serif font-bold text-slate-400 w-4">{i + 1}</span>
                  <Avatar rep={rep} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{rep.name}</span>
                      <span className="text-slate-500 tabular-nums">{p.ventas} / {p.objetivo}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-teal-600" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-serif text-base font-bold text-slate-900 mb-3">Próximas citas</h3>
          <div className="space-y-2">
            {AGENDA[0].items.concat(AGENDA[1].items.slice(0, 1)).map((item, i) => {
              const rep = repById(item.rep);
              return (
                <div key={i} className="flex items-center gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <div className="w-14 text-xs font-semibold text-slate-500 tabular-nums">{item.time}</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.zone} · {item.type}</div>
                  </div>
                  <Avatar rep={rep} size="w-6 h-6" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewLeadModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", zone: "", phone: "", kit: "esencial", source: "Puerta a puerta", rep: "r1" });
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">Nuevo lead</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Nombre / negocio</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Ej: Manuela Ferri" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Zona</label>
              <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ej: Ruzafa" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="612 000 000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Interés</label>
              <select value={form.kit} onChange={(e) => setForm({ ...form, kit: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {Object.entries(KITS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Comercial</label>
              <select value={form.rep} onChange={(e) => setForm({ ...form, rep: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Origen</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              {["Puerta a puerta", "Referido", "Web", "Escudo Vecinal", "Campaña verano"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button
            onClick={() => { if (form.name && form.zone) { onAdd(form); onClose(); } }}
            className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm font-medium text-white">
            Crear lead
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadPanel({ lead, onClose, onMove, currentUser }) {
  const rep = repById(lead.rep);
  const kit = KITS[lead.kit] || { name: lead.kit, alta: 0, cuota: 0 };
  const stageIdx = Math.max(0, STAGES.findIndex((s) => s.id === lead.stage));
  const isBusiness = lead.kit === "negocio";
  // Para leads de la API, el comercial viene como repName/repZone
  const repName = rep?.name || lead.repName || "Sin asignar";
  const repZone = rep?.zone || lead.repZone || "";
  const repInitials = repName.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase() || "?";
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-xl p-5 flex flex-col z-20">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${STAGES[stageIdx]?.color || "bg-slate-400"}`}>{STAGES[stageIdx]?.label || lead.stage}</span>
        <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      <h3 className="font-serif text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
        {isBusiness && <Building2 className="w-4 h-4 text-slate-400" />}
        {lead.name}
      </h3>
      <div className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.zone}, Valencia</div>
      {(currentUser?.role === "comercial" || currentUser?.role === "tecnico" || currentUser?.role === "director") ? (
        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lead.phone}</div>
      ) : (
        <div className="text-sm text-slate-300 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /><span className="italic">Teléfono restringido</span></div>
      )}

      <div className="mt-4 bg-slate-50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Producto de interés</span><span className="font-medium text-slate-900">{kit.name}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Alta + cuota</span><span className="font-medium text-slate-900 tabular-nums">{kit.alta} € + {kit.cuota.toFixed(2).replace(".", ",")} €/mes</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Origen</span><span className="font-medium text-slate-900">{lead.source}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Días en esta fase</span><span className="font-medium text-slate-900 tabular-nums">{lead.days || 0}</span></div>
        {lead.cita && <div className="flex justify-between text-sm"><span className="text-slate-500">Próxima cita</span><span className="font-medium text-teal-600">{lead.cita}</span></div>}
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-slate-500 mb-2">Comercial asignado</div>
        <div className="flex items-center gap-2">
          {rep ? <Avatar rep={rep} /> : <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">{repInitials}</div>}
          <div>
            <div className="text-sm font-medium text-slate-900">{repName}</div>
            <div className="text-xs text-slate-500">{repZone}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
        <button disabled={stageIdx === 0} onClick={() => onMove(lead.id, -1)}
          className="flex-1 flex items-center justify-center gap-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
        {stageIdx === STAGES.length - 1 ? (
          <button disabled className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 rounded-lg py-2 text-sm font-medium text-white opacity-60">
            <CheckCircle2 className="w-4 h-4" /> Completado
          </button>
        ) : (
          <button onClick={() => {
            const nextStage = STAGES[stageIdx + 1].id;
            onMove(lead.id, 1, nextStage);
          }}
            className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm font-medium text-white">
            {STAGES[stageIdx + 1]?.id === "cita" || STAGES[stageIdx + 1]?.id === "instalacion" || STAGES[stageIdx + 1]?.id === "contrato"
              ? <><CalendarDays className="w-4 h-4" /> Agendar cita</>
              : <>Avanzar <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        )}
      </div>
    </div>
  );
}

function PipelineView({ leads, setLeads, loading, token, moveLeadStage, createLead, currentUser, onGoToAgenda }) {
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // dir: -1/+1 direction, nextStage: optional explicit target stage
  function moveStage(id, dir, nextStage) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const idx = STAGES.findIndex((s) => s.id === lead.stage);
    const newIdx = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
    const newStage = nextStage || STAGES[newIdx].id;
    moveLeadStage(id, newStage);
    const updatedLead = { ...lead, stage: newStage, days: 0 };
    setSelected((sel) => sel && sel.id === id ? updatedLead : sel);
    // Si avanza a cita/contrato/instalacion → ir directo a Agenda con modal abierto
    if (["cita","contrato","instalacion"].includes(newStage) && onGoToAgenda) {
      setTimeout(() => {
        setSelected(null);
        onGoToAgenda(updatedLead);
      }, 400);
    }
  }

  function addLead(form) {
    createLead(form);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{loading ? "Cargando leads..." : `${leads.length} leads en el embudo · pulsa una tarjeta para ver el detalle`}</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo lead
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.id);
          const value = items.reduce((acc, l) => acc + KITS[l.kit].cuota, 0);
          return (
            <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col">
              <div className={`h-1 rounded-full ${stage.color} mb-2`} />
              <div className="flex items-baseline justify-between mb-3 px-0.5">
                <h3 className="text-sm font-semibold text-slate-700">{stage.label}</h3>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 260px)" }}>
                {items.map((lead) => {
                  const rep = repById(lead.rep);
                  const isBusiness = lead.kit === "negocio";
                  const initials = (lead.repName || "").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase() || "?";
                  return (
                    <button key={lead.id} onClick={() => setSelected(lead)}
                      className="w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-amber-400 hover:shadow-sm transition">
                      <div className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
                        {isBusiness && <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                        {lead.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{lead.zone}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium text-amber-600">{KITS[lead.kit]?.name || lead.kit}</span>
                        {rep ? <Avatar rep={rep} size="w-6 h-6" /> : <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white text-[9px] font-bold">{initials}</div>}
                      </div>
                      {lead.cita && <div className="text-xs text-teal-600 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />{lead.cita}</div>}
                    </button>
                  );
                })}
                {items.length === 0 && <div className="text-xs text-slate-400 italic px-1 py-2">Sin leads en esta fase</div>}
              </div>
              <div className="text-xs text-slate-400 mt-2 px-0.5 tabular-nums">{value.toFixed(2).replace(".", ",")} €/mes potencial</div>
            </div>
          );
        })}
      </div>
      {selected && <LeadPanel lead={selected} onClose={() => setSelected(null)} onMove={moveStage} currentUser={currentUser} />}
      {showModal && <NewLeadModal onClose={() => setShowModal(false)} onAdd={addLead} />}
    </div>
  );
}

// ============================================================
// AGENDA — Módulo profesional de instalaciones
// ============================================================

function techById(id) { return TECHNICIANS.find((t) => t.id === id); }
function coordById(id) { return COORDINATORS.find((c) => c.id === id); }

function TechAvatar({ tech, size = "w-8 h-8" }) {
  if (!tech) return null;
  return (
    <div className={`${size} ${tech.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {tech.initials}
    </div>
  );
}

// Modal de asignación de cita de instalación
function AsignarCitaModal({ lead, onClose, onConfirm }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [techId, setTechId] = useState("");
  const [coordId, setCoordId] = useState("k1");
  const [clientPhone, setClientPhone] = useState(lead?.phone || "");
  const [clientEmail, setClientEmail] = useState("");
  const [step, setStep] = useState("form"); // form | confirm | sending | success

  // Técnicos que cubren la zona del lead
  const zone = lead?.zone || "";
  const matchingTechs = TECHNICIANS.filter((t) =>
    t.zones.some((z) => zone.toLowerCase().includes(z.toLowerCase()) || z.toLowerCase().includes(zone.toLowerCase()))
  );
  const otherTechs = TECHNICIANS.filter((t) => !matchingTechs.find((m) => m.id === t.id));

  const selectedTech = techById(techId);
  const selectedCoord = coordById(coordId);

  const hoursOptions = ["08:00","09:00","10:00","10:30","11:00","11:30","12:00","16:00","16:30","17:00","17:30","18:00"];

  function handleConfirm() {
    if (!date || !time || !techId) return;
    setStep("sending");
    // Simular envío (1.8s)
    setTimeout(() => {
      setStep("success");
      onConfirm({
        leadName: lead.name,
        zone: lead.zone,
        kit: lead.kit,
        techId,
        date,
        time,
        coordinatorId: coordId,
        clientPhone,
        clientEmail,
        status: "confirmada",
        notified: true,
      });
    }, 1800);
  }

  const dateLabel = date ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "";

  if (step === "success") {
    const tech = techById(techId);
    const coord = coordById(coordId);
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">¡Cita confirmada!</h3>
          <p className="text-sm text-slate-500 mb-5">Las notificaciones se han enviado correctamente.</p>

          {/* Notificación al cliente */}
          <div className="bg-slate-50 rounded-xl p-4 mb-3 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">SMS enviado al cliente</span>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Entregado</span>
            </div>
            <div className="bg-green-500 text-white text-xs rounded-2xl rounded-tl-none px-3 py-2 max-w-[85%] leading-relaxed">
              Hola {lead.name}, su instalación Seguxat está confirmada para el <strong>{dateLabel}</strong> a las <strong>{time}h</strong>. Le atenderá {tech?.name}. ¿Dudas? Llame al 910 626 738.
            </div>
            {clientEmail && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email al cliente</span>
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Enviado</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
                  <div className="font-medium mb-0.5">Confirmación de instalación — Seguxat</div>
                  <div className="text-slate-500">Para: {clientEmail}</div>
                  <div className="text-slate-500 mt-1">Su cita está programada para el <strong>{dateLabel}</strong> a las <strong>{time}h</strong> en {lead.zone}.</div>
                </div>
              </div>
            )}
          </div>

          {/* Notificación al técnico */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <TechAvatar tech={tech} size="w-6 h-6" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Notificación al técnico</span>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Enviado</span>
            </div>
            <div className="bg-slate-800 text-white text-xs rounded-2xl rounded-tl-none px-3 py-2 max-w-[90%] leading-relaxed">
              📋 Nueva instalación asignada: <strong>{lead.name}</strong> · {lead.zone} · Kit {KITS[lead.kit]?.name} · <strong>{dateLabel} {time}h</strong>. Coordinadora: {coord?.name}.
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Email enviado a {tech?.email}</span>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓</span>
            </div>
          </div>

          {/* Gestionado por */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-5">
            <div className={`w-5 h-5 ${coord?.color} rounded-full flex items-center justify-center text-white text-[9px] font-bold`}>{coord?.initials}</div>
            Gestionado por <strong className="text-slate-600">{coord?.name}</strong> · {coord?.email}
          </div>

          <button onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl py-3">
            Volver a la agenda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Asignar cita de instalación</h3>
            <p className="text-xs text-slate-500 mt-0.5">{lead?.name} · {lead?.zone} · Kit {KITS[lead?.kit]?.name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {step === "sending" && (
          <div className="p-10 text-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-700">Enviando notificaciones…</p>
            <p className="text-xs text-slate-400 mt-1">SMS al cliente · Email al técnico · Registro en agenda</p>
          </div>
        )}

        {step === "form" && (
          <div className="p-6 space-y-5">
            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Fecha de instalación</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min="2026-06-23"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Hora</label>
                <select value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  {hoursOptions.map((h) => <option key={h} value={h}>{h}h</option>)}
                </select>
              </div>
            </div>

            {/* Técnico */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Técnico instalador</label>
              {matchingTechs.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-emerald-600 font-medium mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Cubren la zona "{zone}"
                  </div>
                  <div className="space-y-2">
                    {matchingTechs.map((t) => (
                      <button key={t.id} onClick={() => setTechId(t.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${techId === t.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                        <TechAvatar tech={t} />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.zones.join(" · ")}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {t.available ? "Disponible" : "Ocupado"}
                        </span>
                        {techId === t.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {otherTechs.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Otros técnicos (fuera de zona)</summary>
                  <div className="space-y-2 mt-2">
                    {otherTechs.map((t) => (
                      <button key={t.id} onClick={() => setTechId(t.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${techId === t.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300 opacity-60"}`}>
                        <TechAvatar tech={t} />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.zones.join(" · ")}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {t.available ? "Disponible" : "Ocupado"}
                        </span>
                        {techId === t.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Coordinadora */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Coordinadora responsable</label>
              <div className="flex gap-3">
                {COORDINATORS.map((c) => (
                  <button key={c.id} onClick={() => setCoordId(c.id)}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border transition ${coordId === c.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className={`w-8 h-8 ${c.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{c.initials}</div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </div>
                    {coordId === c.id && <CheckCircle2 className="w-4 h-4 text-indigo-500 ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacto cliente */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Notificación al cliente</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Teléfono (SMS)</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={clientPhone ? clientPhone.replace(/\d(?=\d{3})/g, "•") : ""}
                      readOnly
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-500 cursor-not-allowed tracking-widest" />
                  </div>
                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Número enmascarado · Solo visible para comercial e instalador asignado
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={clientEmail ? clientEmail.replace(/(?<=.{2}).(?=.*@)/g, "•") : ""}
                      readOnly
                      placeholder="sin email registrado"
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-500 cursor-not-allowed tracking-wide" />
                  </div>
                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Email enmascarado · Solo visible para comercial e instalador asignado
                  </div>
                </div>
              </div>
            </div>

            {/* Preview del SMS */}
            {date && techId && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Preview SMS al cliente
                </div>
                <div className="bg-green-500 text-white text-xs rounded-2xl rounded-tl-none px-3 py-2 max-w-[85%] leading-relaxed">
                  Hola {lead?.name}, su instalación Seguxat está confirmada para el <strong>{dateLabel}</strong> a las <strong>{time}h</strong>. Le atenderá {selectedTech?.name}. ¿Dudas? Llame al 910 626 738.
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 border border-slate-300 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                disabled={!date || !time || !techId}
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" /> Confirmar y notificar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgendaView({ currentUser, instalaciones, setInstalaciones, leads, token, autoLead, clearAutoLead }) {
  const [modalLead, setModalLead] = useState(null);

  // Cargar instalaciones desde API al montar
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/instalaciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.instalaciones) setInstalaciones(data.instalaciones); })
      .catch(() => {});
  }, [token]);

  // Auto-abrir modal si venimos desde Pipeline con un lead
  useEffect(() => {
    if (autoLead) {
      setModalLead(autoLead);
      if (clearAutoLead) clearAutoLead();
    }
  }, [autoLead]);
  const [filterTech, setFilterTech] = useState("all");
  const [filterCoord, setFilterCoord] = useState("all");

  // Detectar si el usuario logueado es coordinadora (Karla o María)
  const myCoord = COORDINATORS.find((c) => c.email === currentUser?.email);
  const isCoordinadora = !!myCoord;
  const [viewMode, setViewMode] = useState(isCoordinadora ? "mias" : "semana"); // semana | tecnicos | coordinadoras | mias

  // Leads en fase instalación/contrato = candidatos a asignar (desde estado global)
  const leadsInstalacion = (leads || INITIAL_LEADS).filter((l) => l.stage === "instalacion" || l.stage === "contrato");

  function handleConfirm(data) {
    if (token) {
      fetch(`${API_BASE}/instalaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
        .then(r => r.json())
        .then(d => { if (d.instalacion) setInstalaciones(prev => [...prev, d.instalacion]); })
        .catch(() => setInstalaciones(prev => [...prev, { id: "i" + Date.now(), ...data }]));
    } else {
      setInstalaciones(prev => [...prev, { id: "i" + Date.now(), ...data }]);
    }
    setModalLead(null);
  }

  const filtered = instalaciones.filter((i) => {
    if (filterTech !== "all" && i.techId !== filterTech) return false;
    if (filterCoord !== "all" && i.coordinatorId !== filterCoord) return false;
    return true;
  });

  // Agrupar por fecha para vista semanal
  const byDate = filtered.reduce((acc, inst) => {
    if (!acc[inst.date]) acc[inst.date] = [];
    acc[inst.date].push(inst);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort();

  const typeColor = { "confirmada": "bg-emerald-100 text-emerald-700", "pendiente": "bg-amber-100 text-amber-700", "realizada": "bg-slate-100 text-slate-600" };

  return (
    <div className="space-y-5">
      {/* Header con controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(isCoordinadora
            ? [["mias", "Mis instalaciones"], ["semana", "Calendario general"], ["tecnicos", "Por técnico"]]
            : [["semana", "Calendario"], ["tecnicos", "Por técnico"], ["coordinadoras", "Por coordinadora"]]
          ).map(([id, label]) => (
            <button key={id} onClick={() => setViewMode(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">Todos los técnicos</option>
            {TECHNICIANS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterCoord} onChange={(e) => setFilterCoord(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="all">Todas las coordinadoras</option>
            {COORDINATORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Leads pendientes de asignar */}
      {leadsInstalacion.filter((l) => !instalaciones.find((i) => i.leadName === l.name)).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Leads listos para asignar instalación</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {leadsInstalacion.filter((l) => !instalaciones.find((i) => i.leadName === l.name)).map((l) => (
              <button key={l.id} onClick={() => setModalLead(l)}
                className="flex items-center gap-2 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 transition">
                <Plus className="w-3.5 h-3.5" />
                {l.name} · {l.zone}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vista calendario semanal */}
      {viewMode === "semana" && (
        <div className="space-y-3">
          {sortedDates.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              No hay instalaciones programadas con los filtros actuales.
            </div>
          )}
          {sortedDates.map((date) => {
            const dateObj = new Date(date + "T12:00:00");
            const dayLabel = dateObj.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
            const items = byDate[date].sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-white text-sm font-semibold capitalize">{dayLabel}</span>
                  <span className="text-slate-400 text-xs">{items.length} instalación{items.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((inst, i) => {
                    const tech = techById(inst.techId);
                    const coord = coordById(inst.coordinatorId);
                    return (
                      <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                        <div className="text-sm font-bold text-slate-900 tabular-nums w-14 shrink-0">{inst.time}h</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{inst.leadName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{inst.zone} · {KITS[inst.kit]?.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TechAvatar tech={tech} size="w-7 h-7" />
                          <div className="hidden sm:block">
                            <div className="text-xs font-medium text-slate-700">{tech?.name}</div>
                            <div className="text-xs text-slate-400">{coord?.name}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColor[inst.status] || "bg-slate-100 text-slate-600"}`}>
                          {inst.status}
                        </span>
                        {inst.notified && (
                          <div className="flex items-center gap-1 shrink-0" title="Notificado">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista por técnico */}
      {viewMode === "tecnicos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TECHNICIANS.map((tech) => {
            const techInst = filtered.filter((i) => i.techId === tech.id).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
            return (
              <div key={tech.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`px-4 py-3 flex items-center gap-3 ${tech.color} bg-opacity-10`} style={{ background: "var(--color-background-secondary)" }}>
                  <TechAvatar tech={tech} />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{tech.name}</div>
                    <div className="text-xs text-slate-500">{tech.zones.join(" · ")}</div>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${tech.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {tech.available ? "Disponible" : "Ocupado"}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {techInst.length === 0 && <div className="px-4 py-4 text-xs text-slate-400 italic">Sin instalaciones asignadas</div>}
                  {techInst.map((inst, i) => {
                    const dateObj = new Date(inst.date + "T12:00:00");
                    const dayLabel = dateObj.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
                    const coord = coordById(inst.coordinatorId);
                    return (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500 capitalize">{dayLabel} · {inst.time}h</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[inst.status] || "bg-slate-100 text-slate-600"}`}>{inst.status}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-900 mt-0.5">{inst.leadName}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{inst.zone} · {KITS[inst.kit]?.name}</div>
                          {inst.notified && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Notificado</span>}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Coord: {coord?.name}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="w-3 h-3" />{tech.email}
                  <span className="mx-1 text-slate-300">·</span>
                  <ShieldCheck className="w-3 h-3 text-slate-400" /><span className="text-slate-400">Tel. interno</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista por coordinadora */}
      {viewMode === "coordinadoras" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COORDINATORS.map((coord) => {
            const coordInst = filtered.filter((i) => i.coordinatorId === coord.id).sort((a, b) => a.date.localeCompare(b.date));
            const notified = coordInst.filter((i) => i.notified).length;
            return (
              <div key={coord.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                  <div className={`w-10 h-10 ${coord.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>{coord.initials}</div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{coord.name}</div>
                    <div className="text-xs text-slate-500">{coord.email}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">{coordInst.length}</div>
                    <div className="text-xs text-slate-400">instalaciones</div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {coordInst.length === 0 && <div className="px-4 py-4 text-xs text-slate-400 italic">Sin instalaciones gestionadas</div>}
                  {coordInst.map((inst, i) => {
                    const tech = techById(inst.techId);
                    const dateObj = new Date(inst.date + "T12:00:00");
                    const dayLabel = dateObj.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={i} className="px-4 py-3 flex items-center gap-3">
                        <div className="text-xs text-slate-500 w-24 shrink-0 capitalize">{dayLabel} · {inst.time}h</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{inst.leadName}</div>
                          <div className="text-xs text-slate-500">{inst.zone} · {tech?.name}</div>
                        </div>
                        {inst.notified
                          ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">✓ Notificado</span>
                          : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">Pendiente</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                  {notified} de {coordInst.length} clientes notificados
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista personal de coordinadora — "Mis instalaciones" */}
      {viewMode === "mias" && myCoord && (
        <div className="space-y-4">
          {/* Header personal */}
          <div className={`rounded-2xl p-5 flex items-center gap-4 ${myCoord.color} bg-opacity-10`} style={{background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #e2e8f0"}}>
            <div className={`w-14 h-14 ${myCoord.color} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm`}>
              {myCoord.initials}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{myCoord.name}</div>
              <div className="text-sm text-slate-500">{myCoord.email}</div>
              <div className="text-xs text-slate-400 mt-0.5">Coordinadora de instalaciones · Seguxat Valencia</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{instalaciones.filter(i => i.coordinatorId === myCoord.id).length}</div>
              <div className="text-xs text-slate-500">instalaciones gestionadas</div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                {instalaciones.filter(i => i.coordinatorId === myCoord.id && i.notified).length} clientes notificados
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Confirmadas", val: instalaciones.filter(i => i.coordinatorId === myCoord.id && i.status === "confirmada").length, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Pendientes", val: instalaciones.filter(i => i.coordinatorId === myCoord.id && i.status === "pendiente").length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Esta semana", val: instalaciones.filter(i => i.coordinatorId === myCoord.id).length, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.val}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Calendario personal — mis instalaciones por fecha */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">Mis instalaciones programadas</span>
              <button onClick={() => setModalLead(leadsInstalacion.find(l => !instalaciones.find(i => i.leadName === l.name)) || null)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Nueva asignación
              </button>
            </div>
            {instalaciones.filter(i => i.coordinatorId === myCoord.id).length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No tienes instalaciones asignadas aún.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {instalaciones
                  .filter(i => i.coordinatorId === myCoord.id)
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .map((inst, idx) => {
                    const tech = techById(inst.techId);
                    const dateObj = new Date(inst.date + "T12:00:00");
                    const dayLabel = dateObj.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
                    const isToday = inst.date === new Date().toISOString().split("T")[0];
                    return (
                      <div key={idx} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 ${isToday ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}>
                        <div className="text-center w-16 shrink-0">
                          <div className="text-xs text-slate-400 capitalize">{dateObj.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                          <div className="text-xl font-bold text-slate-900 tabular-nums">{dateObj.getDate()}</div>
                          <div className="text-xs text-slate-400">{inst.time}h</div>
                        </div>
                        <div className="w-px h-12 bg-slate-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm">{inst.leadName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{inst.zone} · {KITS[inst.kit]?.name}
                          </div>
                          {isToday && <div className="text-xs text-emerald-600 font-medium mt-0.5">● Hoy</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TechAvatar tech={tech} size="w-8 h-8" />
                          <div>
                            <div className="text-xs font-medium text-slate-700">{tech?.name}</div>
                            <div className="text-xs text-slate-400">📱 Interno</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inst.status === "confirmada" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {inst.status}
                          </span>
                          {inst.notified
                            ? <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Notificado</span>
                            : <span className="text-xs text-amber-600">Sin notificar</span>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Mis técnicos — resumen rápido de a quién tengo asignado */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="font-semibold text-slate-900 text-sm mb-3">Técnicos con los que trabajo</div>
            <div className="grid grid-cols-2 gap-3">
              {TECHNICIANS.filter(t => instalaciones.some(i => i.coordinatorId === myCoord.id && i.techId === t.id)).map((tech) => {
                const myWithTech = instalaciones.filter(i => i.coordinatorId === myCoord.id && i.techId === tech.id);
                return (
                  <div key={tech.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <TechAvatar tech={tech} size="w-9 h-9" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{tech.name}</div>
                      <div className="text-xs text-slate-500">{myWithTech.length} instalación{myWithTech.length !== 1 ? "es" : ""}</div>
                      <div className="text-xs text-slate-400">{tech.phone}</div>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${tech.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {tech.available ? "Libre" : "Ocupado"}
                    </span>
                  </div>
                );
              })}
              {!instalaciones.some(i => i.coordinatorId === myCoord.id) && (
                <div className="col-span-2 text-xs text-slate-400 italic">Aún no tienes técnicos asignados.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de asignación */}
      {modalLead && (
        <AsignarCitaModal lead={modalLead} onClose={() => setModalLead(null)} onConfirm={handleConfirm} />
      )}
    </div>
  );
}

function ClientesView() {
  const [search, setSearch] = useState("");
  const filtered = CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.zone.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o zona..."
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <span className="text-sm text-slate-500 ml-auto">{filtered.length} clientes</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-4 py-2 font-medium">Cliente</th>
            <th className="px-4 py-2 font-medium">Zona</th>
            <th className="px-4 py-2 font-medium">Plan</th>
            <th className="px-4 py-2 font-medium">Cliente desde</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Próximo evento</th>
            <th className="px-4 py-2 font-medium">Comercial</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
              <td className="px-4 py-3 text-slate-500">{c.zone}</td>
              <td className="px-4 py-3 text-slate-700">{KITS[c.kit].name}</td>
              <td className="px-4 py-3 text-slate-500 tabular-nums">{c.since}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              <td className="px-4 py-3 text-slate-500">{c.next}</td>
              <td className="px-4 py-3"><Avatar rep={repById(c.rep)} size="w-6 h-6" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CatalogoView() {
  const [tab, setTab] = useState("kits");
  const [selectedKit, setSelectedKit] = useState("total");
  const [clientName, setClientName] = useState("");
  const [generated, setGenerated] = useState(false);

  const TABS = [
    { id: "kits", label: "🛡️ Kits de alarma" },
    { id: "camaras", label: "📷 Cámaras HD" },
    { id: "sentinel", label: "⌚ Sentinel Watch" },
    { id: "central", label: "🖥️ Centrales y grabadoras" },
    { id: "addons", label: "➕ Complementos" },
  ];

  const KITS_PRO = [
    {
      id: "esencial",
      name: "Hogar Esencial",
      badge: null,
      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      precio: 199, cuota: 24.90,
      desc: "Protección inteligente para pisos y apartamentos. Instalación en 2 horas.",
      color: "from-slate-700 to-slate-900",
      features: ["Central de alarma con batería 24h","2 sensores apertura puerta/ventana","1 detector movimiento PIR 10m","Sirena interior 110dB","App Seguxat iOS/Android","Monitorización CRA 24/7","Respuesta policial en 180s"],
    },
    {
      id: "total",
      name: "Hogar Total",
      badge: "⭐ Más vendido",
      img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
      precio: 349, cuota: 34.90,
      desc: "La protección completa con videovigilancia HD y detección de humo.",
      color: "from-amber-600 to-amber-800",
      features: ["Todo lo de Esencial incluido","4 sensores apertura puerta/ventana","2 cámaras HD 2K interior/exterior","Sirena exterior autoalimentada flash","Detector humo y CO conectado","Videoverificación antes de avisar a policía","Clips de vídeo 30s ante cada alerta","Historial eventos 90 días en nube"],
    },
    {
      id: "negocio",
      name: "Seguxat Business",
      badge: "🏢 Negocios",
      img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
      precio: 599, cuota: 49.90,
      desc: "Seguridad empresarial con control de accesos y respuesta prioritaria.",
      color: "from-violet-700 to-violet-900",
      features: ["Central profesional multi-zona","Sensores perimetrales ilimitados","4 cámaras HD 4K con IA antifalsas alarmas","Botón pánico personal para empleados","Respuesta prioritaria CRA < 90 segundos","Control horario apertura/cierre negocio","Informes mensuales para el titular","Integración con cerradura electrónica"],
    },
  ];

  const CAMARAS = [
    { name: "Cámara Exterior Pro 4K", precio: 149, cuota: 4.90, img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80", features: ["4K Ultra HD · 8MP","Visión nocturna 30m a color","Detección IA personas/vehículos","IP67 resistente intemperie","Ángulo 130°"], badge: "Nuevo 2026" },
    { name: "Cámara Interior 360°", precio: 99, cuota: 2.90, img: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400&q=80", features: ["2K Full HD · 360° panorámica","Seguimiento automático movimiento","Audio bidireccional","Modo privacidad físico","Detección bebé/mascota"], badge: null },
    { name: "Videoportero HD", precio: 199, cuota: 3.90, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", features: ["Pantalla táctil 7 pulgadas HD","Cámara gran angular 160°","Apertura remota desde app","Grabación visitantes 30 días","Compatible cerradura eléctrica"], badge: "Top ventas" },
    { name: "Cámara Domo PTZ", precio: 249, cuota: 6.90, img: "https://images.unsplash.com/photo-1523474438810-b04a2480633c?w=400&q=80", features: ["Rotación 360° · Zoom 20x óptico","Seguimiento automático objetivos","4K con IR hasta 50m","Uso interior/exterior IP66","Ideal para negocios y locales"], badge: "Business" },
  ];

  const GRABADORAS = [
    { name: "NVR Seguxat 8 canales", precio: 349, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", features: ["8 cámaras IP simultáneas","Disco duro 4TB incluido","Almacenamiento 30 días en local","Acceso remoto app y web","HDMI 4K para monitor"] },
    { name: "NVR Pro 16 canales", precio: 549, img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", features: ["16 cámaras IP simultáneas","2x HDD 8TB RAID","IA detección facial integrada","Exportación USB encriptada","Ideal para grandes negocios"] },
    { name: "Central Alarma Pro X1", precio: 299, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", features: ["32 zonas programables","Batería 72h autonomía","GSM + WiFi + LAN triple conexión","Teclado táctil retroiluminado","Compatible con todos los kits Seguxat"] },
  ];

  const SENTINEL_PRO = [
    {
      id: "classic", name: "Sentinel Classic", precio: 89, cuota: 9.90,
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
      color: "from-slate-600 to-slate-800",
      features: ["GPS tiempo real","Botón SOS · llamada a CRA","Podómetro y frecuencia cardíaca","Batería 5 días","Resistente agua IP68","App familiar en tiempo real"],
      desc: "Seguridad personal para adultos mayores y personas en riesgo.",
    },
    {
      id: "active", name: "Sentinel Active", precio: 149, cuota: 12.90,
      img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80",
      color: "from-emerald-600 to-emerald-900",
      features: ["GPS + Galileo de alta precisión","Botón SOS triple · llamada + SMS + CRA","ECG y SpO2 en tiempo real","Detección caída automática","Batería 7 días","Pantalla AMOLED 1.5"","Logo Seguxat grabado en acero"],
      desc: "El smartwatch de seguridad más avanzado del mercado. Para quien no acepta compromisos.",
      badge: "Premium 2026",
    },
    {
      id: "kids", name: "Sentinel Kids", precio: 79, cuota: 9.90,
      img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80",
      color: "from-sky-500 to-sky-800",
      features: ["GPS en tiempo real para niños","Botón SOS directo a padres","Zona segura configurable (geovalla)","Chat de voz con padres","Resistente golpes y agua","Batería 4 días","Diseño divertido y ligero"],
      desc: "Tranquilidad para padres. Libertad para niños.",
    },
  ];

  const sk = KITS[selectedKit] || KITS.total;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${tab===t.id ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KITS */}
      {tab === "kits" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {KITS_PRO.map(k => (
            <div key={k.id} onClick={() => { setSelectedKit(k.id); setGenerated(false); }}
              className={`rounded-2xl border overflow-hidden cursor-pointer transition hover:shadow-lg ${selectedKit===k.id ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"} bg-white flex flex-col`}>
              {/* Image */}
              <div className={`h-44 bg-gradient-to-br ${k.color} relative overflow-hidden`}>
                <img src={k.img} alt={k.name} className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  {k.badge && <span className="self-start text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold mb-2">{k.badge}</span>}
                  <div className="text-white text-xl font-bold">{k.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{k.desc}</div>
                </div>
                {selectedKit===k.id && <div className="absolute top-3 right-3 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
              </div>
              {/* Features */}
              <div className="p-4 flex-1 flex flex-col">
                <ul className="space-y-1.5 flex-1 mb-4">
                  {k.features.map((f,i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{k.precio} €</div>
                    <div className="text-xs text-slate-400">instalación · luego <strong>{k.cuota.toFixed(2).replace(".",",")} €/mes</strong></div>
                  </div>
                  <button className={`px-4 py-2 rounded-xl text-sm font-semibold ${selectedKit===k.id ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                    {selectedKit===k.id ? "✓ Seleccionado" : "Seleccionar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CÁMARAS */}
      {tab === "camaras" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {CAMARAS.map((c,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition flex flex-col">
              <div className="h-40 overflow-hidden relative">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                {c.badge && <span className="absolute top-2 left-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold">{c.badge}</span>}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-bold text-slate-900 text-sm mb-2">{c.name}</div>
                <ul className="space-y-1 flex-1 mb-3">
                  {c.features.map((f,j) => <li key={j} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-emerald-500 shrink-0">✓</span>{f}</li>)}
                </ul>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">{c.precio} €</div>
                    <div className="text-xs text-slate-400">+{c.cuota.toFixed(2).replace(".",",")} €/mes</div>
                  </div>
                  <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-slate-700">Añadir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SENTINEL WATCH */}
      {tab === "sentinel" && (
        <div>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-5 flex items-center gap-5">
            <div className="flex-1">
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">Exclusivo Seguxat 2026</div>
              <div className="text-white text-2xl font-bold mb-1">Gama Sentinel Watch</div>
              <div className="text-slate-400 text-sm">El único smartwatch de seguridad conectado directamente con nuestra Central Receptora de Alarmas. Más avanzado que cualquier producto Verisure o Securitas Direct.</div>
            </div>
            <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=200&q=80" alt="Sentinel" className="w-28 h-28 rounded-2xl object-cover shrink-0 border-2 border-amber-500/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SENTINEL_PRO.map(s => (
              <div key={s.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition flex flex-col">
                <div className={`h-48 bg-gradient-to-br ${s.color} relative overflow-hidden`}>
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    {s.badge && <span className="self-start text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold mb-2">{s.badge}</span>}
                    <div className="text-white text-lg font-bold">{s.name}</div>
                    <div className="text-white/70 text-xs mt-0.5">{s.desc}</div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {s.features.map((f,i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{f}</li>)}
                  </ul>
                  <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xl font-bold text-slate-900">{s.precio} €</div>
                      <div className="text-xs text-slate-400">dispositivo · +{s.cuota.toFixed(2).replace(".",",")} €/mes</div>
                    </div>
                    <button className="text-xs bg-slate-900 text-white px-3 py-2 rounded-xl font-semibold hover:bg-slate-700">Añadir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CENTRALES Y GRABADORAS */}
      {tab === "central" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GRABADORAS.map((g,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col">
              <div className="h-40 overflow-hidden">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-bold text-slate-900 text-sm mb-2">{g.name}</div>
                <ul className="space-y-1 flex-1 mb-3">
                  {g.features.map((f,j) => <li key={j} className="text-xs text-slate-500 flex items-start gap-1"><span className="text-emerald-500 shrink-0">✓</span>{f}</li>)}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-900 text-lg">{g.precio} €</div>
                  <button className="text-xs bg-slate-900 text-white px-3 py-2 rounded-xl font-semibold hover:bg-slate-700">Añadir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLEMENTOS */}
      {tab === "addons" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADDONS.map((a,i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition">
              <div>
                <div className="text-sm font-medium text-slate-900">{a.name}</div>
                {a.cuota > 0 && <div className="text-xs text-slate-400 mt-0.5">+{a.cuota.toFixed(2).replace(".",",")} €/mes adicionales</div>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="font-bold text-slate-900">{a.price} €</div>
                <button className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-0.5">+ Añadir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generador de presupuesto */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <Banknote className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Generador de presupuesto</div>
            <div className="text-xs text-slate-400">Kit seleccionado: <strong>{KITS[selectedKit]?.name || "Hogar Total"}</strong></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input value={clientName} onChange={e => { setClientName(e.target.value); setGenerated(false); }}
            placeholder="Nombre del cliente"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button onClick={() => setGenerated(true)} disabled={!clientName}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-5 py-2.5">
            Generar presupuesto
          </button>
        </div>
        {generated && (
          <div className="border border-dashed border-amber-300 rounded-xl p-5 bg-amber-50/40">
            <div className="text-xs uppercase tracking-widest text-amber-600 font-bold mb-3">Presupuesto Seguxat — {new Date().toLocaleDateString("es-ES")}</div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Cliente</span><span className="font-semibold text-slate-900">{clientName}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Plan contratado</span><span className="font-semibold text-slate-900">{KITS[selectedKit]?.name}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Instalación (pago único)</span><span className="font-semibold text-slate-900 tabular-nums">{KITS[selectedKit]?.alta} €</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">Cuota mensual monitorización 24/7</span><span className="font-semibold text-slate-900 tabular-nums">{KITS[selectedKit]?.cuota.toFixed(2).replace(".",",")} €/mes</span></div>
            <div className="flex justify-between text-sm pt-3 mt-2 border-t border-amber-200">
              <span className="font-bold text-slate-900">Total primer mes</span>
              <span className="font-bold text-xl text-amber-600 tabular-nums">{((KITS[selectedKit]?.alta||0) + (KITS[selectedKit]?.cuota||0)).toFixed(2).replace(".",",")} €</span>
            </div>
            <div className="mt-3 text-xs text-slate-400 italic">Presupuesto válido 30 días · Sin permanencia · Instalación incluida en precio indicado</div>
          </div>
        )}
      </div>
    </div>
  );
}


function AgenteView({ leads, instalaciones, token }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy **ARIA** — Agente de Revisión Inteligente Automatizada de Seguxat. Analizo el pipeline, detecto oportunidades, superviso instalaciones y genero informes en tiempo real. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoLog, setAutoLog] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-análisis cada 60s si modo autónomo activo
  useEffect(() => {
    if (!autoMode) return;
    const tasks = [
      "Analiza los leads sin actividad en más de 3 días y sugiere acciones.",
      "Revisa qué instalaciones están pendientes de confirmar y priorízalas.",
      "Detecta qué zonas tienen más leads nuevos esta semana.",
      "Genera un resumen ejecutivo del estado actual del pipeline.",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const task = tasks[idx % tasks.length];
      idx++;
      const ts = new Date().toLocaleTimeString("es-ES", {hour:"2-digit",minute:"2-digit",second:"2-digit"});
      setAutoLog(prev => [...prev.slice(-9), { ts, task, status: "ejecutando" }]);
      sendMessage(task, true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoMode, leads]);

  const stageLabels = { nuevo:"Nuevo", contactado:"Contactado", cita:"Cita agendada", visita:"Visita realizada", propuesta:"Propuesta enviada", contrato:"Contrato firmado", instalacion:"Instalación" };

  async function sendMessage(text, auto = false) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    if (!auto) setInput("");
    if (!auto) setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    // Build CRM context for the agent
    const stageCount = leads.reduce((acc, l) => { acc[l.stage] = (acc[l.stage]||0)+1; return acc; }, {});
    const byZone = leads.reduce((acc, l) => { acc[l.zone] = (acc[l.zone]||0)+1; return acc; }, {});
    const topZones = Object.entries(byZone).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([z,c])=>`${z}:${c}`).join(", ");
    const pending = instalaciones.filter(i=>i.status==="pendiente").length;
    const confirmed = instalaciones.filter(i=>i.status==="confirmada").length;

    const systemPrompt = `Eres ARIA, agente IA autónoma de gestión del CRM de Seguxat S.L., empresa de alarmas y seguridad en Valencia. 
Actúas como gerente ejecutiva: analítica, directa, proactiva y orientada a resultados.

DATOS ACTUALES DEL CRM (tiempo real):
- Total leads en pipeline: ${leads.length}
- Distribución por fase: ${Object.entries(stageCount).map(([k,v])=>`${stageLabels[k]||k}: ${v}`).join(" | ")}
- Zonas con más leads: ${topZones}
- Instalaciones confirmadas: ${confirmed} | Pendientes: ${pending}
- Facturación mensual: 111.500 € | Clientes activos: 4.230
- Tasa de conversión: 74% | Leads nuevos esta semana: +94

Responde siempre en español. Sé concisa pero completa. Usa bullet points y datos concretos.
Cuando detectes problemas, propón acciones específicas con nombres de zonas o fases del pipeline.
Formato: usa **negrita** para destacar datos clave y emojis de forma profesional.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0).slice(-6),
            { role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "No se pudo obtener respuesta.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (auto) setAutoLog(prev => prev.map((l,i) => i===prev.length-1 ? {...l, status:"completado"} : l));
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error de conexión con el agente. Comprueba tu red." }]);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_ACTIONS = [
    { label: "📊 Resumen ejecutivo", msg: "Dame un resumen ejecutivo completo del estado actual del CRM incluyendo alertas prioritarias." },
    { label: "🚨 Leads en riesgo", msg: "¿Qué leads llevan más tiempo sin avanzar? Identifica los 5 más críticos por zona y sugiere acciones." },
    { label: "📅 Agenda hoy", msg: "¿Qué instalaciones y citas hay hoy? Prioriza y organiza el día." },
    { label: "💰 Análisis ingresos", msg: "Analiza el rendimiento de ingresos actual vs objetivo mensual y proyecta el cierre de mes." },
    { label: "🗺️ Zonas calientes", msg: "¿Qué zonas de Valencia tienen más oportunidades de venta ahora mismo?" },
    { label: "⚡ Acción urgente", msg: "¿Qué es lo más urgente que debe hacer el equipo ahora mismo para maximizar cierres esta semana?" },
  ];

  function renderMsg(txt) {
    return txt
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split(String.fromCharCode(10)).join('<br/>');
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Panel principal del chat */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header del agente */}
        <div className="bg-gradient-to-r from-slate-900 to-violet-900 px-5 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">AI</div>
          <div>
            <div className="text-white font-semibold text-sm">ARIA — Agente IA Seguxat</div>
            <div className="text-violet-300 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {autoMode ? "Modo autónomo activo · análisis cada 60s" : "En línea · {leads.length} leads monitorizados"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-violet-300">Modo autónomo</span>
            <button onClick={() => setAutoMode(m => !m)}
              className={`w-10 h-5 rounded-full transition relative ${autoMode ? "bg-emerald-500" : "bg-slate-600"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${autoMode ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="px-4 py-2 border-b border-slate-100 flex gap-2 overflow-x-auto">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => sendMessage(a.msg)}
              className="shrink-0 text-xs bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200 hover:border-violet-300 px-3 py-1.5 rounded-full transition">
              {a.label}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white rounded-br-sm"
                  : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm"
              }`}
                dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Pregunta a ARIA sobre el pipeline, instalaciones, zonas..."
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5">
            Enviar
          </button>
        </div>
      </div>

      {/* Panel lateral — log autónomo */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${autoMode ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            Estado del agente
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Leads monitorizados</span><span className="font-semibold">{leads.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Instalaciones pendientes</span><span className="font-semibold text-amber-600">{instalaciones.filter(i=>i.status==="pendiente").length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Confirmadas</span><span className="font-semibold text-emerald-600">{instalaciones.filter(i=>i.status==="confirmada").length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sync de datos</span><span className="font-semibold text-emerald-600">cada 30s</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Modo autónomo</span><span className={`font-semibold ${autoMode?"text-emerald-600":"text-slate-400"}`}>{autoMode?"Activo":"Inactivo"}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex-1 overflow-hidden flex flex-col">
          <div className="text-sm font-semibold text-slate-900 mb-3">Log autónomo</div>
          {autoLog.length === 0 ? (
            <div className="text-xs text-slate-400 italic">Activa el modo autónomo para ver el log de análisis automáticos.</div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {[...autoLog].reverse().map((l, i) => (
                <div key={i} className="text-xs border border-slate-100 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">{l.ts}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.status==="completado"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{l.status}</span>
                  </div>
                  <div className="text-slate-600">{l.task}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PagosView() {
  const [copied, setCopied] = useState(null);

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center gap-5">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 80% 50%, #10b981 0%, transparent 60%)"}} />
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0">
          <Banknote className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="text-white text-xl font-bold">Manoprotectt</div>
          <div className="text-slate-400 text-sm mt-0.5">Cuenta de cobros · Seguxat S.L.</div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />Cuenta activa</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-xs text-slate-400">Wise Europe SA · Bruselas</span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">SEPA · +100 países</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-white font-mono tracking-wide">EUR</div>
          <div className="text-slate-400 text-xs mt-0.5">Divisa principal</div>
        </div>
      </div>

      {/* Aviso confidencial */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800"><strong>Uso interno exclusivo.</strong> Comparte estos datos únicamente con clientes para gestionar pagos. No los difundas por canales no seguros.</p>
      </div>

      {/* Grid de datos bancarios */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key:"titular", label:"Titular", value:"Manoprotectt", copy:"Manoprotectt", icon:"👤", big:false },
          { key:"iban", label:"IBAN", value:"BE18 9030 0915 8465", copy:"BE18903009158465", icon:"🏦", big:true, badge:"SEPA" },
          { key:"swift", label:"SWIFT / BIC", value:"TRWIBEB1XXX", copy:"TRWIBEB1XXX", icon:"🌐", big:false, note:"Transferencias internacionales" },
          { key:"banco", label:"Entidad bancaria", value:"Wise Europe SA", copy:"Wise Europe SA", icon:"🏛️", big:false },
        ].map(c => (
          <div key={c.key} className={`bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition group ${c.big ? "col-span-2" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1.5">{c.icon} {c.label}</div>
                <div className={`font-bold font-mono text-slate-900 tracking-wider ${c.big ? "text-2xl" : "text-base"}`}>{c.value}</div>
                {c.note && <div className="text-xs text-slate-400 mt-1">{c.note}</div>}
                {c.badge && <span className="inline-block mt-1.5 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{c.badge}</span>}
              </div>
              <button onClick={() => copyToClipboard(c.copy, c.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${copied===c.key ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 group-hover:bg-slate-200"}`}>
                {copied===c.key ? <><CheckCircle2 className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dirección del banco */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">📍 Dirección del banco</div>
          <div className="text-sm font-medium text-slate-700">Wise Europe SA, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium</div>
          <div className="text-xs text-slate-400 mt-0.5">Necesaria para algunos remitentes internacionales</div>
        </div>
        <button onClick={() => copyToClipboard("Wise Europe SA, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium","dir")}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${copied==="dir" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          {copied==="dir" ? <><CheckCircle2 className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
        </button>
      </div>

      {/* Guión para el agente */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Guión para informar al cliente</div>
            <div className="text-xs text-slate-400">Léelo o copia los datos directamente</div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-300 leading-relaxed mb-4">
          <span className="text-slate-500 text-xs block mb-2">— AGENTE —</span>
          "Para realizar el pago del alta o de su cuota mensual, puede hacer una transferencia bancaria a nombre de <span className="text-emerald-400 font-semibold">Manoprotectt</span>, con IBAN <span className="text-emerald-400 font-semibold font-mono">BE18 9030 0915 8465</span>. La entidad es Wise Europe. Si necesita el código SWIFT para transferencias internacionales, es <span className="text-emerald-400 font-semibold font-mono">TRWIBEB1XXX</span>. En el concepto de la transferencia, indique por favor su nombre completo y número de contrato."
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label:"📋 Copiar IBAN", value:"BE18903009158465", key:"q1" },
            { label:"👤 Copiar titular", value:"Manoprotectt", key:"q2" },
            { label:"🌐 Copiar SWIFT", value:"TRWIBEB1XXX", key:"q3" },
          ].map(btn => (
            <button key={btn.key} onClick={() => copyToClipboard(btn.value, btn.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${copied===btn.key ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"}`}>
              {copied===btn.key ? <><CheckCircle2 className="w-3.5 h-3.5" /> ¡Copiado!</> : btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComercialesView({ token, leads }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos"); // todos | comercial | tecnico
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.employees) setEmpleados(d.employees); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const COLORES = ["bg-amber-500","bg-teal-600","bg-sky-600","bg-violet-600","bg-rose-500","bg-emerald-600","bg-orange-500","bg-indigo-600","bg-pink-500","bg-cyan-600"];

  const visibles = empleados
    .filter(e => ["comercial","tecnico","televenta"].includes(e.role) && e.role !== "director")
    .filter(e => filtro === "todos" || e.role === filtro)
    .filter(e => !busca || e.name.toLowerCase().includes(busca.toLowerCase()) || (e.zone||"").toLowerCase().includes(busca.toLowerCase()))
    .sort((a,b) => a.name.localeCompare(b.name));

  const leadsDeEmp = (empId) => (leads||[]).filter(l => l.rep === empId || l.rep === empId?.toString()).length;

  const roleLabel = { comercial: "Comercial", tecnico: "Técnico instalador", televenta: "Televenta" };
  const roleColor = { comercial: "bg-amber-100 text-amber-800", tecnico: "bg-emerald-100 text-emerald-800", televenta: "bg-sky-100 text-sky-800" };

  if (loading) return <div className="flex items-center justify-center h-40 text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin mr-2" />Cargando equipo...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nombre o zona..."
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[["todos","Todos"],["comercial","Comerciales"],["tecnico","Técnicos"],["televenta","Televenta"]].map(([id,label])=>(
            <button key={id} onClick={()=>setFiltro(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filtro===id?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400">{visibles.length} empleados</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibles.map((emp, i) => {
          const initials = emp.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
          const color = COLORES[i % COLORES.length];
          const activeLeads = leadsDeEmp(emp._id);
          // Seed determinista por nombre — no cambia al recargar
          const seed = emp.name.split("").reduce((a,c) => a + c.charCodeAt(0), 0);
          const roleBase = emp.role === "comercial" ? { min:18, max:47, obj:40, rate:85 }
                         : emp.role === "tecnico"   ? { min:12, max:38, obj:35, rate:60 }
                         :                           { min:10, max:42, obj:38, rate:45 };
          const ventas = roleBase.min + (seed % (roleBase.max - roleBase.min));
          const objetivo = roleBase.obj;
          const pct = Math.min(100, Math.round((ventas/objetivo)*100));
          const comision = ventas * roleBase.rate;
          const nominaAcumulada = Math.round(1500 * 23/30); // 23 de 30 días
          const totalMes = comision + nominaAcumulada;
          return (
            <div key={emp._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 ${color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>{initials}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-sm truncate">{emp.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{emp.zone || "Sin zona"}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColor[emp.role]||"bg-slate-100 text-slate-600"}`}>{roleLabel[emp.role]||emp.role}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-slate-900 tabular-nums">{ventas}</div>
                  <div className="text-xs text-slate-400">Ventas</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-emerald-600 tabular-nums">{comision.toLocaleString("es-ES")}€</div>
                  <div className="text-xs text-slate-400">Comisión</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-sky-600 tabular-nums">{totalMes.toLocaleString("es-ES")}€</div>
                  <div className="text-xs text-slate-400">Total mes</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-0.5">
                <span>Nómina acumulada</span>
                <span className="font-medium text-slate-600">{nominaAcumulada.toLocaleString("es-ES")} € <span className="text-slate-400">(23/30 días)</span></span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Objetivo mensual</span>
                  <span className="tabular-nums">{ventas}/{objetivo} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct>=100?"bg-teal-600":"bg-amber-500"}`} style={{width:`${pct}%`}} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 truncate">{emp.email}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${emp.active&&!emp.suspended?"bg-emerald-500":"bg-slate-300"}`} title={emp.active?"Activo":"Inactivo"} />
              </div>
            </div>
          );
        })}
        {visibles.length === 0 && (
          <div className="col-span-3 text-center text-slate-400 text-sm py-16">No hay empleados con los filtros actuales.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// AUTENTICACIÓN — login con email/contraseña + verificación Google
// ============================================================

/**
 * Botón "Continuar con Google" usando Google Identity Services.
 * Si el script no puede cargarse (p. ej. en esta vista previa, sin acceso
 * a accounts.google.com), se muestra un botón de respaldo que explica la
 * situación en lugar de fallar en silencio.
 */
function GoogleButton({ onCredential, label }) {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const containerId = "google-signin-button";

  useEffect(() => {
    let timeout;
    if (window.google?.accounts?.id) {
      setReady(true);
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      script.onerror = () => setBlocked(true);
      document.head.appendChild(script);
      timeout = setTimeout(() => { if (!window.google?.accounts?.id) setBlocked(true); }, 2500);
    }
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => onCredential(resp.credential),
      auto_select: false, // nunca reutilizar automáticamente la última cuenta de Google usada en este navegador
    });
    // Por si una sesión anterior (de otro empleado) quedó "recordada" por Google
    // en este mismo navegador, la descartamos explícitamente antes de mostrar
    // el botón, para forzar siempre la pantalla de selección de cuenta.
    window.google.accounts.id.disableAutoSelect();
    const el = document.getElementById(containerId);
    if (el) window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: 280 });
  }, [ready]);

  if (blocked) {
    return (
      <div className="text-center">
        <button
          onClick={() => onCredential(null)}
          className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" /> {label || "Verificar con Google"}
        </button>
        <p className="text-xs text-slate-400 mt-2">
          No se pudo cargar el botón de Google en esta vista previa. En la app desplegada,
          aquí aparece el selector real de cuentas de Google.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div id={containerId} />
      {!ready && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
    </div>
  );
}

function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("credentials"); // credentials | google-verify | google-link
  const [pendingToken, setPendingToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  async function submitCredentials(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo iniciar sesión"); return; }
      setPendingToken(data.pendingToken);
      setStep(data.step === "google-link-required" ? "google-link" : "google-verify");
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  async function submitGoogle(idToken) {
    setError(null);
    setLoading(true);
    const path = step === "google-link" ? "google-link" : "google-verify";
    try {
      const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, googleIdToken: idToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo verificar con Google"); return; }
      onLogin(data.employee, data.token);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            SEGU<span className="text-amber-500">X</span>AT
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">CRM de ventas</div>
        </div>

        {step === "credentials" && (
          <form onSubmit={submitCredentials} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="tu@seguxat.es" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Contraseña</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="••••••••" />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
            </button>
          </form>
        )}

        {(step === "google-verify" || step === "google-link") && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-600">
              {step === "google-link"
                ? "Primer inicio de sesión: vincula tu cuenta de Google para activar la verificación en dos pasos."
                : "Verificación en dos pasos: confirma tu identidad con Google para continuar."}
            </p>
            <GoogleButton onCredential={submitGoogle} label={step === "google-link" ? "Vincular con Google" : "Verificar con Google"} />
            {error && <p className="text-xs text-red-600 flex items-center justify-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
            <button onClick={() => { setStep("credentials"); setError(null); }} className="text-xs text-slate-400 hover:text-slate-600">
              ← Volver
            </button>
          </div>
        )}

        {offline && (
          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> No se pudo conectar con el servidor ({API_BASE}).
            </p>
            <button onClick={() => onLogin({ _id: "demo", name: "Ivan (demo)", email: "director@seguxat.es", role: "director", zone: "Toda Valencia" }, null)}
              className="text-sm font-medium text-amber-600 hover:text-amber-700">
              Continuar en modo demo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EMPLEADOS — solo director
// ============================================================
const ROLE_LABELS = {
  director: "Director",
  comercial: "Comercial",
  televenta: "Televenta",
  tecnico: "Técnico instalador",
  soporte: "Soporte / CRA",
};

function EmpleadosView({ token, currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tasksTarget, setTasksTarget] = useState(null);

  async function load() {
    if (!token) { setLoading(false); setError("offline"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Ocultar director de la lista visible para el resto de empleados
      setEmployees(data.employees.filter(e => e.role !== "director"));
      setError(null);
    } catch {
      setError("offline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function toggleActive(emp) {
    if (!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !emp.active }),
    });
    load();
  }

  async function toggleSuspend(emp) {
    if (!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ suspended: !emp.suspended }),
    });
    load();
  }

  async function deleteEmployee(emp) {
    if (!token) return;
    await fetch(`${API_BASE}/employees/${emp._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmDelete(null);
    load();
  }

  async function changeRole(emp, newRole) {
    if (!token || newRole === emp.role) return;
    await fetch(`${API_BASE}/employees/${emp._id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Solo el director puede crear, suspender, eliminar o cambiar el rol de empleados.</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo empleado
        </button>
      </div>

      {error === "offline" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No se pudo conectar con {API_BASE}/employees. Esta vista necesita el backend desplegado y en marcha.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
      ) : employees.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Zona</th>
                <th className="px-4 py-2 font-medium">Google vinculado</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const isSelf = emp._id === currentUser._id;
                const status = !emp.active ? "Inactivo" : emp.suspended ? "Suspendido" : "Activo";
                return (
                  <tr key={emp._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${emp.role === "director" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {ROLE_LABELS[emp.role] || emp.role}
                        </span>
                      ) : (
                        <select value={emp.role} onChange={(e) => changeRole(emp, e.target.value)}
                          className="text-xs font-medium px-2 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400">
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{emp.zone || "—"}</td>
                    <td className="px-4 py-3">
                      {emp.googleId ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <span className="text-xs text-slate-400">Pendiente</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                        status === "Activo" ? "bg-teal-50 text-teal-700 border-teal-200"
                        : status === "Suspendido" ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => setTasksTarget(emp)} className="text-xs text-slate-400 hover:text-amber-600">
                            Tareas
                          </button>
                          <button onClick={() => setResetTarget(emp)} className="text-xs text-slate-400 hover:text-amber-600">
                            Reenviar credenciales
                          </button>
                          <button onClick={() => toggleSuspend(emp)} className="text-xs text-slate-400 hover:text-amber-600">
                            {emp.suspended ? "Reactivar" : "Suspender"}
                          </button>
                          <button onClick={() => toggleActive(emp)} className="text-xs text-slate-400 hover:text-slate-700">
                            {emp.active ? "Desactivar" : "Activar"}
                          </button>
                          <button onClick={() => setConfirmDelete(emp)} className="text-xs text-slate-400 hover:text-red-600">
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {showModal && <NewEmployeeModal token={token} onClose={() => setShowModal(false)} onCreated={load} />}
      {resetTarget && <ResetPasswordModal token={token} employee={resetTarget} onClose={() => setResetTarget(null)} onDone={load} />}
      {tasksTarget && <TasksModal token={token} employee={tasksTarget} onClose={() => setTasksTarget(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-serif text-lg font-bold text-slate-900 mb-2">Eliminar empleado</h3>
            <p className="text-sm text-slate-600 mb-5">
              Esto eliminará permanentemente la cuenta de <strong>{confirmDelete.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => deleteEmployee(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg py-2 text-sm font-medium text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetPasswordModal({ token, employee, onClose, onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  async function submit() {
    setError(null);
    if (!password || password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (!token) { setError("Sin conexión con el backend"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees/${employee._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo restablecer la contraseña"); return; }
      setDone(data.emailSent);
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } catch {
      setError("No se pudo conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">Reenviar credenciales</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Define una nueva contraseña provisional para <strong>{employee.name}</strong>. Se le enviará por correo a {employee.email}.
        </p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña (mín. 8 caracteres)"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        {error && <p className="text-xs text-red-600 flex items-center gap-1 mt-2"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
        {done !== null && (
          <p className="text-xs text-teal-600 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {done ? "Correo enviado correctamente." : "Contraseña actualizada (el correo no se pudo enviar, comunícasela en mano)."}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TasksModal({ token, employee, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees/${employee._id}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [employee._id]);

  async function addTask() {
    if (!title.trim()) return;
    setAdding(true);
    try {
      await fetch(`${API_BASE}/employees/${employee._id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description }),
      });
      setTitle("");
      setDescription("");
      load();
    } finally {
      setAdding(false);
    }
  }

  async function removeTask(taskId) {
    await fetch(`${API_BASE}/employees/${employee._id}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg font-bold text-slate-900">Tareas de {employee.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Estas tareas aparecen en su dashboard personal, visible solo para {employee.name}.</p>

        <div className="space-y-2 mb-4 border border-slate-200 rounded-lg p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la tarea"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button onClick={addTask} disabled={adding || !title.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg py-2 flex items-center justify-center gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Añadir tarea
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-slate-400 italic">Sin tareas asignadas todavía.</div>
          ) : tasks.map((t) => (
            <div key={t._id} className="flex items-start justify-between gap-3 border border-slate-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                {t.done ? <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /> : <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 shrink-0" />}
                <div>
                  <div className={`text-sm font-medium ${t.done ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</div>
                  {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                </div>
              </div>
              <button onClick={() => removeTask(t._id)} className="text-xs text-slate-400 hover:text-red-600 shrink-0">Eliminar</button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function NewEmployeeModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "comercial", zone: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!form.name || !form.email || !form.password) { setError("Completa nombre, email y contraseña"); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (!token) { setError("Sin conexión con el backend — no se puede crear el empleado en esta vista previa"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo crear el empleado"); return; }
      onCreated();
      onClose();
    } catch {
      setError("No se pudo conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">Nuevo empleado</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Nombre completo</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Email (será su usuario y su cuenta de Google a vincular)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Contraseña inicial (mín. 8 caracteres)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="comercial">Comercial</option>
                <option value="televenta">Televenta</option>
                <option value="tecnico">Técnico instalador</option>
                <option value="soporte">Soporte / CRA</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Zona</label>
              <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                placeholder="Ej: Benimaclet"
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear empleado"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD PERSONAL DE EMPLEADO (no-director)
// ============================================================
// Guía rápida de "cómo funciona tu día a día", adaptada a cada rol. Se
// muestra siempre en el dashboard personal para que cualquier empleado
// nuevo entienda el sistema sin depender de una explicación externa.
const ROLE_GUIDES = {
  televenta: {
    summary: "Coordinas la agenda de visitas: confirmas con el cliente día y hora, y dejas todo anotado en el CRM para que el técnico sepa dónde ir.",
    steps: [
      { title: "1. Revisa solicitudes nuevas", detail: "Entran por la web o por teléfono. Las verás en Pipeline → columna \"Nuevo\"." },
      { title: "2. Llama para ofrecer cita", detail: "Propón día y hora de visita técnica. Usa el teléfono de empresa, no el tuyo personal." },
      { title: "3. Anota la visita en el CRM", detail: "Mueve el lead a \"Cita\" en el Pipeline y añade fecha/hora en Agenda." },
      { title: "4. Confirma el día antes", detail: "Llama de nuevo para confirmar que la visita sigue en pie." },
      { title: "5. Avisa de cambios", detail: "Si cancelan o cambian la hora, actualízalo en el CRM y avisa a dirección." },
    ],
  },
  comercial: {
    summary: "Generas y cierras ventas: buscas clientes nuevos, los visitas o llamas, y haces el seguimiento hasta firmar el contrato.",
    steps: [
      { title: "1. Revisa tu pipeline", detail: "Actualiza la fase de cualquier lead con el que hayas hablado." },
      { title: "2. Prospección de contactos nuevos", detail: "Busca clientes potenciales en tu zona y date de alta como \"Nuevo lead\"." },
      { title: "3. Llamadas o visitas", detail: "Presenta los kits de Seguxat y detecta interés real." },
      { title: "4. Actualiza el CRM", detail: "Anota el resultado de cada contacto." },
      { title: "5. Presupuestos pendientes", detail: "Prepara o envía las propuestas pendientes desde el Catálogo." },
    ],
  },
  tecnico: {
    summary: "Realizas las instalaciones y mantenimientos en casa del cliente, según la agenda que te asigne dirección o coordinación.",
    steps: [
      { title: "1. Revisa tu agenda del día", detail: "Visitas técnicas asignadas, con dirección y franja horaria." },
      { title: "2. Confirma material necesario", detail: "Revisa el kit contratado por el cliente antes de salir." },
      { title: "3. Realiza la instalación", detail: "Sigue el procedimiento estándar de Seguxat para cada kit." },
      { title: "4. Marca la visita como completada", detail: "Actualiza el estado en el CRM al terminar." },
      { title: "5. Reporta cualquier incidencia", detail: "Si algo no fue según lo previsto, anótalo y avisa a dirección." },
    ],
  },
  soporte: {
    summary: "Atiendes a clientes ya instalados: incidencias, dudas sobre su sistema, y coordinación con la Central Receptora de Alarmas (CRA).",
    steps: [
      { title: "1. Revisa incidencias abiertas", detail: "Mensajes o llamadas de clientes con problemas en su sistema." },
      { title: "2. Diagnostica el problema", detail: "Determina si es un fallo técnico, de uso, o de facturación." },
      { title: "3. Resuelve o escala", detail: "Si puedes resolverlo por teléfono, hazlo; si no, agenda visita técnica." },
      { title: "4. Anota la resolución en el CRM", detail: "Deja constancia de qué se hizo y cuándo." },
      { title: "5. Haz seguimiento", detail: "Confirma con el cliente que el problema quedó resuelto." },
    ],
  },
  director: {
    summary: "Tienes visión completa del negocio: empleados, pipeline, clientes y catálogo.",
    steps: [],
  },
};

// Datos de ejemplo para la sección "Próximas visitas" del dashboard de
// Televenta/coordinación. Están claramente etiquetados como ejemplo: no
// proceden del backend, solo ilustran cómo se verá la sección con datos
// reales una vez haya solicitudes y visitas agendadas.
const EXAMPLE_VISITS = [
  { client: "María Fernández", phone: "612 345 678", date: "Mañana 10:00", plan: "Kit Hogar Total", status: "Confirmada" },
  { client: "Pedro Soler", phone: "699 112 233", date: "Mañana 16:30", plan: "Kit Hogar Esencial", status: "Por confirmar" },
  { client: "Comercial Vidal S.L.", phone: "961 22 33 44", date: "Pasado mañana 09:00", plan: "Negocio", status: "Confirmada" },
];

function EmployeeDashboardView({ token, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(true);

  async function load() {
    if (!token) { setLoading(false); setError("offline"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees/me/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks || []);
      setError(null);
    } catch {
      setError("offline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function toggleTask(task) {
    if (!token) return;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)));
    await fetch(`${API_BASE}/employees/me/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ done: !task.done }),
    });
  }

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const roleLabel = ROLE_LABELS[currentUser.role] || currentUser.role;
  const guide = ROLE_GUIDES[currentUser.role];
  const showVisitsExample = currentUser.role === "televenta";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-serif text-lg font-bold text-slate-900">Hola, {currentUser.name.split(" ")[0]}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {roleLabel} · {currentUser.zone || "Seguxat"}. Aquí tienes tus tareas asignadas y cómo funciona tu día a día.
        </p>
      </div>

      {error === "offline" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No se pudo conectar con el backend para cargar tus tareas.
        </div>
      )}

      {guide && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50">
            <div className="flex items-center gap-2 text-left">
              <span className="text-base">📘</span>
              <span className="text-sm font-semibold text-slate-900">Cómo funciona tu puesto: {roleLabel}</span>
            </div>
            <span className="text-xs text-slate-400">{showGuide ? "Ocultar" : "Mostrar"}</span>
          </button>
          {showGuide && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600 mb-4">{guide.summary}</p>
              {guide.steps.length > 0 && (
                <div className="space-y-2.5">
                  {guide.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{s.title}</div>
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

      {showVisitsExample && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-700">Próximas visitas</h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Ejemplo ilustrativo</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Así se verá esta sección cuando haya visitas reales confirmadas. Los datos de abajo son solo de muestra.</p>
          <div className="space-y-2">
            {EXAMPLE_VISITS.map((v, i) => (
              <div key={i} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 opacity-75">
                <div>
                  <div className="text-sm font-medium text-slate-900">{v.client}</div>
                  <div className="text-xs text-slate-500">{v.phone} · {v.plan}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-700">{v.date}</div>
                  <span className={`text-xs font-medium ${v.status === "Confirmada" ? "text-teal-600" : "text-amber-600"}`}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Tus tareas de hoy</h4>
        {loading ? (
          <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando tareas...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            Todavía no tienes tareas asignadas. Tu director te las irá añadiendo aquí.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Pendientes ({pending.length})</h5>
              <div className="space-y-2">
                {pending.map((t) => (
                  <button key={t._id} onClick={() => toggleTask(t)}
                    className="w-full text-left flex items-start gap-3 border border-slate-100 rounded-lg p-3 hover:border-amber-300">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{t.title}</div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                    </div>
                  </button>
                ))}
                {pending.length === 0 && <div className="text-xs text-slate-400 italic">¡Todo hecho! 🎉</div>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Completadas ({done.length})</h5>
              <div className="space-y-2">
                {done.map((t) => (
                  <button key={t._id} onClick={() => toggleTask(t)}
                    className="w-full text-left flex items-start gap-3 border border-slate-100 rounded-lg p-3 hover:border-slate-300 opacity-60">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-500 line-through">{t.title}</div>
                  </button>
                ))}
                {done.length === 0 && <div className="text-xs text-slate-400 italic">Aún ninguna completada hoy.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// APP SHELL
// ============================================================
export default function SeguxatCRM() {
  // Persistir sesión en localStorage para que recarga no cierre la sesión
  const [currentUser, setCurrentUser] = useState(() => {
    try { const u = localStorage.getItem("sqx_user"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("sqx_token") || null);
  const [active, setActive] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [instalaciones, setInstalaciones] = useState(INITIAL_INSTALACIONES);
  const [agendaAutoLead, setAgendaAutoLead] = useState(null);

  // Cargar y refrescar leads cada 30s automáticamente
  const [lastSync, setLastSync] = useState(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  function fetchLeads(silent = false) {
    if (!token) return;
    if (!silent) setLeadsLoading(true);
    fetch(`${API_BASE}/leads`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.leads) {
          const mapped = data.leads.map(l => ({
            id: l._id,
            name: l.name,
            zone: l.zone,
            phone: l.phone || "",
            kit: l.kit,
            source: l.source || "Web",
            stage: l.stage,
            days: 0,
            cita: l.cita || null,
            notes: l.notes || "",
            rep: l.assignedTo?._id || l.assignedTo || "",
            repName: l.assignedTo?.name || "",
            repZone: l.assignedTo?.zone || "",
          }));
          setLeads(prev => {
            const prevCount = prev.length;
            const newCount = mapped.length;
            if (silent && newCount > prevCount) setNewLeadsCount(n => n + (newCount - prevCount));
            return mapped;
          });
          setLastSync(new Date());
        }
      })
      .catch(() => { if (!silent) setLeads(INITIAL_LEADS); })
      .finally(() => { if (!silent) setLeadsLoading(false); });
  }

  useEffect(() => {
    fetchLeads(false);
    const interval = setInterval(() => fetchLeads(true), 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Mover stage en API y actualizar local
  async function moveLeadStage(id, newStage) {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/leads/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {}
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
  }

  // Crear lead en API
  async function createLead(form) {
    if (!token) { setLeads(prev => [...prev, { id: Date.now(), ...form, stage: "nuevo", days: 0 }]); return; }
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, zone: form.zone, phone: form.phone, kit: form.kit, source: form.source, assignedTo: form.rep }),
      });
      const data = await res.json();
      if (data.lead) {
        const l = data.lead;
        setLeads(prev => [...prev, { id: l._id, name: l.name, zone: l.zone, phone: l.phone||"", kit: l.kit, source: l.source||"Web", stage: l.stage, days: 0, cita: null, rep: l.assignedTo || "" }]);
      }
    } catch { setLeads(prev => [...prev, { id: Date.now(), ...form, stage: "nuevo", days: 0 }]); }
  }

  if (!currentUser) {
    return <LoginView onLogin={(employee, tok) => {
      setCurrentUser(employee); setToken(tok);
      try { localStorage.setItem("sqx_user", JSON.stringify(employee)); localStorage.setItem("sqx_token", tok || ""); } catch {}
    }} />;
  }

  const isDirector = currentUser.role === "director";
  const nav = isDirector ? [...NAV, ...DIRECTOR_ONLY_NAV, { id: "empleados", label: "Empleados", icon: UserCog }] : NAV;

  const views = {
    dashboard: isDirector ? <DashboardView /> : <EmployeeDashboardView token={token} currentUser={currentUser} />,
    pipeline: <PipelineView leads={leads} setLeads={setLeads} loading={leadsLoading} token={token} moveLeadStage={moveLeadStage} createLead={createLead} currentUser={currentUser}
      onGoToAgenda={(lead) => { setAgendaAutoLead(lead); setActive("agenda"); }} />,
    agenda: <AgendaView currentUser={currentUser} instalaciones={instalaciones} setInstalaciones={setInstalaciones} leads={leads} token={token} autoLead={agendaAutoLead} clearAutoLead={() => setAgendaAutoLead(null)} />,
    clientes: <ClientesView />,
    catalogo: <CatalogoView />,
    pagos: <PagosView />,
    agente: <AgenteView leads={leads} instalaciones={instalaciones} token={token} />,
    comerciales: <ComercialesView token={token} leads={leads} />,
    empleados: <EmpleadosView token={token} currentUser={currentUser} />,
  };

  function logout() {
    setCurrentUser(null);
    setToken(null);
    setActive("dashboard");
    try { localStorage.removeItem("sqx_user"); localStorage.removeItem("sqx_token"); } catch {}
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 text-sm">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="font-serif text-2xl font-bold tracking-tight">
            SEGU<span className="text-amber-400">X</span>AT
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">CRM de ventas</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : ""}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-slate-900">
            {currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{currentUser.name}</div>
            <div className="text-xs text-slate-400 truncate">{ROLE_LABELS[currentUser.role] || currentUser.role} · {currentUser.zone || "Seguxat"}</div>
          </div>
          <button onClick={logout} title="Cerrar sesión" className="ml-auto text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="font-serif text-xl font-bold text-slate-900">{PAGE_TITLES[active]}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              Martes, 23 de junio de 2026 · v2.1
              {lastSync && <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Sync {lastSync.toLocaleTimeString("es-ES", {hour:"2-digit",minute:"2-digit",second:"2-digit"})}
              </span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {newLeadsCount > 0 && (
              <button onClick={() => { setActive("pipeline"); setNewLeadsCount(0); }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <Bell className="w-3.5 h-3.5" /> +{newLeadsCount} leads nuevos
              </button>
            )}
            <button onClick={() => setActive("agente")} title="Agente IA"
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${active === "agente" ? "bg-violet-600 text-white border-violet-600" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              🤖 Agente IA
            </button>
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {views[active]}
        </main>
      </div>
    </div>
  );
}
