require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const empSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, passwordHash:String, role:String, zone:String, googleId:{type:String,default:null}, active:{type:Boolean,default:true}, suspended:{type:Boolean,default:false}, createdBy:{type:mongoose.Schema.Types.ObjectId,default:null}, tasks:{type:Array,default:[]} }, {timestamps:true});
const Employee = mongoose.model('Employee', empSchema);

const TELEVENTAS = [
  { name: 'Alba Martínez Ríos', zone: 'Valencia Capital' },
  { name: 'Beatriz Cano Llopis', zone: 'Valencia Norte' },
  { name: 'Carmen Soler Vidal', zone: 'Valencia Sur' },
  { name: 'Diana Pérez Blasco', zone: 'Valencia Este' },
  { name: 'Elena Ruiz Molina', zone: 'Xàtiva / Alzira' },
  { name: 'Fiona García Pons', zone: 'Gandía / Oliva' },
  { name: 'Gloria Torres Mas', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Helena Ibáñez Clau', zone: 'Valencia Capital' },
  { name: 'Irene Navarro Boix', zone: 'Valencia Norte' },
  { name: 'Jana Ferrer Alapont', zone: 'Valencia Sur' },
  { name: 'Karmen Lluch Reig', zone: 'Valencia Este' },
  { name: 'Laura Sanz Fuster', zone: 'Xàtiva / Alzira' },
  { name: 'Marta Giménez Ros', zone: 'Gandía / Oliva' },
  { name: 'Neus Pascual Font', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Olga Belda Palau', zone: 'Valencia Capital' },
  { name: 'Paula Monzó Climent', zone: 'Valencia Norte' },
  { name: 'Queralt Bas Vañó', zone: 'Valencia Sur' },
  { name: 'Rosa Albelda Crespo', zone: 'Valencia Este' },
  { name: 'Silvia Bosch Gregori', zone: 'Xàtiva / Alzira' },
  { name: 'Teresa Comes Valor', zone: 'Gandía / Oliva' },
  { name: 'Úrsula Fores Talens', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Valentina Gil Mahiques', zone: 'Valencia Capital' },
  { name: 'Wendy Roig Estevan', zone: 'Valencia Norte' },
  { name: 'Xènia Dasí Colomer', zone: 'Valencia Sur' },
  { name: 'Yolanda Peris Bosch', zone: 'Valencia Este' },
  { name: 'Zaira Moya Catalá', zone: 'Xàtiva / Alzira' },
  { name: 'Adriana Ferrando Bort', zone: 'Gandía / Oliva' },
  { name: 'Blanca Escrivà Monleón', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Cristina Vañó Estrems', zone: 'Valencia Capital' },
  { name: 'Dolors Mahiques Sanz', zone: 'Valencia Norte' },
  { name: 'Amparo Climent Alós', zone: 'Valencia Sur' },
  { name: 'Antonia Lozano Puig', zone: 'Valencia Este' },
  { name: 'Begoña Herrero Molla', zone: 'Xàtiva / Alzira' },
  { name: 'Concepción Marín Gil', zone: 'Gandía / Oliva' },
  { name: 'Desamparats Pla Roig', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Encarna Villalba Cano', zone: 'Valencia Capital' },
  { name: 'Francisca Ortega Bas', zone: 'Valencia Norte' },
  { name: 'Gemma Saiz Monfort', zone: 'Valencia Sur' },
  { name: 'Hortensia Beltran Noel', zone: 'Valencia Este' },
  { name: 'Inma Aparici Llopis', zone: 'Xàtiva / Alzira' },
  { name: 'Josefina Talens Cruz', zone: 'Gandía / Oliva' },
  { name: 'Lourdes Iborra Mas', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Mercedes Clau Reig', zone: 'Valencia Capital' },
  { name: 'Nieves Gregori Soler', zone: 'Valencia Norte' },
  { name: 'Palmira Colomer Vidal', zone: 'Valencia Sur' },
  { name: 'Remedios Fuster Crespo', zone: 'Valencia Este' },
  { name: 'Salud Boix Pascual', zone: 'Xàtiva / Alzira' },
  { name: 'Trinidad Valor Ferrer', zone: 'Gandía / Oliva' },
  { name: 'Visitación Molina Font', zone: 'Sagunto / Camp de Morvedre' },
  { name: 'Virtudes Escrivà Pons', zone: 'Valencia Capital' },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado:', mongoose.connection.name);
  const pass = await bcrypt.hash('Seguxat2026!', 12);
  const director = await Employee.findOne({ role: 'director' });
  let creados = 0;
  for (const t of TELEVENTAS) {
    const slug = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const email = `tv.${slug}@seguxat.es`;
    const exists = await Employee.findOne({ email });
    if (!exists) {
      await Employee.create({ name: t.name, email, passwordHash: pass, role: 'televenta', zone: t.zone, active: true, createdBy: director?._id });
      creados++;
    }
  }
  const total = await Employee.countDocuments({ role: 'televenta' });
  console.log(`✅ ${creados} agentes de televenta creados. Total televenta en BD: ${total}`);
  const totalEmp = await Employee.countDocuments();
  console.log(`📊 Total empleados en BD: ${totalEmp}`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
