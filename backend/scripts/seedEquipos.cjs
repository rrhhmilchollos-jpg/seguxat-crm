/**
 * seedEquipos.cjs — 300+ comerciales en grupos con jefes de equipo
 * + técnicos instaladores con disponibilidad dinámica
 * Toda la Comunitat Valenciana
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const empSchema = new mongoose.Schema({
  name:String, email:{type:String,unique:true}, passwordHash:String,
  role:String, zone:String, teamGroup:String, teamLead:Boolean,
  active:{type:Boolean,default:true}, suspended:{type:Boolean,default:false},
  createdBy:{type:mongoose.Schema.Types.ObjectId,default:null}, tasks:{type:Array,default:[]}
},{timestamps:true});
const Employee = mongoose.model('Employee', empSchema);

// Zonas de la Comunitat Valenciana agrupadas por equipos
const EQUIPOS = [
  // Valencia Capital — 6 equipos
  { grupo:"Equipo Valencia Centro", jefe:"Alejandro Torres Vidal", zona:"Centro / Ciutat Vella / El Carmen", tipo:"comercial", miembros:[
    "Beatriz Soria Llopis","Carlos Abad Ferrer","Diana Molina Roca","Eduardo Palau Giménez","Fátima Ros Cano"
  ]},
  { grupo:"Equipo Valencia Ruzafa", jefe:"Laura Sánchez Blasco", zona:"Ruzafa / Eixample / Gran Via", tipo:"comercial", miembros:[
    "Gonzalo Iborra Mas","Helena Climent Vidal","Ignacio Peris Roig","Julia Ferrandis Gil","Kevin Tortosa Bas"
  ]},
  { grupo:"Equipo Valencia Norte", jefe:"Marc Villena Aparici", zona:"Benimaclet / Algirós / Orriols / Torrefiel", tipo:"comercial", miembros:[
    "Laura Escrivà Pons","Manuel Dasí Gregori","Nuria Colomer Talens","Óscar Mahiques Reig","Paula Monzó Climent"
  ]},
  { grupo:"Equipo Valencia Mar", jefe:"Sara Beltrán Alós", zona:"Cabanyal / Poblats Marítims / Nazaret", tipo:"comercial", miembros:[
    "Quique Valor Lluch","Rosa Comes Beltran","Sergio Giménez Soler","Teresa Bosch Fuster","Unai Aparici Navarro"
  ]},
  { grupo:"Equipo Valencia Oeste", jefe:"Iván Soler Marín", zona:"Patraix / Jesús / Nou Moles / Malilla", tipo:"comercial", miembros:[
    "Valentina Cruz Aliaga","William Ortiz Pedrós","Xènia Saiz Català","Yolanda Molina Font","Zacarías Bas Ivorra"
  ]},
  { grupo:"Equipo Valencia Campanar", jefe:"Elena Navarro Bort", zona:"Campanar / Benimamet / Quatre Carreres", tipo:"comercial", miembros:[
    "Adrián Gil Bonet","Blanca Herrero Talens","Cristian Lozano Roig","Dolores Marín Climent","Emilio Fuster Vidal"
  ]},
  // Área Metropolitana Norte
  { grupo:"Equipo Sagunto", jefe:"Fernando Aliaga Pla", zona:"Sagunto / Camp de Morvedre / Puçol", tipo:"comercial", miembros:[
    "Gemma Torres Reig","Héctor Molins Sanz","Inma Belda Palau","Jordi Pascual Llop","Karmen Iborra Gil"
  ]},
  { grupo:"Equipo Burjassot-Paterna", jefe:"Lorena Cano Albelda", zona:"Burjassot / Paterna / Mislata / Quart de Poblet", tipo:"comercial", miembros:[
    "Luis Aparici Roig","Marta Giménez Clau","Nacho Peris Bort","Olga Belda Talens","Pere Monzó Escrivà"
  ]},
  { grupo:"Equipo Manises-Torrent", jefe:"Ramón Bosch Valor", zona:"Manises / Torrent / Paiporta / Catarroja", tipo:"comercial", miembros:[
    "Queralt Bas Climent","Rosa Albelda Crespo","Silvia Bosch Gregori","Tomàs Reig Alapont","Úrsula Fores Talens"
  ]},
  // Área Metropolitana Sur
  { grupo:"Equipo L'Horta Sud", jefe:"Valentí Gil Mahiques", zona:"Silla / Massanassa / Benetússer / Sedaví", tipo:"comercial", miembros:[
    "Wendy Roig Estevan","Xènia Dasí Colomer","Yolanda Peris Bosch","Zaira Moya Catalá","Adriana Ferrando Bort"
  ]},
  { grupo:"Equipo Alzira-Ribera", jefe:"Blanca Escrivà Monleón", zona:"Alzira / Guadassuar / Carlet / Algemesí", tipo:"comercial", miembros:[
    "Cristina Vañó Estrems","Dolors Mahiques Sanz","Emilio Crespo Llopis","Fran Català Giménez","Gemma Climent Alós"
  ]},
  { grupo:"Equipo Cullera-Sueca", jefe:"Hector Ruiz Colomer", zona:"Cullera / Sueca / Tavernes de Valldigna", tipo:"comercial", miembros:[
    "Inma Aparici Llopis","Josefina Talens Cruz","Kiko Navarro Bosch","Lourdes Iborra Mas","Marcos Albelda Cano"
  ]},
  // Área Gandía
  { grupo:"Equipo Gandía Costa", jefe:"Nacho Peris Fuster", zona:"Gandía / Oliva / Tavernes / Xeraco", tipo:"comercial", miembros:[
    "Olga Saiz Monfort","Pere Climent Fores","Quique Navarro Llop","Rosa Alós Ferrandis","Salvador Molina Roig"
  ]},
  { grupo:"Equipo Gandía Interior", jefe:"Teresa Comes Valor", zona:"La Safor interior / Palma de Gandía / Ador", tipo:"comercial", miembros:[
    "Toni Gregori Iborra","Ulises Marí Pascual","Valentina Molina Font","Wendy Clau Reig","Xavi Colomer Vidal"
  ]},
  // Xàtiva - La Costera
  { grupo:"Equipo Xàtiva", jefe:"Yolanda Escrivà Pons", zona:"Xàtiva / Ontinyent / Canals / La Font de la Figuera", tipo:"comercial", miembros:[
    "Zaira Peris Bosch","Adriana Moya Catalá","Blanca Ferrando Bort","Carles Vañó Estrems","Diana Mahiques Sanz"
  ]},
  // Castelló de la Plana
  { grupo:"Equipo Castelló Capital", jefe:"Eduardo Crespo Llopis", zona:"Castelló de la Plana / Benicàssim / Oropesa", tipo:"comercial", miembros:[
    "Fiona Català Giménez","Gloria Climent Alós","Hector Ruiz Cano","Inma Aparici Font","Jordi Talens Cruz"
  ]},
  { grupo:"Equipo Castelló Norte", jefe:"Karmen Navarro Bosch", zona:"Vinaròs / Benicarló / Peñíscola / Morella", tipo:"comercial", miembros:[
    "Laura Iborra Mas","Marcos Albelda Roig","Núria Saiz Climent","Oscar Climent Fores","Paula Navarro Llop"
  ]},
  { grupo:"Equipo La Plana Baixa", jefe:"Quique Alós Ferrandis", zona:"Borriana / Vila-real / Almassora / Nules", tipo:"comercial", miembros:[
    "Rosa Molina Font","Salvador Gregori Iborra","Toni Marí Pascual","Ursula Molina Font","Vicente Clau Reig"
  ]},
  // Alacant
  { grupo:"Equipo Alacant Capital", jefe:"Wendy Colomer Vidal", zona:"Alacant / Sant Vicent / Mutxamel / El Campello", tipo:"comercial", miembros:[
    "Xavier Escrivà Pons","Yolanda Peris Bosch","Zaira Moya Fuster","Adrià Vañó Estrems","Berta Mahiques Sanz"
  ]},
  { grupo:"Equipo Benidorm-Marina", jefe:"Carlos Crespo Llopis", zona:"Benidorm / Altea / Calp / La Marina Alta", tipo:"comercial", miembros:[
    "Diana Català Giménez","Eva Climent Alós","Fernando Ruiz Cano","Gloria Aparici Font","Hector Talens Cruz"
  ]},
  { grupo:"Equipo Elx-Vinalopó", jefe:"Inma Navarro Bosch", zona:"Elx / Crevillent / Santa Pola / Guardamar", tipo:"comercial", miembros:[
    "Jordi Iborra Mas","Karmen Albelda Roig","Laura Saiz Climent","Marcos Climent Fores","Núria Navarro Llop"
  ]},
  { grupo:"Equipo Torrevieja-Orihuela", jefe:"Oscar Alós Ferrandis", zona:"Torrevieja / Orihuela / Pilar de la Horadada", tipo:"comercial", miembros:[
    "Paula Molina Font","Quique Gregori Iborra","Rosa Marí Pascual","Salvador Molina Clau","Toni Colomer Reig"
  ]},
];

// Equipos de técnicos instaladores
const EQUIPOS_TECNICOS = [
  { grupo:"Instaladores Valencia Norte", jefe:"Rubén Palau Giménez", zona:"Benimaclet / Algirós / Torrefiel", tipo:"tecnico", miembros:[
    "Àlex Comes Bonet","Bruno Cano Ferrer","Daniel Fuster Vidal"
  ]},
  { grupo:"Instaladores Valencia Centro", jefe:"Sergio Mora Blasco", zona:"Centro / Ciutat Vella / Ruzafa / Eixample", tipo:"tecnico", miembros:[
    "Emilio Roig Talens","Felipe Bort Climent","Germán Talens Fores"
  ]},
  { grupo:"Instaladores Valencia Sur", jefe:"Carlos Mendoza Torres", zona:"Patraix / Jesús / Malilla / Nou Moles", tipo:"tecnico", miembros:[
    "Hugo Monzó Reig","Isaac Belda Cano","Javier Bosch Aliaga"
  ]},
  { grupo:"Instaladores Valencia Mar", jefe:"Adrián Valls Molina", zona:"Cabanyal / Poblats Marítims / Campanar", tipo:"tecnico", miembros:[
    "Kiko Navarro Pla","Luis Aparici Bas","Marcos Estevan Iborra"
  ]},
  { grupo:"Instaladores Área Metro Norte", jefe:"Jordi Pla Escrivà", zona:"Sagunto / Burjassot / Paterna / Mislata", tipo:"tecnico", miembros:[
    "Nacho Peris Colomer","Oriol Saiz Gregori","Pere Climent Marí"
  ]},
  { grupo:"Instaladores Área Metro Sur", jefe:"Miquel Bas Aparici", zona:"Torrent / Paiporta / Silla / Benetússer", tipo:"tecnico", miembros:[
    "Raúl Escrivà Talens","Salvador Molina Reig","Toni Gregori Cano"
  ]},
  { grupo:"Instaladores Ribera Alta", jefe:"Tomàs Reig Vidal", zona:"Alzira / Algemesí / Carlet / Guadassuar", tipo:"tecnico", miembros:[
    "Ulises Marí Ferrer","Víctor Santamaría Bosch","Àngel Monleón Fuster"
  ]},
  { grupo:"Instaladores Gandía", jefe:"Pau Giménez Roig", zona:"Gandía / Oliva / La Safor", tipo:"tecnico", miembros:[
    "Borja Pascual Cano","César Vañó Climent","David Ferrando Alós"
  ]},
  { grupo:"Instaladores Xàtiva-Costera", jefe:"Ferran Llopis Talens", zona:"Xàtiva / Ontinyent / Canals", tipo:"tecnico", miembros:[
    "Enric Beltran Iborra","Fran Catalá Reig","Guillermo Sanz Molina"
  ]},
  { grupo:"Instaladores Castelló", jefe:"Vicent Iborra Pla", zona:"Castelló de la Plana / Borriana / Vila-real", tipo:"tecnico", miembros:[
    "Hector Ruiz Escrivà","Ismael Colomer Bas","Jonatan Pérez Cano"
  ]},
  { grupo:"Instaladores Alacant Nord", jefe:"Àlex Comes Giménez", zona:"Alacant / Benidorm / Altea / Calp", tipo:"tecnico", miembros:[
    "Kevin Dasí Gregori","Lluis Gregori Vidal","Marcos Albelda Ferrer"
  ]},
  { grupo:"Instaladores Alacant Sud", jefe:"Bruno Cano Talens", zona:"Elx / Torrevieja / Orihuela / Santa Pola", tipo:"tecnico", miembros:[
    "Noel Mahiques Reig","Odilo Sánchez Cano","Pau Estrems Molina"
  ]},
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado:', mongoose.connection.name);
  const pass = await bcrypt.hash('Seguxat2026!', 12);
  const director = await Employee.findOne({ role: 'director' });

  let totalComerciales = 0, totalTecnicos = 0, totalJefes = 0;

  // Crear comerciales por equipos
  for (const equipo of EQUIPOS) {
    // Jefe de equipo
    const jefeSlug = equipo.jefe.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const jefeEmail = `jefe.${jefeSlug}@seguxat.es`;
    let jefe = await Employee.findOne({ email: jefeEmail });
    if (!jefe) {
      jefe = await Employee.create({ name: equipo.jefe, email: jefeEmail, passwordHash: pass,
        role: equipo.tipo, zone: equipo.zona, teamGroup: equipo.grupo, teamLead: true,
        active: true, createdBy: director?._id });
      totalJefes++;
    }
    // Miembros
    for (const nombre of equipo.miembros) {
      const slug = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
      const email = `${slug}@seguxat.es`;
      const exists = await Employee.findOne({ email });
      if (!exists) {
        await Employee.create({ name: nombre, email, passwordHash: pass,
          role: equipo.tipo, zone: equipo.zona, teamGroup: equipo.grupo, teamLead: false,
          active: true, createdBy: director?._id });
        if (equipo.tipo === 'comercial') totalComerciales++; else totalTecnicos++;
      }
    }
  }

  // Crear técnicos por equipos
  for (const equipo of EQUIPOS_TECNICOS) {
    const jefeSlug = equipo.jefe.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const jefeEmail = `jefe.tec.${jefeSlug}@seguxat.es`;
    let jefe = await Employee.findOne({ email: jefeEmail });
    if (!jefe) {
      jefe = await Employee.create({ name: equipo.jefe, email: jefeEmail, passwordHash: pass,
        role: 'tecnico', zone: equipo.zona, teamGroup: equipo.grupo, teamLead: true,
        active: true, createdBy: director?._id });
      totalJefes++;
    }
    for (const nombre of equipo.miembros) {
      const slug = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
      const email = `tec2.${slug}@seguxat.es`;
      const exists = await Employee.findOne({ email });
      if (!exists) {
        await Employee.create({ name: nombre, email, passwordHash: pass,
          role: 'tecnico', zone: equipo.zona, teamGroup: equipo.grupo, teamLead: false,
          active: true, createdBy: director?._id });
        totalTecnicos++;
      }
    }
  }

  const total = await Employee.countDocuments();
  console.log(`✅ Jefes de equipo creados: ${totalJefes}`);
  console.log(`✅ Comerciales nuevos: ${totalComerciales}`);
  console.log(`✅ Técnicos nuevos: ${totalTecnicos}`);
  console.log(`📊 Total empleados en BD: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
