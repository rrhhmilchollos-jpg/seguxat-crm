/**
 * seed_karla.cjs — Tareas diarias de Karla + técnicos con nombre visible
 * 
 * - 30 tareas para Karla distribuidas en su turno 16:00–20:00
 * - Cada tarea de asignación menciona al técnico de zona correcto por nombre
 * - Los técnicos están creados como empleados visibles en el CRM
 * 
 * USO: node seed_karla.cjs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dns      = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI'); process.exit(1); }

// ── Schemas ────────────────────────────────────────────────────────────────
const ROLES = {
  DIRECTOR:'director', COMERCIAL:'comercial', TELEVENTA:'televenta',
  TECNICO:'tecnico',   SOPORTE:'soporte'
};
const STAGES = ['nuevo','contactado','cita','visita','propuesta','contrato','instalacion'];
const KIT_TYPES = ['esencial','total','negocio'];

const taskSchema = new mongoose.Schema({
  title:       { type: String },
  description: { type: String, default: '' },
  done:        { type: Boolean, default: false },
  dueDate:     { type: Date,   default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
}, { timestamps: true });

const employeeSchema = new mongoose.Schema({
  name:           { type: String,  required: true, trim: true },
  email:          { type: String,  required: true, unique: true, lowercase: true },
  passwordHash:   { type: String,  required: true },
  role:           { type: String,  enum: Object.values(ROLES), default: ROLES.COMERCIAL },
  zone:           { type: String,  default: '' },
  googleId:       { type: String,  default: null },
  googleLinkedAt: { type: Date,    default: null },
  active:         { type: Boolean, default: true },
  suspended:      { type: Boolean, default: false },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  tasks:          { type: [taskSchema], default: [] },
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  zone:           { type: String, required: true },
  phone:          { type: String, default: '' },
  kit:            { type: String, enum: KIT_TYPES, required: true },
  source:         { type: String, default: 'Llamada entrante' },
  stage:          { type: String, enum: STAGES, default: 'cita' },
  cita:           { type: String, default: null },
  notes:          { type: String, default: '' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  stageChangedAt: { type: Date,   default: Date.now },
}, { timestamps: true });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const Lead     = mongoose.models.Lead     || mongoose.model('Lead',     leadSchema);

// ── Helpers ────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2,'0'); }

function futureDate(daysFromNow, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function citaLabel(daysFromNow, hour, minute = 0) {
  const d = futureDate(daysFromNow, hour, minute);
  const dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${dias[d.getDay()]} ${pad(d.getDate())} ${meses[d.getMonth()]} · ${pad(hour)}:${pad(minute)}`;
}

// ── Técnicos instaladores con nombres completos ────────────────────────────
const TECNICOS_CONFIG = [
  {
    name:  'Alejandro Ruiz Martínez',
    email: 'a.ruiz.tec@seguxat.es',
    zone:  'Valencia Norte — Benimaclet / Rascanya / Orriols',
    zonasClave: ['benimaclet','rascanya','orriols','las fuentes','torrefiel','campanar norte'],
  },
  {
    name:  'Marcos Ferrer Llopis',
    email: 'm.ferrer.tec@seguxat.es',
    zone:  'Valencia Centro — Eixample / Extramurs / El Carme / Russafa',
    zonasClave: ['eixample','extramurs','el carme','russafa','xúquer','gran vía','centro'],
  },
  {
    name:  'David Soler Blasco',
    email: 'd.soler.tec@seguxat.es',
    zone:  'Valencia Sur — Jesús / Patraix / Hinteres / Malilla',
    zonasClave: ['jesús','patraix','malilla','hinteres','castellar','monteolivete'],
  },
  {
    name:  'Iván Castelló Peris',
    email: 'i.castello.tec@seguxat.es',
    zone:  'Horta Nord — Moncada / Burjassot / Alfara / Godella',
    zonasClave: ['moncada','burjassot','alfara','godella','massarrojos','benifaraig','horta nord'],
  },
  {
    name:  'Roberto Navarro Giménez',
    email: 'r.navarro.tec@seguxat.es',
    zone:  'Horta Sud — Torrent / Paiporta / Picanya / Benetússer',
    zonasClave: ['torrent','paiporta','picanya','benetússer','sedaví','albal','horta sud'],
  },
  {
    name:  'Sergio Blasco Fuster',
    email: 's.blasco.tec@seguxat.es',
    zone:  'Camp de Morvedre — Sagunto / Canet / Faura / Almenara',
    zonasClave: ['sagunto','canet','faura','almenara','puerto de sagunto','morvedre','quart de les valls'],
  },
];

// ── 30 tareas de Karla (turno 16:00–20:00) ────────────────────────────────
// Repartidas en 5 días laborables, ~6 tareas/día, todas entre 16:00 y 20:00

const TAREAS_KARLA = [
  // ─── DÍA 1 (hoy) ───────────────────────────────────────────────────────
  {
    title:       '16:00 · Revisión agenda del día — confirmar todas las citas activas',
    description: 'Abrir el pipeline y revisar todos los leads en stage "cita". Confirmar con cada técnico si las visitas de hoy están confirmadas o hay algún cambio.\n\nTécnicos a contactar internamente:\n• Alejandro Ruiz — Zona Norte\n• Marcos Ferrer — Zona Centro\n• David Soler — Zona Sur\n• Iván Castelló — Horta Nord\n• Roberto Navarro — Horta Sud\n• Sergio Blasco — Sagunto',
    dueDate: futureDate(0, 16, 0),
  },
  {
    title:       '16:20 · Llamar a María Dolores Pérez (Benimaclet) — confirmar visita mañana 09:00 con Alejandro Ruiz',
    description: 'Cliente pendiente de confirmación. Si no contesta, dejar mensaje de voz y enviar SMS.\nTécnico asignado: Alejandro Ruiz Martínez (Zona Norte — Benimaclet / Rascanya).\nSi cancela, buscar hueco disponible en agenda de Alejandro para esta misma semana.',
    dueDate: futureDate(0, 16, 20),
  },
  {
    title:       '16:40 · Asignar visita nueva — Ana Martínez (Eixample) → Marcos Ferrer',
    description: 'Cliente Ana Martínez Soler ha confirmado disponibilidad mañana a las 09:00.\nZona: Eixample → técnico responsable: Marcos Ferrer Llopis (Zona Centro).\nAñadir nota en su ficha: "ático duplex, acceso por ascensor privado código 4521".',
    dueDate: futureDate(0, 16, 40),
  },
  {
    title:       '17:00 · Llamadas nuevos leads — bloque Horta Sud (Roberto Navarro)',
    description: 'Llamar a los leads nuevos de esta tarde asignados a la zona Horta Sud.\nTécnico de zona: Roberto Navarro Giménez.\nZonas: Torrent, Paiporta, Picanya, Benetússer.\nObjetivo: 3 citas concertadas antes de las 17:30.',
    dueDate: futureDate(0, 17, 0),
  },
  {
    title:       '17:30 · Actualizar pipeline — mover a "visita" los leads con cita hoy completada',
    description: 'Revisar qué visitas han tenido lugar hoy y actualizar el stage en el CRM de "cita" a "visita".\nSi el técnico ha indicado resultado positivo → mover a "propuesta".\nSi no hay feedback del técnico → llamarle para obtener resultado.',
    dueDate: futureDate(0, 17, 30),
  },
  {
    title:       '18:00 · Recordatorios SMS — clientes con cita mañana',
    description: 'Enviar recordatorio a todos los clientes con visita programada para mañana.\nFormato: "Buenos días, le recordamos su visita de Seguxat mañana a las [HORA] con nuestro técnico. Cualquier cambio llámenos al [TELÉFONO]".\nVerificar la lista en el pipeline (stage: cita, fecha: mañana).',
    dueDate: futureDate(0, 18, 0),
  },

  // ─── DÍA 2 ──────────────────────────────────────────────────────────────
  {
    title:       '16:00 · Revisión agenda día 2 — coordinar técnicos zona Norte y Centro',
    description: 'Verificar que Alejandro Ruiz (Norte) y Marcos Ferrer (Centro) tienen sus agendas del día completas y sin solapamientos.\nHuecos disponibles hoy:\n• Alejandro: 14:00 (libre)\n• Marcos: 15:00 (libre)\nSi hay lead nuevo de Benimaclet, Eixample o Extramurs → asignar a estos huecos.',
    dueDate: futureDate(1, 16, 0),
  },
  {
    title:       '16:15 · Asignar visita — Silvia Gómez (Eixample, clínica dental) → Marcos Ferrer',
    description: 'Visita programada: mañana 10:00.\nCliente: Silvia Gómez Aparicio — Clínica Dental, Eixample.\nTécnico: Marcos Ferrer Llopis (Centro).\nNota importante: revisar normativa alarmas en centros sanitarios antes de la visita. Añadir nota en tarea de Marcos.',
    dueDate: futureDate(1, 16, 15),
  },
  {
    title:       '16:30 · Llamadas zona Sur — Patraix / Jesús (David Soler)',
    description: 'Bloque de llamadas a leads de zona Sur.\nTécnico asignado: David Soler Blasco.\nLeads prioritarios hoy:\n• Encarna Miralles (Patraix) — pendiente confirmación\n• Ramón Calabuig (Jesús, bar) — reiterar horario de visita\nObjetivo: confirmar 2 visitas para mañana.',
    dueDate: futureDate(1, 16, 30),
  },
  {
    title:       '17:00 · Gestionar cancelación — reasignar a técnico disponible',
    description: 'Si hay cancelación de última hora, actuar en menos de 30 minutos:\n1. Identificar técnico con hueco disponible en la misma zona\n2. Llamar al cliente con nueva propuesta de fecha\n3. Actualizar el CRM con nueva fecha/hora\n4. Añadir tarea al técnico alternativo\n\nHuecos disponibles esta tarde: Alejandro (Norte) 14:00 libre.',
    dueDate: futureDate(1, 17, 0),
  },
  {
    title:       '17:30 · Seguimiento leads "contactado" sin respuesta +3 días',
    description: 'Filtrar en el pipeline todos los leads en stage "contactado" con más de 3 días sin actividad.\nSegún zona, reasignar si procede:\n• Norte → Alejandro Ruiz\n• Centro → Marcos Ferrer\n• Sur → David Soler\n• Horta Nord → Iván Castelló\n• Horta Sud → Roberto Navarro\n• Sagunto → Sergio Blasco',
    dueDate: futureDate(1, 17, 30),
  },
  {
    title:       '18:30 · Cerrar resumen del día y preparar agenda mañana',
    description: 'Antes de finalizar el turno:\n✅ Comprobar que todos los leads del día tienen stage actualizado\n✅ Verificar tareas pendientes de técnicos\n✅ Preparar lista de llamadas para mañana (leads nuevos + seguimientos)\n✅ Informar al director si hay lead caliente pendiente de cierre',
    dueDate: futureDate(1, 18, 30),
  },

  // ─── DÍA 3 ──────────────────────────────────────────────────────────────
  {
    title:       '16:00 · Coordinar agenda Horta Nord — Iván Castelló (Moncada / Burjassot)',
    description: 'Revisar agenda de Iván Castelló Peris para los próximos 2 días.\nLeads pendientes en zona Horta Nord:\n• Burjassot: 2 visitas confirmadas\n• Moncada: 1 visita pendiente de confirmar\n• Alfara del Patriarca: nave industrial (urgente)\nConfirmar disponibilidad con Iván antes de las 17:00.',
    dueDate: futureDate(2, 16, 0),
  },
  {
    title:       '16:20 · Asignar visita urgente — nave industrial Alfara → Iván Castelló',
    description: 'Cliente Josep Mahiques (nave industrial, Alfara del Patriarca) solicita visita urgente.\nTuvo robo el mes pasado. Muy motivado.\nTécnico asignado: Iván Castelló Peris (Horta Nord).\nSlot disponible: mañana 11:30.\nAñadir nota en tarea de Iván: "llevar amplificador GSM por posible cobertura débil en zona industrial".',
    dueDate: futureDate(2, 16, 20),
  },
  {
    title:       '16:45 · Llamadas nuevos leads — Sagunto y Camp de Morvedre (Sergio Blasco)',
    description: 'Bloque de llamadas a leads nuevos de zona Camp de Morvedre.\nTécnico de zona: Sergio Blasco Fuster.\nLeads a gestionar:\n• Trinidad Aguilar (Puerto de Sagunto) — primera llamada\n• Pilar Querol (Canet) — segunda residencia, quiere gestión remota\n• Mercè Ibáñez (Sagunto ciudad) — piso edificio antiguo, solo interior\nObjetivo: 3 citas cerradas.',
    dueDate: futureDate(2, 16, 45),
  },
  {
    title:       '17:15 · Revisión clientes "Pendiente instalación" — coordinar fechas con técnicos',
    description: 'Revisar cartera de clientes con status "Pendiente instalación" y asignar fecha de instalación según disponibilidad de cada técnico:\n• Norte (Alejandro): hueco disponible jue 14:00\n• Centro (Marcos): hueco disponible mié 15:00\n• Sur (David): hueco disponible jue 14:30\n• Horta Nord (Iván): hueco disponible vie 13:30\n• Horta Sud (Roberto): hueco disponible vie 13:00\n• Sagunto (Sergio): hueco disponible jue 14:30',
    dueDate: futureDate(2, 17, 15),
  },
  {
    title:       '17:45 · Asignar visita — Rosario Climent (El Carme, local planta baja) → Marcos Ferrer',
    description: 'Urgente: local en El Carme con 2 robos este año.\nCliente muy motivado, pide instalación en 48h si es posible.\nTécnico: Marcos Ferrer Llopis (Centro).\nSlot disponible: pasado mañana 09:30.\nAñadir nota: "posiblemente el mejor candidato a negocio premium esta semana".',
    dueDate: futureDate(2, 17, 45),
  },
  {
    title:       '18:15 · Preparar informe semanal de pipeline para el director',
    description: 'Resumen semanal:\n• Leads nuevos esta semana\n• Citas concertadas vs. completadas\n• Conversiones a cliente\n• Leads perdidos / sin respuesta\n• Técnico con más visitas: [rellenar]\n• Zona con más actividad: [rellenar]\nEnviar al director antes de las 19:00.',
    dueDate: futureDate(2, 18, 15),
  },

  // ─── DÍA 4 ──────────────────────────────────────────────────────────────
  {
    title:       '16:00 · Revisión agenda completa — todos los técnicos',
    description: 'Revisión global de los 6 técnicos:\n• Alejandro Ruiz (Norte): agenda del día\n• Marcos Ferrer (Centro): agenda del día\n• David Soler (Sur): agenda del día\n• Iván Castelló (Horta Nord): agenda del día\n• Roberto Navarro (Horta Sud): agenda del día\n• Sergio Blasco (Sagunto): agenda del día\nIdentificar huecos sin cubrir y asignar leads pendientes.',
    dueDate: futureDate(3, 16, 0),
  },
  {
    title:       '16:30 · Asignar visita — Ernesto Cervera (Russafa, piso turístico) → David Soler',
    description: 'Cliente Ernesto Cervera Ibáñez, piso turístico en Russafa.\nInteresado en alarma gestionable desde app (Airbnb).\nTécnico: David Soler Blasco (Zona Sur — Russafa incluida).\nSlot: mañana 09:00.\nNota: preguntar por historial de accesos y gestión de llaves remotas.',
    dueDate: futureDate(3, 16, 30),
  },
  {
    title:       '16:50 · Llamadas zona Horta Sud — Torrent / Paiporta (Roberto Navarro)',
    description: 'Leads nuevos zona Horta Sud para Roberto Navarro Giménez:\n• Consuelo Ortega (Torrent) — comparando 3 empresas, cerrar hoy\n• Rafaela Doménech (Torrent) — señora mayor, decide el hijo\n• Francisca Barberà (Paiporta) — clienta recurrente, aplicar descuento\nLlamar en este orden de prioridad.',
    dueDate: futureDate(3, 16, 50),
  },
  {
    title:       '17:20 · Asignar visita — Neus Sancho (Moncada, chalet con piscina) → Iván Castelló',
    description: 'Cliente premium: Neus Sancho Llopis, chalet con piscina en Moncada.\nQuiere cámaras jardín + alarma perimetral. Presupuesto amplio.\nTécnico: Iván Castelló Peris (Horta Nord).\nSlot: pasado mañana 09:00.\nNota: no sensible al precio, enfocar en calidad y cobertura total.',
    dueDate: futureDate(3, 17, 20),
  },
  {
    title:       '17:45 · Seguimiento post-visita — llamar a clientes visitados ayer',
    description: 'Llamar a todos los clientes que tuvieron visita ayer para:\n1. Confirmar si quedaron satisfechos con la visita\n2. Resolver dudas sobre el presupuesto\n3. Si están listos → pasar a stage "contrato"\n4. Si dudan → agendar llamada de seguimiento en 48h\nRegistrar resultado en el CRM.',
    dueDate: futureDate(3, 17, 45),
  },
  {
    title:       '18:20 · Asignar visita — Llorenç Comes (Rascanya, familia recién mudada) → Alejandro Ruiz',
    description: 'Familia con 2 hijos, recién mudados a Rascanya. Quieren instalación urgente.\nTécnico: Alejandro Ruiz Martínez (Norte — Rascanya).\nSlot: mañana 09:00.\nNota: preguntar por financiación mensual, puede ser determinante para cerrar.',
    dueDate: futureDate(3, 18, 20),
  },

  // ─── DÍA 5 ──────────────────────────────────────────────────────────────
  {
    title:       '16:00 · Cierre de semana — revisar leads sin actividad +5 días',
    description: 'Filtrar pipeline: leads en cualquier stage con última actividad hace más de 5 días.\nAcción según zona:\n• Si zona Norte/Centro → intentar última llamada antes de archivar\n• Si zona Sur/Sagunto → reasignar si el técnico tiene hueco\n• Si no responde en 3 intentos → cambiar a "perdido" con nota',
    dueDate: futureDate(4, 16, 0),
  },
  {
    title:       '16:25 · Asignar visita fin de semana — Vicenta Calabuig (Faura) → Sergio Blasco',
    description: 'Cliente Vicenta Calabuig Peñaranda, casa de pueblo en Faura. Nunca ha tenido alarma.\nTécnico: Sergio Blasco Fuster (Camp de Morvedre).\nSlot: mañana 09:00.\nNota: llevar tablet con vídeo demo del sistema. Perfil conservador, necesita ver cómo funciona antes de decidir.',
    dueDate: futureDate(4, 16, 25),
  },
  {
    title:       '16:50 · Preparar agenda semana próxima — bloquear huecos por zona',
    description: 'Coordinar con todos los técnicos sus disponibilidades para la semana próxima:\n• Cada técnico debe indicar sus días libres o compromisos previos\n• Bloquear mínimo 2 huecos/día por técnico para citas urgentes\n• Prioridad de relleno: primero las zonas con más leads nuevos\nResultado: agenda de la próxima semana visible en el CRM.',
    dueDate: futureDate(4, 16, 50),
  },
  {
    title:       '17:20 · Asignar visita — Enric Bosch (Torrent, piso reformado) → Roberto Navarro',
    description: 'Cliente Enric Bosch Palau, piso reformado en Torrent. Interesado en domótica integrada.\nTécnico: Roberto Navarro Giménez (Horta Sud — Torrent).\nSlot: mañana 10:30.\nNota: cableado nuevo, instalación limpia posible. Oportunidad para kit total con extras domóticos.',
    dueDate: futureDate(4, 17, 20),
  },
  {
    title:       '17:45 · Asignar visita — Aurelio Giner (Burjassot) → Iván Castelló',
    description: 'Cliente Aurelio Giner Fuster, piso 1º en Burjassot. Zona con robos recientes.\nTécnico: Iván Castelló Peris (Horta Nord — Burjassot).\nSlot: mañana 09:00.\nNota: verificar ventanas traseras, suelen ser punto de acceso habitual en ese barrio.',
    dueDate: futureDate(4, 17, 45),
  },
  {
    title:       '18:15 · Informe quincenal — resumen de actividad y resultados a dirección',
    description: 'Informe quincenal para el director:\n📊 Leads gestionados: [total]\n📅 Citas concertadas: [total]\n✅ Conversiones a cliente: [total]\n❌ Leads perdidos: [total]\n🏆 Mejor técnico por visitas: [nombre]\n📍 Zona más activa: [zona]\n💰 Kit más vendido: [kit]\n\nAdjuntar en el sistema antes de las 19:00.',
    dueDate: futureDate(4, 18, 15),
  },
  {
    title:       '19:00 · Cierre de turno — preparar handover para mañana',
    description: 'Antes de cerrar sesión:\n✅ Todas las citas del día confirmadas o reprogramadas\n✅ Técnicos notificados de sus tareas de mañana\n✅ Pipeline actualizado al 100%\n✅ Leads urgentes marcados como prioritarios\n✅ Nota de cierre enviada al director\n\n🕐 Fin de turno: 20:00',
    dueDate: futureDate(4, 19, 0),
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('[seed_karla] Conectando...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seed_karla] Conectado a:', mongoose.connection.name);

  const director = await Employee.findOne({ role: 'director' });
  if (!director) { console.error('❌ No se encontró al director.'); process.exit(1); }

  // 1. Asegurar que los técnicos existen con nombres completos
  console.log('\n[seed_karla] 👷 Creando / verificando técnicos instaladores...');
  const tecnicoMap = {};
  for (const cfg of TECNICOS_CONFIG) {
    let emp = await Employee.findOne({ email: cfg.email });
    if (!emp) {
      emp = await Employee.create({
        name:         cfg.name,
        email:        cfg.email,
        passwordHash: await bcrypt.hash('Seguxat2026!', 12),
        role:         ROLES.TECNICO,
        zone:         cfg.zone,
        active:       true,
        createdBy:    director._id,
      });
      console.log(`  ✅ Creado: ${cfg.name} — ${cfg.zone.split('—')[0].trim()}`);
    } else {
      // Actualizar nombre y zona por si han cambiado
      emp.name = cfg.name;
      emp.zone = cfg.zone;
      await emp.save();
      console.log(`  ✓  Ya existe: ${cfg.name}`);
    }
    tecnicoMap[cfg.email] = emp;
  }

  // 2. Buscar Karla
  const karla = await Employee.findOne({ name: /karla/i });
  if (!karla) {
    console.error('❌ No se encontró a Karla. Créala primero desde el panel de Empleados.');
    await mongoose.disconnect(); process.exit(1);
  }
  console.log(`\n[seed_karla] 👤 Karla encontrada: ${karla.name} (${karla.email})`);

  // 3. Añadir las 30 tareas a Karla (sin duplicar)
  console.log('\n[seed_karla] 📋 Añadiendo 30 tareas a Karla...');
  let tareasAñadidas = 0;
  let tareasDuplicadas = 0;

  for (const tarea of TAREAS_KARLA) {
    const yaExiste = karla.tasks.some(t => t.title === tarea.title);
    if (!yaExiste) {
      karla.tasks.push({
        title:       tarea.title,
        description: tarea.description,
        done:        false,
        dueDate:     tarea.dueDate,
        createdBy:   director._id,
      });
      tareasAñadidas++;
    } else {
      tareasDuplicadas++;
    }
  }

  await karla.save();
  console.log(`  ✅ ${tareasAñadidas} tareas nuevas añadidas a Karla`);
  if (tareasDuplicadas > 0) console.log(`  ℹ️  ${tareasDuplicadas} tareas ya existían (omitidas)`);

  // 4. Resumen final
  console.log('\n══════════════════════════════════════════════');
  console.log('  RESUMEN SEED KARLA');
  console.log('══════════════════════════════════════════════');
  console.log(`  👤 Karla — ${karla.tasks.length} tareas totales en CRM`);
  console.log(`  🕐 Turno: 16:00 – 20:00 (4 horas tarde)`);
  console.log(`  📅 Tareas distribuidas en 5 días laborables`);
  console.log('\n  👷 TÉCNICOS INSTALADORES (visibles por nombre en CRM):');
  for (const [email, tec] of Object.entries(tecnicoMap)) {
    const zona = tec.zone.split('—')[1]?.trim() || tec.zone;
    console.log(`  • ${tec.name.padEnd(28)} → ${zona}`);
  }
  console.log('\n  📍 REGLA DE ASIGNACIÓN POR ZONA:');
  console.log('  • Benimaclet / Rascanya / Orriols   → Alejandro Ruiz Martínez');
  console.log('  • Eixample / Extramurs / El Carme    → Marcos Ferrer Llopis');
  console.log('  • Patraix / Jesús / Malilla / Russafa→ David Soler Blasco');
  console.log('  • Burjassot / Moncada / Alfara        → Iván Castelló Peris');
  console.log('  • Torrent / Paiporta / Picanya        → Roberto Navarro Giménez');
  console.log('  • Sagunto / Canet / Faura / Almenara  → Sergio Blasco Fuster');
  console.log('══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('[seed_karla] ✅ Listo!');
  process.exit(0);
}

main().catch(e => { console.error('[seed_karla] ❌ Error:', e.message); process.exit(1); });
