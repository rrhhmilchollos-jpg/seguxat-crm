require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);
const {DIRECTOR_NAME,DIRECTOR_EMAIL,DIRECTOR_PASSWORD,MONGODB_URI} = process.env;
if(!DIRECTOR_NAME||!DIRECTOR_EMAIL||!DIRECTOR_PASSWORD){console.error('Faltan datos en .env');process.exit(1);}
if(!MONGODB_URI){console.error('Falta MONGODB_URI en .env');process.exit(1);}
const schema = new mongoose.Schema({name:String,email:{type:String,unique:true,lowercase:true},passwordHash:String,role:{type:String,default:'director'},zone:{type:String,default:'Toda Valencia'},googleId:{type:String,default:null},active:{type:Boolean,default:true}},{timestamps:true});
const Employee = mongoose.model('Employee',schema);
async function main(){
  console.log('[seed] Conectando...');
  await mongoose.connect(MONGODB_URI);
  console.log('[seed] Conectado a:',mongoose.connection.name);
  const email=DIRECTOR_EMAIL.toLowerCase().trim();
  let emp=await Employee.findOne({email});
  if(emp){emp.role='director';emp.active=true;await emp.save();console.log('[seed] Actualizado:',email);}
  else{const passwordHash=await bcrypt.hash(DIRECTOR_PASSWORD,12);await Employee.create({name:DIRECTOR_NAME,email,passwordHash,role:'director'});console.log('[seed] Creado:',email);}
  console.log('[seed] Listo!');
  await mongoose.disconnect();process.exit(0);
}
main().catch(e=>{console.error('[seed] Error:',e.message);process.exit(1);});
