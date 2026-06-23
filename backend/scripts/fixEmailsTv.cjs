require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const empSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, role:String }, {strict:false});
const Employee = mongoose.model('Employee', empSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado:', mongoose.connection.name);
  
  // Find all televenta employees with tv. prefix
  const tvEmps = await Employee.find({ role: 'televenta', email: /^tv\./ });
  console.log(`📋 Encontrados ${tvEmps.length} empleados con prefijo tv.`);
  
  let actualizados = 0;
  for (const emp of tvEmps) {
    const newEmail = emp.email.replace(/^tv\./, '');
    // Check if new email already exists
    const exists = await Employee.findOne({ email: newEmail, _id: { $ne: emp._id } });
    if (!exists) {
      await Employee.updateOne({ _id: emp._id }, { $set: { email: newEmail } });
      actualizados++;
    } else {
      console.log(`⚠️  Conflicto: ${newEmail} ya existe, saltando ${emp.email}`);
    }
  }
  console.log(`✅ ${actualizados} emails actualizados (tv. eliminado)`);
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
