require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const empSchema = new mongoose.Schema({ name: String, email: String }, { strict: false });
const Employee = mongoose.model('Employee', empSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Employee.updateOne(
    { email: 'vkarlagisela@gmail.com' },
    { $set: { name: 'Karla Gisela' } }
  );
  console.log('✅ Karla actualizada en MongoDB:', result.modifiedCount, 'documento(s)');
  await mongoose.disconnect();
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
