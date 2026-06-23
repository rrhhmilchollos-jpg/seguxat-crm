require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const empSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, passwordHash:String, role:String, zone:String, googleId:{type:String,default:null}, active:{type:Boolean,default:true}, suspended:{type:Boolean,default:false}, createdBy:{type:mongoose.Schema.Types.ObjectId,default:null}, tasks:{type:Array,default:[]} }, {timestamps:true});
const Employee = mongoose.model('Employee', empSchema);

const NUEVOS_TECNICOS = [
  { name: 'Àngel Monleón', zone: 'Jesús / Patraix' },
  { name: 'Borja Pascual', zone: 'Centro / El Carme' },
  { name: 'César Vañó', zone: 'Ruzafa / Eixample' },
  { name: 'David Ferrando', zone: 'Benimaclet / Algirós' },
  { name: 'Enric Beltran', zone: 'Cabanyal / Poblats Marítims' },
  { name: 'Fran Catalá', zone: 'Campanar / Benimamet' },
  { name: 'Guillermo Sanz', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Hector Ruiz', zone: 'Torrefiel / Orriols' },
  { name: 'Ismael Colomer', zone: 'Malilla / Nou Moles' },
  { name: 'Jonatan Pérez', zone: 'Ruzafa / Eixample' },
  { name: 'Kevin Dasí', zone: 'Centro / Ciutat Vella' },
  { name: 'Lluis Gregori', zone: 'Benimaclet / Algirós' },
  { name: 'Marcos Albelda', zone: 'Patraix / Sant Marcel·lí' },
  { name: 'Noel Mahiques', zone: 'Cabanyal / Nazaret' },
  { name: 'Odilo Sánchez', zone: 'Campanar / Benimamet' },
  { name: 'Pau Estrems', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Ramón Bosch', zone: 'Torrefiel / Orriols' },
  { name: 'Samuel Fores', zone: 'Malilla / Nou Moles' },
  { name: 'Tristán Molina', zone: 'Ruzafa / Eixample' },
  { name: 'Uxio Navarro', zone: 'Centro / El Carme' },
  { name: 'Valentí Climent', zone: 'Benimaclet / Algirós' },
  { name: 'Wenceslao Gil', zone: 'Patraix / Jesús' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado:', mongoose.connection.name);
  const pass = await bcrypt.hash('Seguxat2026!', 12);
  const director = await Employee.findOne({ role: 'director' });
  let creados = 0;
  for (const t of NUEVOS_TECNICOS) {
    const slug = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const email = `tec.${slug}@seguxat.es`;
    const exists = await Employee.findOne({ email });
    if (!exists) {
      await Employee.create({ name: t.name, email, passwordHash: pass, role: 'tecnico', zone: t.zone, active: true, createdBy: director?._id });
      creados++;
    }
  }
  const total = await Employee.countDocuments({ role: 'tecnico' });
  console.log(`✅ ${creados} técnicos nuevos creados. Total técnicos en BD: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
