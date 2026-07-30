import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'dashboard'
  | 'duenos'
  | 'mascotas'
  | 'turnos'
  | 'historia'
  | 'vacunas'
  | 'productos'
  | 'stock'
  | 'veterinarios'

type ApptStatus = 'Pendiente' | 'Confirmado' | 'Atendido' | 'Cancelado'

interface Owner {
  id: number
  name: string
  dni: string
  email: string
  phone: string
  address: string
  petIds: number[]
  since: string
}
interface Pet {
  id: number
  name: string
  species: string
  breed: string
  ownerId: number
  age: number
  weight: number
  color: string
  microchip?: string
  since: string
}
interface Appt {
  id: number
  petId: number
  ownerId: number
  vetId: number
  date: string
  time: string
  duration: number
  reason: string
  status: ApptStatus
}
interface Vet {
  id: number
  name: string
  specialty: string
  hue: string
}
interface Product {
  id: number
  name: string
  category: string
  qty: number
  min: number
  unit: string
  price: number
  supplier: string
}
interface MedRecord {
  id: number
  petId: number
  date: string
  vetId: number
  reason: string
  diagnosis: string
  treatment: string
  notes: string
  weightKg?: number
}
interface Vaccine {
  id: number
  petId: number
  name: string
  date: string
  nextDue: string
  vetId: number
  batch: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const VETS: Vet[] = [
  { id: 1, name: 'Dra. Valeria Ríos', specialty: 'Clínica General', hue: '#0d9488' },
  { id: 2, name: 'Dr. Marcos Pérez', specialty: 'Cirugía', hue: '#7c3aed' },
  { id: 3, name: 'Dra. Sofía Chen', specialty: 'Dermatología', hue: '#ea580c' },
]

const OWNERS: Owner[] = [
  { id: 1, name: 'Laura García', dni: '32.541.890', email: 'lgarcia@gmail.com', phone: '11 4523-8901', address: 'Av. Corrientes 1845, CABA', petIds: [1, 2], since: '2021-03-15' },
  { id: 2, name: 'Rodrigo Martínez', dni: '28.774.321', email: 'rod.martinez@outlook.com', phone: '11 6234-5612', address: 'Perón 523, Palermo', petIds: [3], since: '2020-07-22' },
  { id: 3, name: 'Fernanda López', dni: '35.221.004', email: 'flopez@yahoo.com.ar', phone: '11 5897-3401', address: 'Córdoba 2341, Almagro', petIds: [4, 5], since: '2022-01-10' },
  { id: 4, name: 'Esteban Romero', dni: '30.118.763', email: 'eromero@gmail.com', phone: '11 4112-7890', address: 'Rivadavia 4502, Caballito', petIds: [6], since: '2019-11-03' },
  { id: 5, name: 'Camila Jiménez', dni: '37.890.234', email: 'cami.jim@gmail.com', phone: '11 6745-2301', address: 'Santa Fe 1287, Recoleta', petIds: [7, 8], since: '2023-04-18' },
  { id: 6, name: 'Diego Suárez', dni: '26.534.901', email: 'dsuarez@hotmail.com', phone: '11 4890-6712', address: 'Belgrano 780, Microcentro', petIds: [9], since: '2021-09-27' },
  { id: 7, name: 'Valentina Torres', dni: '39.012.456', email: 'valtorres@gmail.com', phone: '11 5234-8901', address: 'Maipú 345, San Telmo', petIds: [10], since: '2022-11-14' },
  { id: 8, name: 'Pablo Núñez', dni: '33.678.129', email: 'pnunez@gmail.com', phone: '11 4567-3210', address: 'Callao 1123, Balvanera', petIds: [], since: '2023-08-05' },
]

const PETS: Pet[] = [
  { id: 1, name: 'Bella', species: 'Perro', breed: 'Golden Retriever', ownerId: 1, age: 3, weight: 28, color: 'Dorado', microchip: '985141004567890', since: '2021-03-15' },
  { id: 2, name: 'Michi', species: 'Gato', breed: 'Siamés', ownerId: 1, age: 5, weight: 4.2, color: 'Crema y marrón', since: '2021-03-15' },
  { id: 3, name: 'Thor', species: 'Perro', breed: 'Rottweiler', ownerId: 2, age: 2, weight: 42, color: 'Negro y fuego', microchip: '985141008234512', since: '2020-07-22' },
  { id: 4, name: 'Luna', species: 'Perro', breed: 'Beagle', ownerId: 3, age: 4, weight: 12, color: 'Tricolor', microchip: '985141007891234', since: '2022-01-10' },
  { id: 5, name: 'Mango', species: 'Gato', breed: 'Persa', ownerId: 3, age: 6, weight: 5.8, color: 'Naranja', since: '2022-01-10' },
  { id: 6, name: 'Zeus', species: 'Perro', breed: 'Labrador', ownerId: 4, age: 1, weight: 22, color: 'Negro', microchip: '985141003456789', since: '2019-11-03' },
  { id: 7, name: 'Nala', species: 'Gato', breed: 'Europeo común', ownerId: 5, age: 2, weight: 3.9, color: 'Atigrado', since: '2023-04-18' },
  { id: 8, name: 'Coco', species: 'Conejo', breed: 'Mini Lop', ownerId: 5, age: 1, weight: 1.8, color: 'Blanco y negro', since: '2023-04-18' },
  { id: 9, name: 'Rocky', species: 'Perro', breed: 'Bulldog Francés', ownerId: 6, age: 3, weight: 11, color: 'Atigrado', microchip: '985141005678901', since: '2021-09-27' },
  { id: 10, name: 'Lola', species: 'Perro', breed: 'Caniche', ownerId: 7, age: 7, weight: 8, color: 'Blanco', microchip: '985141009012345', since: '2022-11-14' },
]

const APPTS: Appt[] = [
  { id: 1, petId: 1, ownerId: 1, vetId: 1, date: '2026-07-29', time: '08:30', duration: 30, reason: 'Control anual', status: 'Atendido' },
  { id: 2, petId: 3, ownerId: 2, vetId: 1, date: '2026-07-29', time: '09:00', duration: 45, reason: 'Vacuna antirrábica', status: 'Atendido' },
  { id: 3, petId: 6, ownerId: 4, vetId: 2, date: '2026-07-29', time: '09:30', duration: 75, reason: 'Castración programada', status: 'Confirmado' },
  { id: 4, petId: 4, ownerId: 3, vetId: 1, date: '2026-07-29', time: '10:00', duration: 30, reason: 'Revisión dermatológica', status: 'Confirmado' },
  { id: 5, petId: 9, ownerId: 6, vetId: 3, date: '2026-07-29', time: '10:30', duration: 30, reason: 'Alergia cutánea recurrente', status: 'Confirmado' },
  { id: 6, petId: 2, ownerId: 1, vetId: 3, date: '2026-07-29', time: '11:00', duration: 30, reason: 'Dermatitis crónica', status: 'Pendiente' },
  { id: 7, petId: 5, ownerId: 3, vetId: 1, date: '2026-07-29', time: '11:30', duration: 30, reason: 'Control de peso', status: 'Pendiente' },
  { id: 8, petId: 7, ownerId: 5, vetId: 3, date: '2026-07-29', time: '12:00', duration: 30, reason: 'Primera consulta', status: 'Pendiente' },
  { id: 9, petId: 10, ownerId: 7, vetId: 1, date: '2026-07-29', time: '14:00', duration: 30, reason: 'Limpieza dental', status: 'Pendiente' },
  { id: 10, petId: 8, ownerId: 5, vetId: 2, date: '2026-07-29', time: '15:00', duration: 30, reason: 'Consulta general', status: 'Cancelado' },
  { id: 11, petId: 2, ownerId: 1, vetId: 2, date: '2026-07-29', time: '16:00', duration: 45, reason: 'Extracción piezas dentales', status: 'Pendiente' },
  { id: 12, petId: 1, ownerId: 1, vetId: 3, date: '2026-07-29', time: '16:30', duration: 30, reason: 'Control post-operatorio', status: 'Pendiente' },
]

const PRODUCTS: Product[] = [
  { id: 1, name: 'Royal Canin Medium Adult', category: 'Alimento', qty: 24, min: 10, unit: 'bolsa 15kg', price: 18500, supplier: 'Distribuidora Norte' },
  { id: 2, name: 'Frontline Plus Perro M', category: 'Antiparasitario', qty: 8, min: 15, unit: 'pipeta', price: 4200, supplier: 'Vetinsumos SA' },
  { id: 3, name: 'Ivermectina 1% inyectable', category: 'Medicamento', qty: 2, min: 5, unit: 'frasco 50ml', price: 3800, supplier: 'Lab. Vet Arg.' },
  { id: 4, name: 'Vacuna Triple Felina', category: 'Vacuna', qty: 30, min: 20, unit: 'dosis', price: 2900, supplier: "Biogénesis Bagó" },
  { id: 5, name: 'Collar isabelino Talla M', category: 'Accesorio', qty: 12, min: 8, unit: 'unidad', price: 1200, supplier: 'PetSupply' },
  { id: 6, name: 'Amoxicilina 500mg', category: 'Antibiótico', qty: 0, min: 20, unit: 'comprimido', price: 350, supplier: 'Lab. Vet Arg.' },
  { id: 7, name: 'Jeringas 10ml descartables', category: 'Descartable', qty: 200, min: 50, unit: 'unidad', price: 85, supplier: 'MedSupply' },
  { id: 8, name: 'Bravecto Perro 10-20kg', category: 'Antiparasitario', qty: 4, min: 10, unit: 'comprimido', price: 9800, supplier: 'Vetinsumos SA' },
  { id: 9, name: 'Vacuna Antirrábica', category: 'Vacuna', qty: 45, min: 15, unit: 'dosis', price: 3100, supplier: "Biogénesis Bagó" },
  { id: 10, name: 'Suero Fisiológico 500ml', category: 'Insumo', qty: 18, min: 10, unit: 'bolsa', price: 890, supplier: 'MedSupply' },
  { id: 11, name: 'Pro Plan Puppy', category: 'Alimento', qty: 7, min: 8, unit: 'bolsa 3kg', price: 6200, supplier: 'Distribuidora Norte' },
  { id: 12, name: 'Ketoconazol shampoo 200ml', category: 'Dermatología', qty: 0, min: 6, unit: 'frasco', price: 2400, supplier: 'DermVet' },
]

const MED_RECORDS: MedRecord[] = [
  { id: 1, petId: 1, date: '2026-07-29', vetId: 1, reason: 'Control anual', diagnosis: 'Animal sano', treatment: 'Vacunación séxtuple completada', notes: 'Peso estable. Pelaje en excelente estado. Próximo control en 12 meses.', weightKg: 28 },
  { id: 2, petId: 1, date: '2026-02-15', vetId: 1, reason: 'Otitis — seguimiento', diagnosis: 'Otitis externa leve oído derecho', treatment: 'Otológico tópico 7 días + limpieza semanal', notes: 'Cultivo negativo. Buena respuesta esperada. Revisión en 10 días.', weightKg: 27.8 },
  { id: 3, petId: 1, date: '2025-08-10', vetId: 2, reason: 'Herida pata delantera', diagnosis: 'Herida superficial pata delantera izquierda', treatment: 'Limpieza, sutura simple y vendaje', notes: 'Revisión a los 5 días. Evolución muy favorable. Puntos retirados sin complicaciones.', weightKg: 27.5 },
  { id: 4, petId: 1, date: '2025-03-20', vetId: 1, reason: 'Control anual', diagnosis: 'Control anual sin hallazgos', treatment: 'Antiparasitario externo aplicado', notes: 'Todos los parámetros dentro de lo normal para la raza y edad.', weightKg: 27.2 },
  { id: 5, petId: 3, date: '2026-06-12', vetId: 1, reason: 'Cojera leve pata trasera', diagnosis: 'Distensión muscular pata trasera derecha', treatment: 'Reposo 10 días + meloxicam oral 7 días', notes: 'Radiografía sin fracturas. Buena evolución esperada. Revisión en 2 semanas.', weightKg: 42.5 },
  { id: 6, petId: 3, date: '2026-01-08', vetId: 1, reason: 'Control anual + vacuna', diagnosis: 'Animal sano', treatment: 'Séxtuple + desparasitación interna', notes: 'Peso e indicadores normales. Próximo control en 12 meses.', weightKg: 41.8 },
  { id: 7, petId: 9, date: '2026-05-20', vetId: 3, reason: 'Alergia cutánea recurrente', diagnosis: 'Dermatitis atópica', treatment: 'Corticoides 5 días + shampoo medicado semanal', notes: 'Probable alergia estacional. Evitar zonas con pasto húmedo. Control en 30 días.', weightKg: 11.2 },
  { id: 8, petId: 9, date: '2025-11-14', vetId: 3, reason: 'Revisión dermatológica', diagnosis: 'Dermatitis — mejoría notable', treatment: 'Continuar shampoo semanal', notes: 'Buena respuesta al tratamiento previo. Piel menos inflamada.', weightKg: 10.9 },
  { id: 9, petId: 4, date: '2026-03-30', vetId: 1, reason: 'Control general', diagnosis: 'Animal sano', treatment: 'Pipeta antiparasitaria externa', notes: 'Excelente estado general. Peso adecuado para la raza y edad.', weightKg: 12.1 },
  { id: 10, petId: 6, date: '2026-07-01', vetId: 1, reason: 'Primera consulta — cachorro', diagnosis: 'Cachorro sano — plan vacunal iniciado', treatment: 'Cuádruple primera dosis', notes: 'Cachorro de buena conformación. Plan vacunal iniciado. Próxima visita en 21 días.', weightKg: 22 },
  { id: 11, petId: 2, date: '2026-04-22', vetId: 3, reason: 'Dermatitis crónica', diagnosis: 'Dermatitis miliar felina', treatment: 'Corticoides + dieta hipoalergénica 30 días', notes: 'Posible sensibilización alimentaria. Reevaluar en 6 semanas.', weightKg: 4.1 },
  { id: 12, petId: 5, date: '2026-05-10', vetId: 1, reason: 'Control de peso + castración', diagnosis: 'Obesidad leve — post-castración', treatment: 'Dieta restringida + alimento light', notes: 'Reducir 10% del peso en 3 meses. Control mensual de peso.', weightKg: 5.8 },
]

const VACCINES: Vaccine[] = [
  { id: 1, petId: 1, name: 'Séxtuple (DHPPI+L)', date: '2026-07-29', nextDue: '2027-07-29', vetId: 1, batch: 'LOT-2026-A4512' },
  { id: 2, petId: 1, name: 'Antirrábica', date: '2025-07-10', nextDue: '2026-07-10', vetId: 1, batch: 'LOT-2025-R0023' },
  { id: 3, petId: 1, name: 'Bordetella', date: '2025-11-05', nextDue: '2026-05-05', vetId: 1, batch: 'LOT-2025-B1134' },
  { id: 4, petId: 1, name: 'Leptospirosis refuerzo', date: '2026-03-10', nextDue: '2026-09-10', vetId: 1, batch: 'LOT-2026-L0023' },
  { id: 5, petId: 3, name: 'Séxtuple (DHPPI+L)', date: '2025-06-15', nextDue: '2026-06-15', vetId: 1, batch: 'LOT-2025-A3301' },
  { id: 6, petId: 3, name: 'Antirrábica', date: '2026-01-08', nextDue: '2027-01-08', vetId: 1, batch: 'LOT-2026-R0011' },
  { id: 7, petId: 4, name: 'Séxtuple (DHPPI+L)', date: '2026-04-10', nextDue: '2027-04-10', vetId: 1, batch: 'LOT-2026-A1122' },
  { id: 8, petId: 4, name: 'Bordetella', date: '2026-01-22', nextDue: '2026-07-22', vetId: 1, batch: 'LOT-2026-B0031' },
  { id: 9, petId: 9, name: 'Antirrábica', date: '2025-08-22', nextDue: '2026-08-22', vetId: 2, batch: 'LOT-2025-R0045' },
  { id: 10, petId: 9, name: 'Bordetella', date: '2026-02-14', nextDue: '2026-08-14', vetId: 3, batch: 'LOT-2026-B0067' },
  { id: 11, petId: 6, name: 'Séxtuple (DHPPI+L)', date: '2025-11-08', nextDue: '2026-11-08', vetId: 1, batch: 'LOT-2025-A4401' },
  { id: 12, petId: 2, name: 'Triple Felina', date: '2025-09-15', nextDue: '2026-09-15', vetId: 3, batch: 'LOT-2025-F0012' },
  { id: 13, petId: 5, name: 'Triple Felina', date: '2025-12-03', nextDue: '2026-12-03', vetId: 1, batch: 'LOT-2025-F0089' },
  { id: 14, petId: 10, name: 'Séxtuple (DHPPI+L)', date: '2026-01-20', nextDue: '2027-01-20', vetId: 1, batch: 'LOT-2026-A0098' },
  { id: 15, petId: 7, name: 'Triple Felina', date: '2026-04-18', nextDue: '2027-04-18', vetId: 3, batch: 'LOT-2026-F0034' },
]

// ─── Catalog products (with cost/margin) ──────────────────────────────────────

interface CatalogProduct {
  id: number
  name: string
  category: string
  price: number
  cost: number
  barcode?: string
  iva: number
  controlsStock: boolean
  qty: number
  min: number
  unit: string
}

const CATALOG: CatalogProduct[] = [
  { id: 1, name: 'Royal Canin Medium Adult', category: 'Alimento', price: 18500, cost: 12800, barcode: '7891000100103', iva: 10.5, controlsStock: true, qty: 24, min: 10, unit: 'bolsa 15kg' },
  { id: 2, name: 'Frontline Plus Perro M', category: 'Antiparasitario', price: 4200, cost: 2650, barcode: '3661103049831', iva: 21, controlsStock: true, qty: 8, min: 15, unit: 'pipeta' },
  { id: 3, name: 'Ivermectina 1% inyectable', category: 'Medicamento', price: 3800, cost: 2100, barcode: '7799736001234', iva: 21, controlsStock: true, qty: 2, min: 5, unit: 'frasco 50ml' },
  { id: 4, name: 'Vacuna Triple Felina', category: 'Vacuna', price: 2900, cost: 1800, barcode: '7791234567890', iva: 21, controlsStock: true, qty: 30, min: 20, unit: 'dosis' },
  { id: 5, name: 'Collar isabelino Talla M', category: 'Accesorio', price: 1200, cost: 680, barcode: '7898765432101', iva: 21, controlsStock: true, qty: 12, min: 8, unit: 'unidad' },
  { id: 6, name: 'Amoxicilina 500mg', category: 'Medicamento', price: 350, cost: 190, barcode: '7800012345678', iva: 21, controlsStock: true, qty: 0, min: 20, unit: 'comprimido' },
  { id: 7, name: 'Jeringas 10ml descartables', category: 'Descartable', price: 85, cost: 42, barcode: '7891234098765', iva: 21, controlsStock: true, qty: 200, min: 50, unit: 'unidad' },
  { id: 8, name: 'Bravecto Perro 10-20kg', category: 'Antiparasitario', price: 9800, cost: 6500, barcode: '7891234567891', iva: 21, controlsStock: true, qty: 4, min: 10, unit: 'comprimido' },
  { id: 9, name: 'Vacuna Antirrábica', category: 'Vacuna', price: 3100, cost: 1950, barcode: '7799876543210', iva: 21, controlsStock: true, qty: 45, min: 15, unit: 'dosis' },
  { id: 10, name: 'Suero Fisiológico 500ml', category: 'Insumo', price: 890, cost: 520, barcode: '7800987654321', iva: 21, controlsStock: true, qty: 18, min: 10, unit: 'bolsa' },
  { id: 11, name: 'Pro Plan Puppy', category: 'Alimento', price: 6200, cost: 4300, barcode: '7891000200204', iva: 10.5, controlsStock: true, qty: 7, min: 8, unit: 'bolsa 3kg' },
  { id: 12, name: 'Ketoconazol shampoo 200ml', category: 'Dermatología', price: 2400, cost: 1450, barcode: '7800111222333', iva: 21, controlsStock: true, qty: 0, min: 6, unit: 'frasco' },
  { id: 13, name: 'Consulta general', category: 'Servicio', price: 8500, cost: 0, iva: 21, controlsStock: false, qty: 0, min: 0, unit: 'consulta' },
  { id: 14, name: 'Castración canino', category: 'Servicio', price: 45000, cost: 0, iva: 21, controlsStock: false, qty: 0, min: 0, unit: 'cirugía' },
  { id: 15, name: 'Baño y corte Talla M', category: 'Servicio', price: 12000, cost: 0, iva: 21, controlsStock: false, qty: 0, min: 0, unit: 'sesión' },
]

// ─── Veterinary staff ─────────────────────────────────────────────────────────

interface VetStaff {
  id: number
  name: string
  matricula: string
  specialty: string
  phone: string
  email: string
  active: boolean
}

const VET_STAFF: VetStaff[] = [
  { id: 1, name: 'Dra. Valeria Ríos', matricula: 'MV-12.345', specialty: 'Clínica General', phone: '11 4523-1234', email: 'v.rios@vetadmin.com.ar', active: true },
  { id: 2, name: 'Dr. Marcos Pérez', matricula: 'MV-08.921', specialty: 'Cirugía', phone: '11 5678-9012', email: 'm.perez@vetadmin.com.ar', active: true },
  { id: 3, name: 'Dra. Sofía Chen', matricula: 'MV-23.456', specialty: 'Dermatología', phone: '11 3456-7890', email: 's.chen@vetadmin.com.ar', active: true },
  { id: 4, name: 'Dr. Rodrigo Ibáñez', matricula: 'MV-07.654', specialty: 'Traumatología', phone: '11 2345-6789', email: 'r.ibanez@vetadmin.com.ar', active: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function stockStatus(p: Product): 'OK' | 'Bajo' | 'Sin stock' {
  if (p.qty === 0) return 'Sin stock'
  if (p.qty < p.min) return 'Bajo'
  return 'OK'
}

const getOwner = (id: number) => OWNERS.find(o => o.id === id)
const getPet = (id: number) => PETS.find(p => p.id === id)
const getVet = (id: number) => VETS.find(v => v.id === id)

// ─── Icon component ───────────────────────────────────────────────────────────

function Ico({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    paw: (
      <>
        <circle cx="11" cy="4" r="2" />
        <circle cx="18" cy="4" r="2" />
        <circle cx="20.5" cy="12" r="2.5" />
        <circle cx="3.5" cy="12" r="2.5" />
        <path d="M12 17.5C8 17.5 4.5 19.5 4.5 22h15c0-2.5-3.5-4.5-7.5-4.5z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
    syringe: (
      <>
        <line x1="1" y1="23" x2="11" y2="13" />
        <path d="M14.5 14.5 L21 8 L16 3 L9 10" />
        <line x1="8" y1="12" x2="12" y2="8" />
        <line x1="10" y1="14" x2="14" y2="10" />
      </>
    ),
    package: (
      <>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M4.5 6.375a4.125 4.125 0 1 0 8.25 0 4.125 4.125 0 0 0-8.25 0" />
        <path d="M12.75 6.375a4.125 4.125 0 1 0 8.25 0 4.125 4.125 0 0 0-8.25 0" />
        <path d="M8.625 10.5v5.625a3 3 0 0 0 6 0v-1.5" />
        <circle cx="17.625" cy="15" r="1.125" fill="currentColor" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    arrowLeft: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    chevLeft: <polyline points="15 18 9 12 15 6" />,
    chevRight: <polyline points="9 18 15 12 9 6" />,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    trendUp: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    menu: (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
    weight: (
      <>
        <circle cx="12" cy="5" r="3" />
        <path d="M6.5 8h11l1 13H5.5z" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[name] ?? null}
    </svg>
  )
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    Confirmado: 'bg-blue-50 text-blue-700 border border-blue-200',
    Atendido: 'bg-teal-50 text-teal-700 border border-teal-200',
    Cancelado: 'bg-red-50 text-red-500 border border-red-200',
    OK: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Bajo: 'bg-amber-50 text-amber-700 border border-amber-200',
    'Sin stock': 'bg-red-50 text-red-600 border border-red-200',
    Vigente: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Por vencer': 'bg-amber-50 text-amber-700 border border-amber-200',
    Vencida: 'bg-red-50 text-red-600 border border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        styles[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
    >
      {status}
    </span>
  )
}

function KPICard({
  label,
  value,
  sub,
  icon,
  color = 'teal',
}: {
  label: string
  value: string | number
  sub?: string
  icon: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorMap[color] ?? colorMap.teal}`}>
        <Ico name={icon} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium leading-snug">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors cursor-pointer border select-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 active:bg-teal-800',
    outline: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
  }
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Ico name="x" size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  type?: string
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 bg-white transition-shadow"
    />
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value?: string
  onChange?: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white transition-shadow"
    >
      {children}
    </select>
  )
}

function EmptyState({
  icon = 'search',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Ico name={icon} size={18} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Ico
        name="search"
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 placeholder:text-slate-400 bg-white w-full transition-shadow"
      />
    </div>
  )
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

function DashboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const todayAppts = APPTS.filter(a => a.date === '2026-07-29').sort(
    (a, b) => parseTime(a.time) - parseTime(b.time),
  )
  const lowStock = PRODUCTS.filter(p => stockStatus(p) !== 'OK')
  const vacsDue = VACCINES.filter(v => {
    const diff = (new Date(v.nextDue).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 30
  })

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Turnos hoy"
          value={todayAppts.length}
          sub={`${todayAppts.filter(a => a.status === 'Atendido').length} atendidos · ${todayAppts.filter(a => a.status === 'Pendiente').length} pendientes`}
          icon="calendar"
          color="teal"
        />
        <KPICard
          label="Mascotas registradas"
          value={PETS.length}
          sub={`${OWNERS.length} dueños en sistema`}
          icon="paw"
          color="blue"
        />
        <KPICard
          label="Productos bajo stock"
          value={lowStock.length}
          sub={`${lowStock.filter(p => stockStatus(p) === 'Sin stock').length} sin stock — crítico`}
          icon="layers"
          color="amber"
        />
        <KPICard
          label="Vacunas por vencer"
          value={vacsDue.length}
          sub="Próximos 30 días"
          icon="syringe"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Today appointments */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Turnos del día</h3>
              <p className="text-xs text-slate-400 mt-0.5">Miércoles 29 de julio de 2026</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('turnos')}>
              Ver agenda
              <Ico name="chevRight" size={14} />
            </Btn>
          </div>
          <div className="divide-y divide-slate-100">
            {todayAppts.slice(0, 8).map(a => {
              const pet = getPet(a.petId)
              const owner = getOwner(a.ownerId)
              const vet = getVet(a.vetId)
              return (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="min-w-[44px] text-right">
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">{a.time}</span>
                  </div>
                  <div
                    className="w-0.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: vet?.hue ?? '#0d9488' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {pet?.name}
                      <span className="text-slate-400 font-normal"> · {a.reason}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {owner?.name} · {vet?.name}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </div>
              )
            })}
          </div>
          {todayAppts.length > 8 && (
            <div className="px-5 py-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('turnos')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Ver {todayAppts.length - 8} turnos más
              </button>
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ico name="alert" size={15} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Alertas de stock</h3>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
              Ver stock
              <Ico name="chevRight" size={14} />
            </Btn>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStock.length === 0 ? (
              <EmptyState
                icon="check"
                title="Stock normalizado"
                description="Todos los productos están en niveles adecuados."
              />
            ) : (
              lowStock.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.qty} {p.unit} · mín. {p.min}
                    </p>
                  </div>
                  <Badge status={stockStatus(p)} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distribución de turnos</h4>
          <div className="space-y-2.5">
            {(
              [
                ['Atendidos', 'Atendido', 'bg-teal-500'],
                ['Confirmados', 'Confirmado', 'bg-blue-500'],
                ['Pendientes', 'Pendiente', 'bg-amber-400'],
                ['Cancelados', 'Cancelado', 'bg-red-400'],
              ] as [string, ApptStatus, string][]
            ).map(([label, status, bg]) => {
              const count = todayAppts.filter(a => a.status === status).length
              const pct = todayAppts.length ? Math.round((count / todayAppts.length) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bg}`} />
                  <span className="text-sm text-slate-600 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Turnos por veterinario</h4>
          <div className="space-y-2.5">
            {VETS.map(v => {
              const count = todayAppts.filter(a => a.vetId === v.id).length
              const pct = todayAppts.length ? Math.round((count / todayAppts.length) * 100) : 0
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.hue }} />
                  <span className="text-sm text-slate-600 flex-1 truncate">{v.name.replace('Dra. ', '').replace('Dr. ', '')}</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: v.hue }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-teal-600 rounded-xl p-5 shadow-sm text-white">
          <h4 className="text-xs font-semibold text-teal-200 uppercase tracking-wide mb-1">Próximo turno</h4>
          {(() => {
            const next = todayAppts.find(a => a.status === 'Pendiente' || a.status === 'Confirmado')
            if (!next) return <p className="text-teal-200 text-sm mt-2">No hay turnos pendientes.</p>
            const pet = getPet(next.petId)
            const owner = getOwner(next.ownerId)
            const vet = getVet(next.vetId)
            return (
              <div className="mt-2 space-y-1.5">
                <p className="text-xl font-bold tabular-nums">{next.time} hs</p>
                <p className="text-base font-semibold text-white">{pet?.name}</p>
                <p className="text-sm text-teal-100">{next.reason}</p>
                <p className="text-xs text-teal-200">{owner?.name} · {vet?.name}</p>
                <div className="pt-2">
                  <Badge status={next.status} />
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ─── Turnos / Agenda Screen ───────────────────────────────────────────────────

const PX_PER_MIN = 1.5
const GRID_START = 8 * 60
const GRID_END = 18 * 60

const APPT_BG: Record<ApptStatus, string> = {
  Pendiente: '#fffbeb',
  Confirmado: '#eff6ff',
  Atendido: '#f0fdfa',
  Cancelado: '#fef2f2',
}
const APPT_BORDER: Record<ApptStatus, string> = {
  Pendiente: '#f59e0b',
  Confirmado: '#3b82f6',
  Atendido: '#0d9488',
  Cancelado: '#ef4444',
}

function TurnosScreen({ onNewAppt }: { onNewAppt: () => void }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white">
            <Ico name="chevLeft" size={15} />
          </button>
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Miércoles, 29 de julio de 2026</p>
          </div>
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white">
            <Ico name="chevRight" size={15} />
          </button>
          <span className="text-xs text-slate-400 ml-1">{APPTS.length} turnos</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2">
            {VETS.map(v => (
              <div key={v.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.hue }} />
                <span className="text-xs text-slate-600 whitespace-nowrap">
                  {v.name.replace('Dra. ', '').replace('Dr. ', '')}
                </span>
              </div>
            ))}
          </div>
          <Btn onClick={onNewAppt}>
            <Ico name="plus" size={15} />
            Nuevo turno
          </Btn>
        </div>
      </div>

      {/* Agenda grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Vet header row */}
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: '64px repeat(3, 1fr)' }}
        >
          <div className="border-r border-slate-200" />
          {VETS.map((v, i) => (
            <div
              key={v.id}
              className={`px-4 py-3.5 ${i < VETS.length - 1 ? 'border-r border-slate-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.hue }} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="text-xs text-slate-400">{v.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: '560px' }}>
          <div className="grid" style={{ gridTemplateColumns: '64px repeat(3, 1fr)' }}>
            {/* Time labels column */}
            <div className="border-r border-slate-200">
              {hours.map(h => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-3 pt-1"
                  style={{ height: `${60 * PX_PER_MIN}px` }}
                >
                  <span className="text-xs text-slate-400 font-medium tabular-nums">{h}:00</span>
                </div>
              ))}
            </div>

            {/* One column per vet */}
            {VETS.map((v, vi) => {
              const vetAppts = APPTS.filter(a => a.vetId === v.id && a.date === '2026-07-29')
              const totalHeight = (GRID_END - GRID_START) * PX_PER_MIN

              return (
                <div
                  key={v.id}
                  className={`relative ${vi < VETS.length - 1 ? 'border-r border-slate-200' : ''}`}
                  style={{ height: `${totalHeight}px` }}
                >
                  {/* Hour grid lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: `${(h - 8) * 60 * PX_PER_MIN}px` }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hours.slice(0, -1).map(h => (
                    <div
                      key={`${h}h`}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-50"
                      style={{ top: `${((h - 8) * 60 + 30) * PX_PER_MIN}px` }}
                    />
                  ))}

                  {/* Appointment blocks */}
                  {vetAppts.map(a => {
                    const top = (parseTime(a.time) - GRID_START) * PX_PER_MIN
                    const height = Math.max(a.duration * PX_PER_MIN, 32)
                    const pet = getPet(a.petId)
                    const owner = getOwner(a.ownerId)

                    return (
                      <div
                        key={a.id}
                        className="absolute left-1.5 right-1.5 rounded-lg px-2.5 py-2 cursor-pointer hover:brightness-95 transition-all overflow-hidden group"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: APPT_BG[a.status],
                          borderLeft: `3px solid ${APPT_BORDER[a.status]}`,
                          opacity: a.status === 'Cancelado' ? 0.55 : 1,
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                          {a.time} · {pet?.name}
                        </p>
                        {height > 38 && (
                          <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">{a.reason}</p>
                        )}
                        {height > 55 && (
                          <p className="text-xs text-slate-400 truncate leading-tight">{owner?.name}</p>
                        )}
                        {height > 70 && (
                          <div className="mt-1">
                            <Badge status={a.status} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-5 flex-wrap">
        {(
          [
            ['Atendido', 'bg-teal-500'],
            ['Confirmado', 'bg-blue-500'],
            ['Pendiente', 'bg-amber-400'],
            ['Cancelado', 'bg-red-400'],
          ] as [ApptStatus, string][]
        ).map(([s, bg]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
            <span className="text-xs text-slate-500">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mascotas Screen ──────────────────────────────────────────────────────────

function MascotasScreen() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Pet | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PETS.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        (getOwner(p.ownerId)?.name.toLowerCase().includes(q) ?? false),
    )
  }, [search])

  if (selected) {
    return <PetDetail pet={selected} onBack={() => setSelected(null)} />
  }

  const speciesColor: Record<string, string> = {
    Perro: 'bg-amber-100 text-amber-700',
    Gato: 'bg-purple-100 text-purple-700',
    Conejo: 'bg-pink-100 text-pink-700',
    Ave: 'bg-sky-100 text-sky-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especie, raza o dueño..."
          />
        </div>
        <Btn variant="outline" size="sm">
          <Ico name="filter" size={13} />
          Filtrar
        </Btn>
        <Btn size="sm">
          <Ico name="plus" size={13} />
          Nueva mascota
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Mascota', 'Especie', 'Raza', 'Dueño', 'Edad', 'Peso', ''].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider first:rounded-tl-xl"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Sin resultados"
                    description="No hay mascotas que coincidan con la búsqueda."
                  />
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const owner = getOwner(p.ownerId)
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-teal-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm flex-shrink-0">
                          {p.name[0]}
                        </div>
                        <span className="font-medium text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${speciesColor[p.species] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {p.species}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.breed}</td>
                    <td className="px-5 py-3.5 text-slate-600">{owner?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                      {p.age} {p.age === 1 ? 'año' : 'años'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{p.weight} kg</td>
                    <td className="px-5 py-3.5">
                      <Ico name="chevRight" size={15} className="text-slate-300" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} mascotas registradas</p>
    </div>
  )
}

function PetDetail({ pet, onBack }: { pet: Pet; onBack: () => void }) {
  const owner = getOwner(pet.ownerId)
  const records = MED_RECORDS.filter(r => r.petId === pet.id).sort((a, b) =>
    b.date.localeCompare(a.date),
  )
  const vaccs = VACCINES.filter(v => v.petId === pet.id).sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200 bg-white"
        >
          <Ico name="arrowLeft" size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{pet.name}</h2>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-500">{pet.species} · {pet.breed}</span>
          </div>
          <p className="text-xs text-slate-400">Historia clínica completa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Pet card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-600 flex-shrink-0">
              {pet.name[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{pet.name}</h3>
              <p className="text-sm text-slate-500">{pet.species} · {pet.breed}</p>
              {pet.microchip && (
                <p className="text-xs text-slate-400 font-mono mt-1">{pet.microchip}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            {(
              [
                ['Dueño', owner?.name ?? '—'],
                ['Edad', `${pet.age} ${pet.age === 1 ? 'año' : 'años'}`],
                ['Peso', `${pet.weight} kg`],
                ['Color / pelaje', pet.color],
                ['Registrado', formatDate(pet.since)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 text-sm py-0.5">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-800 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="pt-1 space-y-2">
            <Btn className="w-full justify-center">
              <Ico name="calendar" size={14} />
              Nuevo turno
            </Btn>
            <Btn variant="outline" className="w-full justify-center">
              <Ico name="edit" size={14} />
              Editar datos
            </Btn>
          </div>
        </div>

        {/* Medical history timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900">Historia clínica</h3>
            <Btn size="sm">
              <Ico name="plus" size={13} />
              Nueva entrada
            </Btn>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon="file"
              title="Sin registros"
              description="No hay consultas registradas para esta mascota."
            />
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />
              <div className="space-y-6">
                {records.map(r => {
                  const vet = getVet(r.vetId)
                  return (
                    <div key={r.id} className="flex gap-5 relative">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center z-10 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{r.diagnosis}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(r.date)} · {vet?.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2.5 space-y-1">
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">Tratamiento:</span> {r.treatment}
                          </p>
                          <p className="text-xs text-slate-500">{r.notes}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Vaccine card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-3">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ico name="syringe" size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Carnet de vacunación</h3>
            </div>
            <Btn size="sm">
              <Ico name="plus" size={13} />
              Registrar vacuna
            </Btn>
          </div>
          {vaccs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="syringe"
                title="Sin vacunas"
                description="No hay vacunas registradas para esta mascota."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Vacuna', 'Fecha de aplicación', 'Próximo vencimiento', 'Lote', 'Veterinario', 'Estado'].map(
                    h => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccs.map(v => {
                  const vet = getVet(v.vetId)
                  const vs = vaccineStatus(v.nextDue)
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.date)}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{v.batch}</td>
                      <td className="px-5 py-3.5 text-slate-600">{vet?.name}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={vs} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Dueños Screen ────────────────────────────────────────────────────────────

function DuenosScreen({ onNewOwner }: { onNewOwner: () => void }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return OWNERS.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.dni.includes(q) ||
        o.phone.includes(q),
    )
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, DNI, email o teléfono..."
          />
        </div>
        <Btn variant="outline" size="sm">
          <Ico name="filter" size={13} />
          Filtrar
        </Btn>
        <Btn size="sm" onClick={onNewOwner}>
          <Ico name="plus" size={13} />
          Nuevo dueño
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Propietario', 'DNI', 'Email', 'Teléfono', 'Mascotas', 'Cliente desde'].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="Sin resultados"
                    description="No hay dueños que coincidan con la búsqueda."
                  />
                </td>
              </tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                        {o.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{o.name}</p>
                        <p className="text-xs text-slate-400 truncate">{o.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.dni}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.email}</td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.phone}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {o.petIds.length === 0 ? (
                        <span className="text-slate-400 text-xs">Sin mascotas</span>
                      ) : (
                        o.petIds.map(pid => {
                          const p = getPet(pid)
                          return (
                            <span
                              key={pid}
                              className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium"
                            >
                              {p?.name}
                            </span>
                          )
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 tabular-nums">{formatDate(o.since)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} dueños registrados</p>
    </div>
  )
}

// ─── Stock Screen ─────────────────────────────────────────────────────────────

function StockScreen() {
  const [search, setSearch] = useState('')
  const [adjustProd, setAdjustProd] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState('')

  const stats = useMemo(() => {
    const low = PRODUCTS.filter(p => stockStatus(p) === 'Bajo').length
    const out = PRODUCTS.filter(p => stockStatus(p) === 'Sin stock').length
    const valuation = PRODUCTS.reduce((acc, p) => acc + p.qty * p.price, 0)
    return { low, out, valuation, total: PRODUCTS.length }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PRODUCTS.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total productos"
          value={stats.total}
          sub="Artículos en catálogo"
          icon="package"
          color="blue"
        />
        <KPICard
          label="Bajo stock"
          value={stats.low}
          sub="Requieren reposición"
          icon="alert"
          color="amber"
        />
        <KPICard
          label="Sin stock"
          value={stats.out}
          sub="Agotados — urgente"
          icon="alert"
          color="red"
        />
        <KPICard
          label="Valuación total"
          value={formatPrice(stats.valuation)}
          sub="A precio de venta"
          icon="trendUp"
          color="teal"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar producto, categoría o proveedor..."
            />
          </div>
          <Btn variant="outline" size="sm">
            <Ico name="filter" size={13} />
            Filtrar
          </Btn>
          <Btn size="sm">
            <Ico name="plus" size={13} />
            Agregar producto
          </Btn>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                ['Producto', 'left'],
                ['Categoría', 'left'],
                ['Stock actual', 'right'],
                ['Mínimo', 'right'],
                ['Estado', 'left'],
                ['Precio', 'right'],
                ['Proveedor', 'left'],
                ['', 'left'],
              ].map(([h, align]) => (
                <th
                  key={h}
                  className={`text-${align} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const st = stockStatus(p)
              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${st === 'Sin stock' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-3.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`font-semibold tabular-nums ${
                        p.qty === 0
                          ? 'text-red-600'
                          : p.qty < p.min
                            ? 'text-amber-600'
                            : 'text-slate-800'
                      }`}
                    >
                      {p.qty}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">{p.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">{p.min}</td>
                  <td className="px-4 py-3.5">
                    <Badge status={st} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{p.supplier}</td>
                  <td className="px-4 py-3.5">
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustProd(p)
                        setAdjustQty(String(p.qty))
                      }}
                    >
                      Ajustar
                    </Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{filtered.length} productos</p>
        </div>
      </div>

      {adjustProd && (
        <Modal title={`Ajustar stock — ${adjustProd.name}`} onClose={() => setAdjustProd(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock actual</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {adjustProd.qty}
                  <span className="text-sm font-normal text-slate-500 ml-1">{adjustProd.unit}</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock mínimo</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{adjustProd.min}</p>
              </div>
              <div className="ml-auto">
                <Badge status={stockStatus(adjustProd)} />
              </div>
            </div>

            <FormField label="Nuevo stock">
              <Input type="number" value={adjustQty} onChange={setAdjustQty} placeholder="0" />
            </FormField>

            <FormField label="Motivo del ajuste">
              <Select>
                <option>Ingreso de mercadería</option>
                <option>Corrección de inventario</option>
                <option>Devolución a proveedor</option>
                <option>Uso interno</option>
                <option>Merma / vencimiento</option>
              </Select>
            </FormField>

            <FormField label="Notas (opcional)">
              <textarea
                rows={2}
                placeholder="Observaciones sobre el ajuste..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
              />
            </FormField>

            <div className="flex gap-2 pt-1">
              <Btn onClick={() => setAdjustProd(null)}>Guardar cambio</Btn>
              <Btn variant="outline" onClick={() => setAdjustProd(null)}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Historia Clínica Screen ──────────────────────────────────────────────────

function HistoriaScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('')
  const [showModal, setShowModal] = useState(false)

  const pet = selectedPetId !== '' ? getPet(Number(selectedPetId)) : undefined
  const records = useMemo(
    () =>
      selectedPetId !== ''
        ? MED_RECORDS.filter(r => r.petId === Number(selectedPetId)).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [selectedPetId],
  )

  return (
    <div className="space-y-5">
      {/* Selector bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Seleccionar mascota
            </label>
            <select
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white"
            >
              <option value="">— Elegir mascota —</option>
              {PETS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} · {getOwner(p.ownerId)?.name})
                </option>
              ))}
            </select>
          </div>
          {pet && (
            <Btn onClick={() => setShowModal(true)}>
              <Ico name="plus" size={14} />
              Nueva consulta
            </Btn>
          )}
        </div>

        {/* Pet mini-card */}
        {pet && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-base flex-shrink-0">
              {pet.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{pet.name}</p>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  {pet.species} · {pet.breed}
                </span>
                <span className="text-xs text-slate-400">{getOwner(pet.ownerId)?.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pet.age} {pet.age === 1 ? 'año' : 'años'} · {pet.weight} kg ·{' '}
                {records.length} {records.length === 1 ? 'consulta registrada' : 'consultas registradas'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      {!pet ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="file"
            title="Seleccioná una mascota"
            description="Elegí una mascota del selector para ver su historia clínica completa."
          />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="file"
            title="Sin consultas registradas"
            description={`${pet.name} no tiene consultas en su historia clínica todavía.`}
            action={
              <Btn onClick={() => setShowModal(true)}>
                <Ico name="plus" size={14} />
                Registrar primera consulta
              </Btn>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => {
            const vet = getVet(r.vetId)
            const isFirst = i === 0
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isFirst ? 'bg-teal-500' : 'bg-slate-300'}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.reason}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(r.date)} · {vet?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.weightKg !== undefined && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <Ico name="weight" size={13} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 tabular-nums">
                          {r.weightKg} kg
                        </span>
                      </div>
                    )}
                    {isFirst && <Badge status="Atendido" />}
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Diagnóstico
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Tratamiento
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Notas
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.notes}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && pet && (
        <NuevaConsultaModal petName={pet.name} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

// ─── Vacunas Screen ───────────────────────────────────────────────────────────

const TODAY_STR = '2026-07-29'
const TODAY_DATE = new Date(TODAY_STR + 'T00:00:00')

function vaccDaysLeft(nextDue: string): number {
  return Math.round((new Date(nextDue + 'T00:00:00').getTime() - TODAY_DATE.getTime()) / 86400000)
}

function vaccineStatus(nextDue: string): 'Vigente' | 'Por vencer' | 'Vencida' {
  const diff = vaccDaysLeft(nextDue)
  if (diff < 0) return 'Vencida'
  if (diff <= 30) return 'Por vencer'
  return 'Vigente'
}

function VacunasScreen() {
  const [tab, setTab] = useState<'carnet' | 'proximas'>('proximas')
  const [selectedPetId, setSelectedPetId] = useState<number>(1)
  const [showModal, setShowModal] = useState(false)

  const pet = getPet(selectedPetId)
  const carnetVaccs = VACCINES.filter(v => v.petId === selectedPetId).sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  const proximas = useMemo(() => {
    return VACCINES.filter(v => vaccDaysLeft(v.nextDue) <= 90)
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
          {(
            [
              ['proximas', 'Próximas a vencer'],
              ['carnet', 'Carnet por mascota'],
            ] as [typeof tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {label}
              {key === 'proximas' && proximas.length > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === key ? 'bg-teal-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {proximas.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowModal(true)}>
          <Ico name="plus" size={14} />
          Registrar vacuna
        </Btn>
      </div>

      {/* Proximas a vencer tab */}
      {tab === 'proximas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Vacunas a vencer — próximos 90 días</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Mascotas que requieren contacto o refuerzo próximamente
            </p>
          </div>
          {proximas.length === 0 ? (
            <EmptyState
              icon="check"
              title="Todo al día"
              description="No hay vacunas próximas a vencer en los próximos 90 días."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Mascota', 'Dueño', 'Vacuna', 'Vence', 'Días restantes', 'Estado', ''].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proximas.map(v => {
                  const p = getPet(v.petId)
                  const owner = p ? getOwner(p.ownerId) : undefined
                  const vet = getVet(v.vetId)
                  const days = vaccDaysLeft(v.nextDue)
                  const vs = vaccineStatus(v.nextDue)

                  let daysLabel = ''
                  let daysClass = ''
                  if (days < 0) {
                    daysLabel = `Vencida hace ${Math.abs(days)} días`
                    daysClass = 'text-red-600 font-semibold'
                  } else if (days === 0) {
                    daysLabel = 'Vence hoy'
                    daysClass = 'text-red-600 font-semibold'
                  } else {
                    daysLabel = `${days} días`
                    daysClass = days <= 14 ? 'text-amber-600 font-semibold' : 'text-slate-700'
                  }

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 transition-colors ${vs === 'Vencida' ? 'bg-red-50/30' : vs === 'Por vencer' ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs flex-shrink-0">
                            {p?.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{p?.name}</p>
                            <p className="text-xs text-slate-400">{p?.species} · {p?.breed}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{owner?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                      <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                      <td className="px-5 py-3.5"><Badge status={vs} /></td>
                      <td className="px-5 py-3.5">
                        <Btn variant="outline" size="sm">Contactar dueño</Btn>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">{proximas.length} vacunas requieren atención</p>
          </div>
        </div>
      )}

      {/* Carnet tab */}
      {tab === 'carnet' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-52 max-w-sm">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Seleccionar mascota
                </label>
                <select
                  value={selectedPetId}
                  onChange={e => setSelectedPetId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white"
                >
                  {PETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {getOwner(p.ownerId)?.name}
                    </option>
                  ))}
                </select>
              </div>
              {pet && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                    {pet.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pet.name}</p>
                    <p className="text-xs text-slate-400">{pet.species} · {pet.breed} · {getOwner(pet.ownerId)?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Ico name="syringe" size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Carnet de vacunación — {pet?.name}
              </h3>
            </div>
            {carnetVaccs.length === 0 ? (
              <EmptyState
                icon="syringe"
                title="Sin vacunas registradas"
                description="Esta mascota no tiene vacunas en su carnet todavía."
                action={
                  <Btn onClick={() => setShowModal(true)}>
                    <Ico name="plus" size={14} />
                    Registrar primera vacuna
                  </Btn>
                }
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Vacuna', 'Fecha de aplicación', 'Próxima dosis', 'Días restantes', 'Lote', 'Veterinario', 'Estado'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carnetVaccs.map(v => {
                    const vet = getVet(v.vetId)
                    const vs = vaccineStatus(v.nextDue)
                    const days = vaccDaysLeft(v.nextDue)
                    let daysLabel = ''
                    let daysClass = ''
                    if (days < 0) { daysLabel = `Hace ${Math.abs(days)} días`; daysClass = 'text-red-600 font-semibold' }
                    else if (days === 0) { daysLabel = 'Hoy'; daysClass = 'text-red-600 font-semibold' }
                    else { daysLabel = `${days} días`; daysClass = days <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-600' }

                    return (
                      <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${vs === 'Vencida' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                        <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.date)}</td>
                        <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                        <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{v.batch}</td>
                        <td className="px-5 py-3.5 text-slate-600">{vet?.name}</td>
                        <td className="px-5 py-3.5"><Badge status={vs} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && <RegistrarVacunaModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Productos Screen ─────────────────────────────────────────────────────────

const CATALOG_CATEGORIES = ['Todos', ...Array.from(new Set(CATALOG.map(p => p.category)))]

function catalogStockStatus(p: CatalogProduct): 'OK' | 'Bajo' | 'Sin stock' | null {
  if (!p.controlsStock) return null
  if (p.qty === 0) return 'Sin stock'
  if (p.qty < p.min) return 'Bajo'
  return 'OK'
}

function margin(p: CatalogProduct): number {
  if (!p.cost || p.price === 0) return 0
  return Math.round(((p.price - p.cost) / p.price) * 100)
}

function ProductosScreen() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return CATALOG.filter(p => {
      const matchCat = category === 'Todos' || p.category === category
      const matchQ = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [search, category])

  const stats = useMemo(() => {
    const withCost = CATALOG.filter(p => p.cost > 0)
    const avgMargin = withCost.length
      ? Math.round(withCost.reduce((acc, p) => acc + margin(p), 0) / withCost.length)
      : 0
    const totalValuation = CATALOG.filter(p => p.controlsStock).reduce((acc, p) => acc + p.qty * p.price, 0)
    return { total: CATALOG.length, avgMargin, totalValuation, services: CATALOG.filter(p => !p.controlsStock).length }
  }, [])

  function marginColor(pct: number): string {
    if (pct >= 35) return 'text-emerald-700'
    if (pct >= 20) return 'text-teal-600'
    if (pct >= 10) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total productos" value={stats.total} sub="En catálogo" icon="package" color="blue" />
        <KPICard label="Margen promedio" value={`${stats.avgMargin}%`} sub="Sobre precio de venta" icon="trendUp" color="teal" />
        <KPICard label="Servicios" value={stats.services} sub="Sin control de stock" icon="file" color="purple" />
        <KPICard label="Valuación catálogo" value={formatPrice(stats.totalValuation)} sub="Productos con stock" icon="layers" color="amber" />
      </div>

      {/* Category tabs + search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATALOG_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." />
            </div>
            <Btn size="sm" onClick={() => setShowModal(true)}>
              <Ico name="plus" size={13} />
              Nuevo producto
            </Btn>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[
                ['Producto', 'left'],
                ['Categoría', 'left'],
                ['Precio venta', 'right'],
                ['Costo', 'right'],
                ['Margen', 'right'],
                ['Stock', 'right'],
                ['Estado', 'left'],
                ['IVA', 'right'],
                ['', 'left'],
              ].map(([h, align]) => (
                <th key={h} className={`text-${align} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState title="Sin resultados" description="No hay productos que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const st = catalogStockStatus(p)
                const mgn = margin(p)
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.barcode && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{p.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                      {p.cost > 0 ? formatPrice(p.cost) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.cost > 0 ? (
                        <span className={`font-semibold tabular-nums ${marginColor(mgn)}`}>
                          {mgn}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.controlsStock ? (
                        <span className={`font-semibold tabular-nums ${p.qty === 0 ? 'text-red-600' : p.qty < p.min ? 'text-amber-600' : 'text-slate-800'}`}>
                          {p.qty}
                          <span className="text-slate-400 text-xs font-normal ml-1">{p.unit}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">Sin control</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {st ? <Badge status={st} /> : (
                        <span className="text-xs text-slate-400">Servicio</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                      {p.iva}%
                    </td>
                    <td className="px-4 py-3.5">
                      <Btn variant="ghost" size="sm">
                        <Ico name="edit" size={13} />
                      </Btn>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{filtered.length} productos</p>
        </div>
      </div>

      {showModal && <NuevoProductoModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Veterinarios Screen ──────────────────────────────────────────────────────

function VeterinariosScreen() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return VET_STAFF.filter(
      v =>
        v.name.toLowerCase().includes(q) ||
        v.specialty.toLowerCase().includes(q) ||
        v.matricula.toLowerCase().includes(q),
    )
  }, [search])

  const vetHues: Record<number, string> = { 1: '#0d9488', 2: '#7c3aed', 3: '#ea580c' }

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Veterinarios activos"
          value={VET_STAFF.filter(v => v.active).length}
          sub="En ejercicio"
          icon="stethoscope"
          color="teal"
        />
        <KPICard
          label="Total en nómina"
          value={VET_STAFF.length}
          sub="Incluyendo inactivos"
          icon="users"
          color="blue"
        />
        <KPICard
          label="Especialidades"
          value={Array.from(new Set(VET_STAFF.map(v => v.specialty))).length}
          sub="Áreas cubiertas"
          icon="file"
          color="purple"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especialidad o matrícula..."
          />
        </div>
        <Btn size="sm" onClick={() => setShowModal(true)}>
          <Ico name="plus" size={13} />
          Nuevo veterinario
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Veterinario', 'Matrícula', 'Especialidad', 'Teléfono', 'Email', 'Estado', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin resultados" description="No hay veterinarios que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: vetHues[v.id] ?? '#64748b' }}
                      >
                        {v.name.split(' ').filter(n => n.length > 2).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{v.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono text-xs">{v.matricula}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {v.specialty}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 tabular-nums">{v.phone}</td>
                  <td className="px-5 py-4 text-slate-600">{v.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        v.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${v.active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      {v.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Btn variant="ghost" size="sm">
                      <Ico name="edit" size={13} />
                    </Btn>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <NuevoVetModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── New-screen modals ───────────────────────────────────────────────────────

function NuevaConsultaModal({ petName, onClose }: { petName: string; onClose: () => void }) {
  return (
    <Modal title={`Nueva consulta — ${petName}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha">
            <Input type="date" value={TODAY_STR} />
          </FormField>
          <FormField label="Peso (kg)">
            <Input type="number" placeholder="Ej. 12.5" />
          </FormField>
        </div>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>{v.name} · {v.specialty}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Motivo de consulta">
          <Input placeholder="Ej. Control anual, revisión post-operatoria..." />
        </FormField>
        <FormField label="Diagnóstico">
          <textarea
            rows={2}
            placeholder="Diagnóstico del veterinario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <FormField label="Tratamiento indicado">
          <textarea
            rows={2}
            placeholder="Medicación, procedimientos, indicaciones..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <FormField label="Notas adicionales">
          <textarea
            rows={2}
            placeholder="Observaciones, indicaciones al propietario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar consulta</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}

function RegistrarVacunaModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Registrar vacuna" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Mascota">
          <Select>
            {PETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {getOwner(p.ownerId)?.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Nombre de la vacuna">
          <Select>
            <option>Séxtuple (DHPPI+L)</option>
            <option>Antirrábica</option>
            <option>Bordetella</option>
            <option>Leptospirosis</option>
            <option>Triple Felina</option>
            <option>Leucemia Felina</option>
            <option>Otra (especificar)</option>
          </Select>
        </FormField>
        <FormField label="Producto asociado (opcional)">
          <Select>
            <option value="">— Sin asociar —</option>
            {CATALOG.filter(p => p.category === 'Vacuna').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha de aplicación">
            <Input type="date" value={TODAY_STR} />
          </FormField>
          <FormField label="Próxima dosis">
            <Input type="date" />
          </FormField>
        </div>
        <FormField label="Número de lote">
          <Input placeholder="Ej. LOT-2026-A0001" />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Registrar vacuna</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}

function NuevoProductoModal({ onClose }: { onClose: () => void }) {
  const [controlsStock, setControlsStock] = useState(true)
  return (
    <Modal title="Nuevo producto" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre del producto">
          <Input placeholder="Ej. Royal Canin Medium Adult 15kg" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Categoría">
            <Select>
              {CATALOG_CATEGORIES.filter(c => c !== 'Todos').map(c => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Código de barras">
            <Input placeholder="Ej. 7891000100103" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Precio de venta ($)">
            <Input type="number" placeholder="0" />
          </FormField>
          <FormField label="Costo ($)">
            <Input type="number" placeholder="0" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Alícuota IVA">
            <Select>
              <option>21%</option>
              <option>10.5%</option>
              <option>0%</option>
            </Select>
          </FormField>
          <FormField label="Unidad de medida">
            <Input placeholder="Ej. bolsa 15kg, pipeta, dosis..." />
          </FormField>
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">Controla stock</p>
            <p className="text-xs text-slate-400 mt-0.5">Activar para productos físicos con inventario</p>
          </div>
          <button
            type="button"
            onClick={() => setControlsStock(s => !s)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors border-2 border-transparent ${
              controlsStock ? 'bg-teal-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                controlsStock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {controlsStock && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stock inicial">
              <Input type="number" placeholder="0" />
            </FormField>
            <FormField label="Stock mínimo">
              <Input type="number" placeholder="0" />
            </FormField>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar producto</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}

function NuevoVetModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo veterinario" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre completo">
          <Input placeholder="Ej. Dra. Ana López" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Matrícula">
            <Input placeholder="Ej. MV-12.345" />
          </FormField>
          <FormField label="Especialidad">
            <Select>
              <option>Clínica General</option>
              <option>Cirugía</option>
              <option>Dermatología</option>
              <option>Traumatología</option>
              <option>Cardiología</option>
              <option>Oftalmología</option>
              <option>Oncología</option>
              <option>Otra</option>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" />
          </FormField>
          <FormField label="Email">
            <Input type="email" placeholder="nombre@clinica.com.ar" />
          </FormField>
        </div>
        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            placeholder="Días de atención, observaciones..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar veterinario</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function NuevoTurnoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo turno" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha">
            <Input type="date" value="2026-07-29" />
          </FormField>
          <FormField label="Hora">
            <Input type="time" value="09:00" />
          </FormField>
        </div>
        <FormField label="Mascota">
          <Select>
            {PETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {getOwner(p.ownerId)?.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.specialty}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Duración estimada">
          <Select>
            <option>30 minutos</option>
            <option>45 minutos</option>
            <option>60 minutos</option>
            <option>90 minutos</option>
          </Select>
        </FormField>
        <FormField label="Motivo de consulta">
          <Input placeholder="Ej. Control anual, vacunación, castración..." />
        </FormField>
        <FormField label="Notas previas (opcional)">
          <textarea
            rows={2}
            placeholder="Información relevante antes del turno..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Confirmar turno</Btn>
          <Btn variant="outline" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

function NuevoDuenoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo propietario" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre completo">
          <Input placeholder="Ej. Juan Martínez" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="DNI">
            <Input placeholder="Ej. 35.890.123" />
          </FormField>
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" />
          </FormField>
        </div>
        <FormField label="Email">
          <Input type="email" placeholder="email@ejemplo.com" />
        </FormField>
        <FormField label="Dirección">
          <Input placeholder="Calle, número, barrio" />
        </FormField>
        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            placeholder="Información adicional del propietario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Registrar dueño</Btn>
          <Btn variant="outline" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'duenos', label: 'Dueños', icon: 'users' },
  { id: 'mascotas', label: 'Mascotas', icon: 'paw' },
  { id: 'turnos', label: 'Turnos', icon: 'calendar' },
  { id: 'historia', label: 'Historia Clínica', icon: 'file' },
  { id: 'vacunas', label: 'Vacunas', icon: 'syringe' },
  { id: 'productos', label: 'Productos', icon: 'package' },
  { id: 'stock', label: 'Stock', icon: 'layers' },
  { id: 'veterinarios', label: 'Veterinarios', icon: 'stethoscope' },
]

function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  current: Screen
  onNavigate: (s: Screen) => void
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 h-16 border-b border-slate-200 flex items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Ico name="heart" size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">VetAdmin</p>
              <p className="text-xs text-slate-400 mt-0.5">Clínica Veterinaria</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Gestión
          </p>
          {NAV.slice(0, 4).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}

          <p className="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Clínica
          </p>
          {NAV.slice(4, 7).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}

          <p className="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Inventario
          </p>
          {NAV.slice(7).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-slate-200 space-y-0.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              MR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight">M. Rodríguez</p>
              <p className="text-xs text-slate-400 leading-tight">Recepcionista</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Ico name="logout" size={15} className="text-slate-400" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

const SCREEN_TITLES: Record<Screen, string> = {
  dashboard: 'Dashboard',
  duenos: 'Dueños',
  mascotas: 'Mascotas',
  turnos: 'Turnos',
  historia: 'Historia Clínica',
  vacunas: 'Vacunas',
  productos: 'Productos',
  stock: 'Stock e Inventario',
  veterinarios: 'Veterinarios',
}

function TopBar({ screen, onMenuToggle }: { screen: Screen; onMenuToggle: () => void }) {
  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors lg:hidden"
      >
        <Ico name="menu" size={18} />
      </button>

      <h1 className="text-sm font-semibold text-slate-900 mr-auto">{SCREEN_TITLES[screen]}</h1>

      <div className="relative hidden sm:block w-56">
        <Ico
          name="search"
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white placeholder:text-slate-400 transition-all"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
        <Ico name="bell" size={17} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
      </button>

      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors">
        MR
      </div>
    </header>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNuevoTurno, setShowNuevoTurno] = useState(false)
  const [showNuevoDueno, setShowNuevoDueno] = useState(false)

  function renderScreen() {
    switch (screen) {
      case 'dashboard':   return <DashboardScreen onNavigate={setScreen} />
      case 'mascotas':    return <MascotasScreen />
      case 'turnos':      return <TurnosScreen onNewAppt={() => setShowNuevoTurno(true)} />
      case 'duenos':      return <DuenosScreen onNewOwner={() => setShowNuevoDueno(true)} />
      case 'stock':       return <StockScreen />
      case 'historia':    return <HistoriaScreen />
      case 'vacunas':     return <VacunasScreen />
      case 'productos':   return <ProductosScreen />
      case 'veterinarios': return <VeterinariosScreen />
      default:            return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        current={screen}
        onNavigate={setScreen}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <TopBar screen={screen} onMenuToggle={() => setMobileOpen(o => !o)} />
      <main className="lg:ml-60 pt-16 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">{renderScreen()}</div>
      </main>

      {showNuevoTurno && <NuevoTurnoModal onClose={() => setShowNuevoTurno(false)} />}
      {showNuevoDueno && <NuevoDuenoModal onClose={() => setShowNuevoDueno(false)} />}
    </div>
  )
}
