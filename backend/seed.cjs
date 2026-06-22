/**
 * seed_citas.cjs — 30+ citas en Valencia asignadas a técnicos
 * 
 * Para cada cita:
 *  1. Crea un Lead en stage "cita" asignado a Karla (gestora)
 *  2. Añade una TAREA al técnico de zona con los detalles + nota interna
 * 
 * USO: node seed_citas.cjs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dns      = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI'); process.exit(1); }

// ── Schemas ────────────────────────────────────────────────────────────────
const ROLES = { DIRECTOR:'director', COMERCIAL:'comercial', TELEVENTA:'televenta', TECNICO:'tecnico', SOPORTE:'soporte' };
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
  name:            { type: String,   required: true, trim: true },
  email:           { type: String,   required: true, unique: true, lowercase: true },
  passwordHash:    { type: String,   required: true },
  role:            { type: String,   enum: Object.values(ROLES), default: ROLES.COMERCIAL },
  zone:            { type: String,   default: '' },
  googleId:        { type: String,   default: null },
  googleLinkedAt:  { type: Date,     default: null },
  active:          { type: Boolean,  default: true },
  suspended:       { type: Boolean,  default: false },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  tasks:           { type: [taskSchema], default: [] },
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name:           { type: String,  required: true, trim: true },
  zone:           { type: String,  required: true },
  phone:          { type: String,  default: '' },
  kit:            { type: String,  enum: KIT_TYPES, required: true },
  source:         { type: String,  default: 'Llamada entrante' },
  stage:          { type: String,  enum: STAGES, default: 'cita' },
  cita:           { type: String,  default: null },
  notes:          { type: String,  default: '' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  stageChangedAt: { type: Date,    default: Date.now },
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
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${dias[d.getDay()]} ${pad(d.getDate())} ${meses[d.getMonth()]} · ${pad(hour)}:${pad(minute)}`;
}

// ── Datos de citas ─────────────────────────────────────────────────────────
// Cada cita: { nombre, barrio, kit, dias, hora, min, tecnico(email), notaInterna }

const CITAS = [
  // ── ALEJANDRO RUIZ — Valencia Norte / Benimaclet / Rascanya ──
  { nombre:'María Dolores Pérez Llopis',    barrio:'Benimaclet',      kit:'esencial', dias:1, hora:9,  min:0,  tec:'a.ruiz.tec@seguxat.es',
    nota:'Piso 3ºA, portero automático averiado. Llamar antes de subir. Interesada en kit esencial + cámara exterior.' },
  { nombre:'Tomàs Ferrer Blay',             barrio:'Rascanya',        kit:'total',    dias:1, hora:11, min:0,  tec:'a.ruiz.tec@seguxat.es',
    nota:'Chalet adosado. Quiere protección total perímetro. Tiene perro grande, avisar al entrar.' },
  { nombre:'Carmen Roig Catalá',            barrio:'Benimaclet',      kit:'esencial', dias:2, hora:9,  min:30, tec:'a.ruiz.tec@seguxat.es',
    nota:'Señora mayor, vive sola. Muy pendiente de la seguridad tras robo en el bloque de al lado. Hablar despacio y con calma.' },
  { nombre:'Vicent Navarro Monfort',        barrio:'Orriols',         kit:'negocio',  dias:2, hora:11, min:30, tec:'a.ruiz.tec@seguxat.es',
    nota:'Local comercial (ferretería). Horario de visita antes de abrir tienda. Pedir ver el cuadro eléctrico.' },
  { nombre:'Amparo Blasco Esteve',          barrio:'Benimaclet',      kit:'esencial', dias:3, hora:10, min:0,  tec:'a.ruiz.tec@seguxat.es',
    nota:'Segunda visita, la primera se canceló por obras. Tiene presupuesto aprobado, solo falta confirmar instalación.' },
  { nombre:'Llorenç Comes Fuster',          barrio:'Rascanya',        kit:'total',    dias:4, hora:9,  min:0,  tec:'a.ruiz.tec@seguxat.es',
    nota:'Familia con 2 hijos. Recién mudados. Quieren instalación urgente. Preguntar por financiación mensual.' },

  // ── MARCOS FERRER — Valencia Centro / Eixample / Extramurs ──
  { nombre:'Ana Martínez Soler',            barrio:'Eixample',        kit:'total',    dias:1, hora:9,  min:0,  tec:'m.ferrer.tec@seguxat.es',
    nota:'Ático duplex. Acceso por ascensor privado, código 4521. Muy interesada en cámaras interiores + detector de humo.' },
  { nombre:'José Luis Catalán Ruiz',        barrio:'Extramurs',       kit:'esencial', dias:1, hora:11, min:30, tec:'m.ferrer.tec@seguxat.es',
    nota:'Piso alquiler, el propietario da permiso por escrito (confirmado). Contrato a nombre del inquilino.' },
  { nombre:'Silvia Gómez Aparicio',         barrio:'Eixample',        kit:'negocio',  dias:2, hora:10, min:0,  tec:'m.ferrer.tec@seguxat.es',
    nota:'Clínica dental (2 consultas). Necesita cobertura 24h. Revisar normativa de alarmas en centros sanitarios.' },
  { nombre:'Pablo Hernández Vidal',         barrio:'Extramurs',       kit:'esencial', dias:2, hora:12, min:0,  tec:'m.ferrer.tec@seguxat.es',
    nota:'Cliente referido por vecino. Ya tiene presupuesto de competencia, hay que mejorar precio. Llevar tarifas actualizadas.' },
  { nombre:'Rosario Climent Moll',          barrio:'El Carme',        kit:'total',    dias:3, hora:9,  min:30, tec:'m.ferrer.tec@seguxat.es',
    nota:'Local en planta baja zona turística. Ha sufrido 2 robos este año. Urgente. Quiere instalación en 48h si es posible.' },
  { nombre:'Ferran Giménez Llopis',         barrio:'Eixample',        kit:'esencial', dias:3, hora:11, min:30, tec:'m.ferrer.tec@seguxat.es',
    nota:'Despacho de abogados, 1ª planta. Solo disponible de 9 a 14h. Preguntar por sala de espera y archivo.' },
  { nombre:'Laia Puig Cortés',              barrio:'Extramurs',       kit:'total',    dias:4, hora:10, min:0,  tec:'m.ferrer.tec@seguxat.es',
    nota:'Piso recién reformado. Quiere instalación empotrada si es posible. Tiene pareja con alarma en otra empresa, comparando.' },

  // ── DAVID SOLER — Valencia Sur / Jesús / Patraix ──
  { nombre:'Encarna Miralles Mestre',       barrio:'Patraix',         kit:'esencial', dias:1, hora:9,  min:30, tec:'d.soler.tec@seguxat.es',
    nota:'Planta baja con jardín pequeño. Preocupada por la puerta trasera. Confirmar si se puede instalar sensor exterior.' },
  { nombre:'Ramón Calabuig Reig',           barrio:'Jesús',           kit:'total',    dias:1, hora:11, min:0,  tec:'d.soler.tec@seguxat.es',
    nota:'Bar restaurante. Horario de cierre a las 00:00. Necesita activación/desactivación por zonas (cocina vs sala).' },
  { nombre:'Dolores Picó Peris',            barrio:'Patraix',         kit:'esencial', dias:2, hora:9,  min:0,  tec:'d.soler.tec@seguxat.es',
    nota:'Señora jubilada, marido en residencia. Hijos le han pedido que contrate alarma. Hablar con calma, ofrecerle SOS personal.' },
  { nombre:'Miquel Torrent Palau',          barrio:'Jesús',           kit:'negocio',  dias:2, hora:11, min:0,  tec:'d.soler.tec@seguxat.es',
    nota:'Taller mecánico con oficina. Zona de riesgo (robos frecuentes en el polígono). Quiere cámara con grabación 30 días.' },
  { nombre:'Paquita Badenes Valls',         barrio:'Patraix',         kit:'esencial', dias:3, hora:10, min:30, tec:'d.soler.tec@seguxat.es',
    nota:'Primer contacto telefónico muy positivo. Ya tiene vecinos con Seguxat. Pendiente de ver precio final con cuotas.' },
  { nombre:'Ernesto Cervera Ibáñez',        barrio:'Russafa',         kit:'total',    dias:4, hora:9,  min:0,  tec:'d.soler.tec@seguxat.es',
    nota:'Piso turístico (Airbnb). Quiere alarma gestionable desde app. Preguntar por accesos remotos y historial de entradas.' },

  // ── IVÁN CASTELLÓ — Horta Nord / Moncada / Burjassot ──
  { nombre:'Amparo Sanz Ferri',             barrio:'Burjassot',       kit:'esencial', dias:1, hora:9,  min:0,  tec:'i.castello.tec@seguxat.es',
    nota:'Unifamiliar de 2 plantas. Garage incluido en la visita. Preguntar si tiene persianas motorizadas para integrar sensor.' },
  { nombre:'Vicent Pla Górriz',             barrio:'Moncada',         kit:'total',    dias:1, hora:11, min:0,  tec:'i.castello.tec@seguxat.es',
    nota:'Finca agrícola con almacén. Zona sin cobertura GSM fluida, verificar señal in situ antes de comprometer instalación.' },
  { nombre:'Remedios Albiach Roig',         barrio:'Burjassot',       kit:'esencial', dias:2, hora:9,  min:30, tec:'i.castello.tec@seguxat.es',
    nota:'Clienta potencial muy nerviosa tras robo en casa de su hermana. Mostrar protocolo de respuesta y tiempos de reacción CRA.' },
  { nombre:'Josep Mahiques Comes',          barrio:'Alfara del Patriarca', kit:'negocio', dias:2, hora:11, min:30, tec:'i.castello.tec@seguxat.es',
    nota:'Nave industrial pequeña. Actualmente sin alarma. Robo el mes pasado, 3.000€ de pérdidas. Muy motivado.' },
  { nombre:'Neus Sancho Llopis',            barrio:'Moncada',         kit:'total',    dias:3, hora:9,  min:0,  tec:'i.castello.tec@seguxat.es',
    nota:'Chalet con piscina. Quiere cámaras en jardín + alarma perimetral. Presupuesto amplio, no precio-sensitivo.' },
  { nombre:'Aurelio Giner Fuster',          barrio:'Burjassot',       kit:'esencial', dias:4, hora:9,  min:0,  tec:'i.castello.tec@seguxat.es',
    nota:'Piso 1º sin ascensor. Zona tranquila pero ha habido robos en el bloque. Preguntar por ventanas traseras.' },

  // ── ROBERTO NAVARRO — Horta Sud / Torrent / Paiporta ──
  { nombre:'Consuelo Ortega Mestre',        barrio:'Torrent',         kit:'esencial', dias:1, hora:9,  min:0,  tec:'r.navarro.tec@seguxat.es',
    nota:'Vivienda unifamiliar zona residencial. Vecindad de nivel, varias alarmas en la calle. Comparando 3 empresas.' },
  { nombre:'Pascual Ferrer Blanco',         barrio:'Paiporta',        kit:'total',    dias:1, hora:11, min:0,  tec:'r.navarro.tec@seguxat.es',
    nota:'Casa de pueblo, planta baja + piso. Puerta principal muy antigua, verificar compatibilidad cerrojo inteligente.' },
  { nombre:'Rafaela Doménech Más',          barrio:'Torrent',         kit:'esencial', dias:2, hora:10, min:0,  tec:'r.navarro.tec@seguxat.es',
    nota:'Señora mayor, hijo ha acompañado en llamada. Decide el hijo. Ofrecerle plan familiar con descuento referido.' },
  { nombre:'Alfons Climent Vidal',          barrio:'Picanya',         kit:'negocio',  dias:3, hora:10, min:0,  tec:'r.navarro.tec@seguxat.es',
    nota:'Supermercado familiar. Quiere cámaras con acceso web para ver desde casa. Horario: visita antes de abrir (9h).' },
  { nombre:'Francisca Barberà Giménez',     barrio:'Paiporta',        kit:'esencial', dias:3, hora:12, min:0,  tec:'r.navarro.tec@seguxat.es',
    nota:'Clienta muy fiel, ya tuvo Seguxat hace años. Quiere volver. Aplicar descuento cliente recurrente si disponible.' },
  { nombre:'Enric Bosch Palau',             barrio:'Torrent',         kit:'total',    dias:4, hora:10, min:30, tec:'r.navarro.tec@seguxat.es',
    nota:'Piso reformado, cableado nuevo. Óptimo para instalación limpia. Interesado en domótica integrada con alarma.' },

  // ── SERGIO BLASCO — Sagunto / Camp de Morvedre ──
  { nombre:'Trinidad Aguilar Peris',        barrio:'Sagunto (Puerto)', kit:'esencial', dias:1, hora:9,  min:0,  tec:'s.blasco.tec@seguxat.es',
    nota:'Casa cerca del puerto, zona de almacenes. Varios robos en la calle. Quiere instalación urgente este mismo mes.' },
  { nombre:'Bartolomé Lluch Martí',         barrio:'Sagunto (Ciudad)', kit:'total',    dias:1, hora:11, min:0,  tec:'s.blasco.tec@seguxat.es',
    nota:'Chalet con jardín y garaje independiente. Quiere cobertura total incluido garaje. Preguntar por acceso peatonal trasero.' },
  { nombre:'Pilar Querol Monfort',          barrio:'Canet d\'En Berenguer', kit:'esencial', dias:2, hora:9, min:0, tec:'s.blasco.tec@seguxat.es',
    nota:'Segunda residencia (solo fines de semana). Importante: necesita activación/desactivación remota desde app.' },
  { nombre:'Joaquín Peris Córcoles',        barrio:'Sagunto (Puerto)', kit:'negocio',  dias:2, hora:11, min:0,  tec:'s.blasco.tec@seguxat.es',
    nota:'Empresa de transporte, nave grande. Revisar cobertura en zona industrial. Llevar amplificador GSM por si acaso.' },
  { nombre:'Mercè Ibáñez Tormo',            barrio:'Sagunto (Ciudad)', kit:'esencial', dias:3, hora:9,  min:30, tec:'s.blasco.tec@seguxat.es',
    nota:'Piso en edificio antiguo. Comunidad no ha dado permiso para cámara exterior. Solo instalación interior.' },
  { nombre:'Vicenta Calabuig Peñaranda',    barrio:'Faura',            kit:'total',    dias:4, hora:9,  min:0,  tec:'s.blasco.tec@seguxat.es',
    nota:'Casa de pueblo, vivienda heredada. Nunca ha tenido alarma. Mostrar vídeo demo del sistema en tablet.' },
];

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('[seed_citas] Conectando...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seed_citas] Conectado a:', mongoose.connection.name);

  // Buscar Karla y director
  const karla = await Employee.findOne({ name: /karla/i });
  if (!karla) { console.error('❌ No se encontró a Karla. Créala primero en el panel de Empleados.'); process.exit(1); }

  const director = await Employee.findOne({ role: 'director' });
  if (!director) { console.error('❌ No se encontró al director.'); process.exit(1); }

  // Crear técnicos si no existen
  const tecnicosConfig = [
    { name:'Alejandro Ruiz',  email:'a.ruiz.tec@seguxat.es',    zone:'Valencia Norte / Benimaclet / Rascanya'        },
    { name:'Marcos Ferrer',   email:'m.ferrer.tec@seguxat.es',  zone:'Valencia Centro / Eixample / Extramurs'        },
    { name:'David Soler',     email:'d.soler.tec@seguxat.es',   zone:'Valencia Sur / Jesús / Patraix'                },
    { name:'Iván Castelló',   email:'i.castello.tec@seguxat.es',zone:'Horta Nord / Moncada / Burjassot'              },
    { name:'Roberto Navarro', email:'r.navarro.tec@seguxat.es', zone:'Horta Sud / Torrent / Paiporta'                },
    { name:'Sergio Blasco',   email:'s.blasco.tec@seguxat.es',  zone:'Camp de Morvedre / Sagunto'                    },
  ];

  const tecnicoMap = {}; // email → Employee doc
  for (const cfg of tecnicosConfig) {
    let emp = await Employee.findOne({ email: cfg.email });
    if (!emp) {
      emp = await Employee.create({
        name: cfg.name, email: cfg.email,
        passwordHash: await bcrypt.hash('Seguxat2026!', 12),
        role: ROLES.TECNICO, zone: cfg.zone,
        active: true, createdBy: director._id,
      });
      console.log('[seed_citas] ✅ Técnico creado:', cfg.name);
    }
    tecnicoMap[cfg.email] = emp;
  }

  // Procesar cada cita
  let creadas = 0;
  let yaExistian = 0;

  for (const cita of CITAS) {
    const tecnico = tecnicoMap[cita.tec];
    if (!tecnico) { console.warn('⚠️  Técnico no encontrado:', cita.tec); continue; }

    const labelCita = citaLabel(cita.dias, cita.hora, cita.min);
    const fechaCita = futureDate(cita.dias, cita.hora, cita.min);

    // Evitar duplicados en leads
    const leadExistente = await Lead.findOne({ name: cita.nombre, assignedTo: karla._id });
    if (!leadExistente) {
      await Lead.create({
        name:           cita.nombre,
        zone:           cita.barrio,
        phone:          '',
        kit:            cita.kit,
        source:         'Llamada entrante',
        stage:          'cita',
        cita:           labelCita,
        notes:          `[NOTA INTERNA] ${cita.nota}`,
        assignedTo:     karla._id,
        createdBy:      karla._id,
        stageChangedAt: new Date(),
      });
    }

    // Añadir tarea al técnico (si no existe ya)
    const tituloTarea = `Visita: ${cita.nombre} — ${cita.barrio} — ${labelCita}`;
    const yaExiste = tecnico.tasks.some(t => t.title === tituloTarea);
    if (!yaExiste) {
      tecnico.tasks.push({
        title:       tituloTarea,
        description: `📋 NOTA INTERNA DE KARLA:\n${cita.nota}\n\n📦 Kit solicitado: ${cita.kit.toUpperCase()}\n📍 Zona: ${cita.barrio}\n🕐 Hora: ${pad(cita.hora)}:${pad(cita.min)}`,
        done:        false,
        dueDate:     fechaCita,
        createdBy:   karla._id,
      });
      creadas++;
    } else {
      yaExistian++;
    }
  }

  // Guardar cambios en cada técnico
  for (const tecnico of Object.values(tecnicoMap)) {
    await tecnico.save();
  }

  console.log(`\n[seed_citas] ✅ ${creadas} citas nuevas creadas y asignadas a técnicos`);
  if (yaExistian > 0) console.log(`[seed_citas] ℹ️  ${yaExistian} citas ya existían (omitidas)`);

  // Resumen por técnico
  console.log('\n📅 RESUMEN DE CITAS POR TÉCNICO:');
  for (const [email, tec] of Object.entries(tecnicoMap)) {
    const citasTec = CITAS.filter(c => c.tec === email);
    console.log(`  ${tec.name.padEnd(18)} (${tec.zone.split('/')[0].trim()}) → ${citasTec.length} citas`);
  }
  console.log(`  ${'TOTAL'.padEnd(18)}                           → ${CITAS.length} citas`);

  await mongoose.disconnect();
  console.log('\n[seed_citas] ✅ Listo!');
  process.exit(0);
}

main().catch(e => { console.error('[seed_citas] ❌ Error:', e.message, e.stack); process.exit(1); });
