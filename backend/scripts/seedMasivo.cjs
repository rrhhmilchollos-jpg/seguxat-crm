/**
 * seedMasivo.cjs — Seed completo de Seguxat CRM
 * Crea: comerciales (30), técnicos (30), Karla, María, Ivan (director)
 * + 50 leads asignados a Karla + 50 leads asignados a María
 * USO: node scripts/seedMasivo.cjs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

if (!process.env.MONGODB_URI) { console.error('❌ Falta MONGODB_URI en .env'); process.exit(1); }

// ── Schemas ──────────────────────────────────────────────────
const employeeSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, default: 'comercial' },
  zone:         { type: String, default: '' },
  googleId:     { type: String, default: null },
  googleLinkedAt: { type: Date, default: null },
  active:       { type: Boolean, default: true },
  suspended:    { type: Boolean, default: false },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, default: null },
  tasks:        { type: Array, default: [] },
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  zone:           { type: String, required: true },
  phone:          { type: String, default: '' },
  kit:            { type: String, enum: ['esencial','total','negocio'], required: true },
  source:         { type: String, default: 'Web' },
  stage:          { type: String, enum: ['nuevo','contactado','cita','visita','propuesta','contrato','instalacion'], default: 'nuevo' },
  cita:           { type: String, default: null },
  notes:          { type: String, default: '' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, required: true },
  stageChangedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
const Lead     = mongoose.model('Lead', leadSchema);

// ── Datos ────────────────────────────────────────────────────

const ZONAS_VALENCIA = [
  'Ruzafa','Eixample','Centro','Benimaclet','Algirós','Patraix',
  'Jesús','Cabanyal','Pla del Real','Campanar','Torrefiel','Malilla',
  'Nou Moles','Sant Marcel·lí','Nazaret','Benimamet','Quatre Carreres',
  'El Carme','Poblats Marítims','Orriols'
];

const KITS = ['esencial','total','negocio'];
const STAGES = ['nuevo','contactado','cita','visita','propuesta','contrato','instalacion'];
const SOURCES = ['Web','Puerta a puerta','Referido','Llamada entrante','Campaña Google','Instagram','Escudo Vecinal','Feria'];

// 30 comerciales con nombres reales valencianos/españoles
const COMERCIALES = [
  { name: 'Alejandro Martínez', zone: 'Ruzafa / Eixample' },
  { name: 'Beatriz Sánchez', zone: 'Centro / Ciutat Vella' },
  { name: 'Carlos Ferrer', zone: 'Benimaclet / Algirós' },
  { name: 'Diana López', zone: 'Patraix / Jesús' },
  { name: 'Eduardo Romero', zone: 'Cabanyal / Poblats Marítims' },
  { name: 'Fátima García', zone: 'Campanar / Benimamet' },
  { name: 'Gonzalo Torres', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Helena Ruiz', zone: 'Torrefiel / Orriols' },
  { name: 'Ignacio Molina', zone: 'Malilla / Nou Moles' },
  { name: 'Julia Navarro', zone: 'Ruzafa / Eixample' },
  { name: 'Kevin Blasco', zone: 'Centro / El Carme' },
  { name: 'Laura Ibáñez', zone: 'Benimaclet / Algirós' },
  { name: 'Manuel Pérez', zone: 'Patraix / Sant Marcel·lí' },
  { name: 'Nuria Castillo', zone: 'Cabanyal / Nazaret' },
  { name: 'Óscar Moreno', zone: 'Campanar / Benimamet' },
  { name: 'Paula Jiménez', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Quique Vidal', zone: 'Torrefiel / Orriols' },
  { name: 'Rosa Alonso', zone: 'Malilla / Nou Moles' },
  { name: 'Sergio Delgado', zone: 'Ruzafa / Eixample' },
  { name: 'Teresa Campos', zone: 'Centro / Ciutat Vella' },
  { name: 'Unai Fernández', zone: 'Benimaclet / Algirós' },
  { name: 'Valentina Cruz', zone: 'Patraix / Jesús' },
  { name: 'William Ortega', zone: 'Cabanyal / Poblats Marítims' },
  { name: 'Xènia Soler', zone: 'Campanar / Benimamet' },
  { name: 'Yolanda Pascual', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Zacarías Moya', zone: 'Torrefiel / Orriols' },
  { name: 'Adrián Gil', zone: 'Malilla / Nou Moles' },
  { name: 'Blanca Herrero', zone: 'Ruzafa / Eixample' },
  { name: 'Cristian Lozano', zone: 'Centro / El Carme' },
  { name: 'Dolores Marín', zone: 'Benimaclet / Algirós' },
];

// 30 técnicos instaladores
const TECNICOS = [
  { name: 'Rubén Palau', zone: 'Ruzafa / Eixample' },
  { name: 'Carlos Mendoza', zone: 'Patraix / Jesús' },
  { name: 'Adrián Valls', zone: 'Benimaclet / Algirós' },
  { name: 'Sergio Mora', zone: 'Centro / El Carme' },
  { name: 'Jordi Pla', zone: 'Cabanyal / Poblats Marítims' },
  { name: 'Miquel Bas', zone: 'Campanar / Benimamet' },
  { name: 'Tomàs Reig', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Pau Giménez', zone: 'Torrefiel / Orriols' },
  { name: 'Ferran Llopis', zone: 'Malilla / Nou Moles' },
  { name: 'Vicent Iborra', zone: 'Ruzafa / Eixample' },
  { name: 'Àlex Comes', zone: 'Centro / Ciutat Vella' },
  { name: 'Bruno Cano', zone: 'Benimaclet / Algirós' },
  { name: 'Daniel Fuster', zone: 'Patraix / Sant Marcel·lí' },
  { name: 'Emilio Roig', zone: 'Cabanyal / Nazaret' },
  { name: 'Felipe Bort', zone: 'Campanar / Benimamet' },
  { name: 'Germán Talens', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Hugo Monzó', zone: 'Torrefiel / Orriols' },
  { name: 'Isaac Belda', zone: 'Malilla / Nou Moles' },
  { name: 'Javier Bosch', zone: 'Ruzafa / Eixample' },
  { name: 'Kiko Navarro', zone: 'Centro / El Carme' },
  { name: 'Luis Aparici', zone: 'Benimaclet / Algirós' },
  { name: 'Marcos Estevan', zone: 'Patraix / Jesús' },
  { name: 'Nacho Peris', zone: 'Cabanyal / Poblats Marítims' },
  { name: 'Oriol Saiz', zone: 'Campanar / Benimamet' },
  { name: 'Pere Climent', zone: 'Pla del Real / Quatre Carreres' },
  { name: 'Raúl Escrivà', zone: 'Torrefiel / Orriols' },
  { name: 'Salvador Molina', zone: 'Malilla / Nou Moles' },
  { name: 'Toni Gregori', zone: 'Ruzafa / Eixample' },
  { name: 'Ulises Marí', zone: 'Centro / Ciutat Vella' },
  { name: 'Víctor Santamaría', zone: 'Benimaclet / Algirós' },
];

// 50 leads para Karla (fuentes mixtas — web, llamadas, campañas)
const LEADS_KARLA = [
  { name: 'Carmen Ibáñez Ruiz', zone: 'Ruzafa', phone: '612 100 001', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Roberto Sanz Peris', zone: 'Eixample', phone: '612 100 002', kit: 'total', source: 'Llamada entrante', stage: 'nuevo' },
  { name: 'Almudena Pla Tormo', zone: 'Cabanyal', phone: '612 100 003', kit: 'esencial', source: 'Referido', stage: 'contactado' },
  { name: 'Bar El Rincón S.L.', zone: 'Ruzafa', phone: '612 100 004', kit: 'negocio', source: 'Campaña Google', stage: 'nuevo' },
  { name: 'Federico Llorca Gil', zone: 'Patraix', phone: '612 100 005', kit: 'esencial', source: 'Puerta a puerta', stage: 'contactado' },
  { name: 'Marisa Donat Ferrer', zone: 'Benimaclet', phone: '612 100 006', kit: 'total', source: 'Escudo Vecinal', stage: 'cita' },
  { name: 'Quique Navarro Llop', zone: 'Jesús', phone: '612 100 007', kit: 'esencial', source: 'Referido', stage: 'contactado' },
  { name: 'Pilar Esteve Alós', zone: 'Algirós', phone: '612 100 008', kit: 'total', source: 'Web', stage: 'cita' },
  { name: 'Vicente Roig Palau', zone: 'Ciutat Vella', phone: '612 100 009', kit: 'esencial', source: 'Puerta a puerta', stage: 'cita' },
  { name: 'Farmacia Soler C.B.', zone: 'Eixample', phone: '612 100 010', kit: 'negocio', source: 'Referido', stage: 'cita' },
  { name: 'Teresa Bofill Mas', zone: 'Pla del Real', phone: '612 100 011', kit: 'total', source: 'Campaña Google', stage: 'visita' },
  { name: 'Jaume Tormo Vidal', zone: 'Jesús', phone: '612 100 012', kit: 'esencial', source: 'Puerta a puerta', stage: 'visita' },
  { name: 'Inma Calatayud Font', zone: 'Ruzafa', phone: '612 100 013', kit: 'total', source: 'Referido', stage: 'propuesta' },
  { name: 'Óscar Membrillo Ros', zone: 'Centro', phone: '612 100 014', kit: 'esencial', source: 'Escudo Vecinal', stage: 'propuesta' },
  { name: 'Gimnasio Pulso S.L.', zone: 'Algirós', phone: '612 100 015', kit: 'negocio', source: 'Web', stage: 'contrato' },
  { name: 'Lola Ferrandis Bou', zone: 'Benimaclet', phone: '612 100 016', kit: 'total', source: 'Referido', stage: 'instalacion' },
  { name: 'Amparo Crespo Lull', zone: 'Campanar', phone: '612 100 017', kit: 'esencial', source: 'Llamada entrante', stage: 'nuevo' },
  { name: 'Restaurante Cal Pep', zone: 'Cabanyal', phone: '612 100 018', kit: 'negocio', source: 'Instagram', stage: 'nuevo' },
  { name: 'Dolors Puig Mira', zone: 'Torrefiel', phone: '612 100 019', kit: 'esencial', source: 'Web', stage: 'contactado' },
  { name: 'Ferretería Mata S.L.', zone: 'Patraix', phone: '612 100 020', kit: 'negocio', source: 'Campaña Google', stage: 'nuevo' },
  { name: 'Encarna Tortosa Gil', zone: 'Patraix', phone: '612 100 021', kit: 'esencial', source: 'Referido', stage: 'contrato' },
  { name: 'Miquel Borràs Sala', zone: 'Benimaclet', phone: '612 100 022', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Consuelo Aviñó Pons', zone: 'Algirós', phone: '612 100 023', kit: 'esencial', source: 'Puerta a puerta', stage: 'contactado' },
  { name: 'Clínica Dental Roig', zone: 'Eixample', phone: '612 100 024', kit: 'negocio', source: 'Llamada entrante', stage: 'cita' },
  { name: 'Pepita Blasco Tena', zone: 'Ruzafa', phone: '612 100 025', kit: 'esencial', source: 'Escudo Vecinal', stage: 'nuevo' },
  { name: 'Autoescuela Vial Sur', zone: 'Jesús', phone: '612 100 026', kit: 'negocio', source: 'Web', stage: 'propuesta' },
  { name: 'Rosa Gómez Andrés', zone: 'Malilla', phone: '612 100 027', kit: 'total', source: 'Referido', stage: 'nuevo' },
  { name: 'Heladería La Palma', zone: 'Cabanyal', phone: '612 100 028', kit: 'negocio', source: 'Instagram', stage: 'contactado' },
  { name: 'Tomàs Reig Alapont', zone: 'Nou Moles', phone: '612 100 029', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Cristina Mas Villalba', zone: 'Pla del Real', phone: '612 100 030', kit: 'total', source: 'Puerta a puerta', stage: 'contactado' },
  { name: 'Peluquería Style BCN', zone: 'Eixample', phone: '612 100 031', kit: 'negocio', source: 'Llamada entrante', stage: 'nuevo' },
  { name: 'Aurelia Font Climent', zone: 'Torrefiel', phone: '612 100 032', kit: 'esencial', source: 'Referido', stage: 'cita' },
  { name: 'Supermercado Día Express', zone: 'Campanar', phone: '612 100 033', kit: 'negocio', source: 'Web', stage: 'nuevo' },
  { name: 'Bernardo Llopis Mas', zone: 'Patraix', phone: '612 100 034', kit: 'total', source: 'Escudo Vecinal', stage: 'visita' },
  { name: 'Lucía Martínez Olmos', zone: 'Benimaclet', phone: '612 100 035', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Inmobiliaria Levante', zone: 'Centro', phone: '612 100 036', kit: 'negocio', source: 'Campaña Google', stage: 'propuesta' },
  { name: 'Paquita Sanchis Bou', zone: 'Algirós', phone: '612 100 037', kit: 'esencial', source: 'Referido', stage: 'nuevo' },
  { name: 'Taller Mecánico Gómez', zone: 'Quatre Carreres', phone: '612 100 038', kit: 'negocio', source: 'Llamada entrante', stage: 'contactado' },
  { name: 'Francisca Belda Ros', zone: 'Ruzafa', phone: '612 100 039', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Centro Estética Mima', zone: 'Eixample', phone: '612 100 040', kit: 'negocio', source: 'Instagram', stage: 'cita' },
  { name: 'Gregorio Cano Palau', zone: 'Jesús', phone: '612 100 041', kit: 'esencial', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Papelería El Libro', zone: 'Benimaclet', phone: '612 100 042', kit: 'esencial', source: 'Referido', stage: 'contactado' },
  { name: 'Adela Molla Ferrer', zone: 'Malilla', phone: '612 100 043', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Copistería Rapid', zone: 'Campanar', phone: '612 100 044', kit: 'negocio', source: 'Llamada entrante', stage: 'nuevo' },
  { name: 'Ernesto Pérez Vila', zone: 'Patraix', phone: '612 100 045', kit: 'esencial', source: 'Escudo Vecinal', stage: 'contactado' },
  { name: 'Mercería La Aguja', zone: 'Torrefiel', phone: '612 100 046', kit: 'esencial', source: 'Referido', stage: 'nuevo' },
  { name: 'Virtudes Lluch Sanz', zone: 'Pla del Real', phone: '612 100 047', kit: 'total', source: 'Web', stage: 'visita' },
  { name: 'Gestoría Fiscal Mas', zone: 'Centro', phone: '612 100 048', kit: 'negocio', source: 'Campaña Google', stage: 'contrato' },
  { name: 'Dolores Albelda Clau', zone: 'Nou Moles', phone: '612 100 049', kit: 'esencial', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Óptica ClarVis S.L.', zone: 'Eixample', phone: '612 100 050', kit: 'negocio', source: 'Web', stage: 'propuesta' },
];

// 50 leads para María
const LEADS_MARIA = [
  { name: 'Antonio Belda Roig', zone: 'Xàtiva', phone: '612 200 001', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Restaurante La Pepica', zone: 'Cabanyal', phone: '612 200 002', kit: 'negocio', source: 'Llamada entrante', stage: 'contactado' },
  { name: 'Familia Gironés Pla', zone: 'Algirós', phone: '612 200 003', kit: 'total', source: 'Referido', stage: 'nuevo' },
  { name: 'Ferretería Casanova', zone: 'Eixample', phone: '612 200 004', kit: 'negocio', source: 'Web', stage: 'propuesta' },
  { name: 'Manuel Peris Gómez', zone: 'Jesús', phone: '612 200 005', kit: 'esencial', source: 'Referido', stage: 'nuevo' },
  { name: 'Supermercado Verdes', zone: 'Xàtiva', phone: '612 200 006', kit: 'negocio', source: 'Campaña Google', stage: 'contactado' },
  { name: 'Josefa Valor Navarro', zone: 'Benimaclet', phone: '612 200 007', kit: 'total', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Cafetería El Sol', zone: 'Ruzafa', phone: '612 200 008', kit: 'negocio', source: 'Instagram', stage: 'cita' },
  { name: 'Inmaculada Pons Bas', zone: 'Patraix', phone: '612 200 009', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Clínica Vet Fauna', zone: 'Algirós', phone: '612 200 010', kit: 'negocio', source: 'Llamada entrante', stage: 'contactado' },
  { name: 'Ramón Tormo Reig', zone: 'Campanar', phone: '612 200 011', kit: 'esencial', source: 'Escudo Vecinal', stage: 'cita' },
  { name: 'Librería Papel&Letras', zone: 'Centro', phone: '612 200 012', kit: 'negocio', source: 'Web', stage: 'nuevo' },
  { name: 'Encarna Soler Lluch', zone: 'Xàtiva', phone: '612 200 013', kit: 'total', source: 'Referido', stage: 'contactado' },
  { name: 'Tienda Mascotas Woof', zone: 'Benimaclet', phone: '612 200 014', kit: 'negocio', source: 'Instagram', stage: 'nuevo' },
  { name: 'Amparo Iborra Cano', zone: 'Pla del Real', phone: '612 200 015', kit: 'esencial', source: 'Web', stage: 'visita' },
  { name: 'Notaría Fontana & Gil', zone: 'Eixample', phone: '612 200 016', kit: 'negocio', source: 'Campaña Google', stage: 'propuesta' },
  { name: 'Bernarda Faus Monzó', zone: 'Quatre Carreres', phone: '612 200 017', kit: 'esencial', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Centro Yoga Calm', zone: 'Ruzafa', phone: '612 200 018', kit: 'negocio', source: 'Instagram', stage: 'contactado' },
  { name: 'Pascual Giménez Ros', zone: 'Torrefiel', phone: '612 200 019', kit: 'total', source: 'Referido', stage: 'nuevo' },
  { name: 'Academia Idiomas Plus', zone: 'Algirós', phone: '612 200 020', kit: 'negocio', source: 'Web', stage: 'cita' },
  { name: 'Silvia Climent Boix', zone: 'Xàtiva', phone: '612 200 021', kit: 'esencial', source: 'Llamada entrante', stage: 'nuevo' },
  { name: 'Panadería Artesana Forn', zone: 'Cabanyal', phone: '612 200 022', kit: 'negocio', source: 'Referido', stage: 'visita' },
  { name: 'Lorenzo Mas Alapont', zone: 'Jesús', phone: '612 200 023', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Floristería La Rosa', zone: 'Campanar', phone: '612 200 024', kit: 'esencial', source: 'Instagram', stage: 'contactado' },
  { name: 'Concha Villalba Pérez', zone: 'Patraix', phone: '612 200 025', kit: 'total', source: 'Escudo Vecinal', stage: 'nuevo' },
  { name: 'Taller Joyería Brillo', zone: 'Centro', phone: '612 200 026', kit: 'negocio', source: 'Llamada entrante', stage: 'contrato' },
  { name: 'Amparo Llopis Clau', zone: 'Malilla', phone: '612 200 027', kit: 'esencial', source: 'Web', stage: 'nuevo' },
  { name: 'Estudio Arquitectura AG', zone: 'Eixample', phone: '612 200 028', kit: 'negocio', source: 'Campaña Google', stage: 'propuesta' },
  { name: 'Vicenta Polo Molina', zone: 'Benimaclet', phone: '612 200 029', kit: 'esencial', source: 'Referido', stage: 'contactado' },
  { name: 'Bar Deportivo Goles', zone: 'Torrefiel', phone: '612 200 030', kit: 'negocio', source: 'Web', stage: 'nuevo' },
  { name: 'Petra Monfort Crespo', zone: 'Pla del Real', phone: '612 200 031', kit: 'total', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Concesionario AutoVal', zone: 'Quatre Carreres', phone: '612 200 032', kit: 'negocio', source: 'Campaña Google', stage: 'cita' },
  { name: 'Natividad Sanz Font', zone: 'Algirós', phone: '612 200 033', kit: 'esencial', source: 'Escudo Vecinal', stage: 'nuevo' },
  { name: 'Residencia 3ª Edad Sol', zone: 'Campanar', phone: '612 200 034', kit: 'negocio', source: 'Llamada entrante', stage: 'contrato' },
  { name: 'Blanca Ortiz Reig', zone: 'Xàtiva', phone: '612 200 035', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Reformas Hogar Pla', zone: 'Ruzafa', phone: '612 200 036', kit: 'negocio', source: 'Referido', stage: 'visita' },
  { name: 'Margarita Boix Gil', zone: 'Cabanyal', phone: '612 200 037', kit: 'esencial', source: 'Instagram', stage: 'nuevo' },
  { name: 'Lavandería Express BCN', zone: 'Jesús', phone: '612 200 038', kit: 'negocio', source: 'Web', stage: 'contactado' },
  { name: 'Salvador Ferrer Llop', zone: 'Patraix', phone: '612 200 039', kit: 'total', source: 'Escudo Vecinal', stage: 'nuevo' },
  { name: 'Galería Arte Mediterrà', zone: 'Centro', phone: '612 200 040', kit: 'negocio', source: 'Llamada entrante', stage: 'propuesta' },
  { name: 'Remedios Mas Puig', zone: 'Malilla', phone: '612 200 041', kit: 'esencial', source: 'Referido', stage: 'nuevo' },
  { name: 'Dentista Smile Clinic', zone: 'Eixample', phone: '612 200 042', kit: 'negocio', source: 'Campaña Google', stage: 'cita' },
  { name: 'Asunción Climent Vidal', zone: 'Benimaclet', phone: '612 200 043', kit: 'total', source: 'Web', stage: 'nuevo' },
  { name: 'Bazar Todo a 1€ SL', zone: 'Torrefiel', phone: '612 200 044', kit: 'negocio', source: 'Instagram', stage: 'contactado' },
  { name: 'Pilar Escrivà Roig', zone: 'Pla del Real', phone: '612 200 045', kit: 'esencial', source: 'Puerta a puerta', stage: 'nuevo' },
  { name: 'Agencia Viajes Levante', zone: 'Quatre Carreres', phone: '612 200 046', kit: 'negocio', source: 'Web', stage: 'instalacion' },
  { name: 'Caridad Molina Sanz', zone: 'Algirós', phone: '612 200 047', kit: 'esencial', source: 'Referido', stage: 'nuevo' },
  { name: 'Peluquería Canina Wag', zone: 'Campanar', phone: '612 200 048', kit: 'negocio', source: 'Instagram', stage: 'nuevo' },
  { name: 'Milagros Bas Soler', zone: 'Xàtiva', phone: '612 200 049', kit: 'total', source: 'Escudo Vecinal', stage: 'contactado' },
  { name: 'Seguros Mediterráneo', zone: 'Centro', phone: '612 200 050', kit: 'negocio', source: 'Llamada entrante', stage: 'contrato' },
];

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Conectando a MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a:', mongoose.connection.name);

  const defaultPass = await bcrypt.hash('Seguxat2026!', 12);
  const directorPass = await bcrypt.hash('19862210Des', 12);

  // ── 1. Director Ivan ──────────────────────────────────────
  let ivan = await Employee.findOne({ email: 'rrhh.milchollos@gmail.com' });
  if (!ivan) {
    ivan = await Employee.create({
      name: 'Ivan Rubio', email: 'rrhh.milchollos@gmail.com',
      passwordHash: directorPass, role: 'director', zone: 'Toda Valencia', active: true,
    });
    console.log('✅ Director Ivan creado');
  } else {
    console.log('ℹ️  Director Ivan ya existe');
  }

  // ── 2. Coordinadoras ─────────────────────────────────────
  const karlaPass = await bcrypt.hash('Karla2026!', 12);
  let karla = await Employee.findOne({ email: 'vkarlagisela@gmail.com' });
  if (!karla) {
    karla = await Employee.create({
      name: 'Karla Jiménez', email: 'vkarlagisela@gmail.com',
      passwordHash: karlaPass, role: 'televenta', zone: 'Valencia', active: true, createdBy: ivan._id,
    });
    console.log('✅ Karla creada — contraseña provisional: Karla2026!');
  } else {
    console.log('ℹ️  Karla ya existe');
  }

  const mariaPass = await bcrypt.hash('19862210Des', 12);
  let maria = await Employee.findOne({ email: 'msolassanchis@gmail.com' });
  if (!maria) {
    maria = await Employee.create({
      name: 'María D. Solà', email: 'msolassanchis@gmail.com',
      passwordHash: mariaPass, role: 'televenta', zone: 'Xàtiva', active: true, createdBy: ivan._id,
    });
    console.log('✅ María creada — contraseña: 19862210Des');
  } else {
    console.log('ℹ️  María ya existe');
  }

  // ── 3. Comerciales ───────────────────────────────────────
  console.log('\n📋 Creando 30 comerciales...');
  const comercialesCreados = [];
  for (const c of COMERCIALES) {
    const emailSlug = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const email = `${emailSlug}@seguxat.es`;
    let emp = await Employee.findOne({ email });
    if (!emp) {
      emp = await Employee.create({
        name: c.name, email, passwordHash: defaultPass,
        role: 'comercial', zone: c.zone, active: true, createdBy: ivan._id,
      });
    }
    comercialesCreados.push(emp);
  }
  console.log(`✅ ${comercialesCreados.length} comerciales listos`);

  // ── 4. Técnicos ──────────────────────────────────────────
  console.log('\n🔧 Creando 30 técnicos instaladores...');
  const tecnicosCreados = [];
  for (const t of TECNICOS) {
    const emailSlug = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'.').replace(/[^a-z.]/g,'');
    const email = `tec.${emailSlug}@seguxat.es`;
    let emp = await Employee.findOne({ email });
    if (!emp) {
      emp = await Employee.create({
        name: t.name, email, passwordHash: defaultPass,
        role: 'tecnico', zone: t.zone, active: true, createdBy: ivan._id,
      });
    }
    tecnicosCreados.push(emp);
  }
  console.log(`✅ ${tecnicosCreados.length} técnicos listos`);

  // ── 5. Leads de Karla ────────────────────────────────────
  console.log('\n📦 Creando 50 leads para Karla...');
  let karlaLeads = 0;
  for (let i = 0; i < LEADS_KARLA.length; i++) {
    const l = LEADS_KARLA[i];
    const existing = await Lead.findOne({ phone: l.phone });
    if (!existing) {
      const comercial = comercialesCreados[i % comercialesCreados.length];
      await Lead.create({
        ...l,
        assignedTo: comercial._id,
        createdBy: karla._id,
      });
      karlaLeads++;
    }
  }
  console.log(`✅ ${karlaLeads} leads nuevos creados para Karla`);

  // ── 6. Leads de María ────────────────────────────────────
  console.log('\n📦 Creando 50 leads para María...');
  let mariaLeads = 0;
  for (let i = 0; i < LEADS_MARIA.length; i++) {
    const l = LEADS_MARIA[i];
    const existing = await Lead.findOne({ phone: l.phone });
    if (!existing) {
      const comercial = comercialesCreados[(i + 15) % comercialesCreados.length];
      await Lead.create({
        ...l,
        assignedTo: comercial._id,
        createdBy: maria._id,
      });
      mariaLeads++;
    }
  }
  console.log(`✅ ${mariaLeads} leads nuevos creados para María`);

  // ── Resumen ──────────────────────────────────────────────
  const totalEmps = await Employee.countDocuments();
  const totalLeads = await Lead.countDocuments();
  console.log(`\n🎉 SEED COMPLETADO`);
  console.log(`   Empleados en BD: ${totalEmps}`);
  console.log(`   Leads en BD:     ${totalLeads}`);
  console.log(`\n   Accesos:`);
  console.log(`   Ivan (director):  rrhh.milchollos@gmail.com / 19862210Des`);
  console.log(`   Karla:            vkarlagisela@gmail.com / Karla2026!`);
  console.log(`   María:            msolassanchis@gmail.com / 19862210Des`);
  console.log(`   Resto empleados:  [email]@seguxat.es / Seguxat2026!\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
