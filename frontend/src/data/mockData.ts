import type { Vet, Owner, Pet, Appt, Product, MedRecord, Vaccine, CatalogProduct, VetStaff } from '../types'

export const VETS: Vet[] = [
  { id: 1, name: 'Dra. Valeria Ríos', specialty: 'Clínica General', hue: '#0d9488' },
  { id: 2, name: 'Dr. Marcos Pérez', specialty: 'Cirugía', hue: '#7c3aed' },
  { id: 3, name: 'Dra. Sofía Chen', specialty: 'Dermatología', hue: '#ea580c' },
]

export const OWNERS: Owner[] = [
  { id: 1, name: 'Laura García', dni: '32.541.890', email: 'lgarcia@gmail.com', phone: '11 4523-8901', address: 'Av. Corrientes 1845, CABA', petIds: [1, 2], since: '2021-03-15' },
  { id: 2, name: 'Rodrigo Martínez', dni: '28.774.321', email: 'rod.martinez@outlook.com', phone: '11 6234-5612', address: 'Perón 523, Palermo', petIds: [3], since: '2020-07-22' },
  { id: 3, name: 'Fernanda López', dni: '35.221.004', email: 'flopez@yahoo.com.ar', phone: '11 5897-3401', address: 'Córdoba 2341, Almagro', petIds: [4, 5], since: '2022-01-10' },
  { id: 4, name: 'Esteban Romero', dni: '30.118.763', email: 'eromero@gmail.com', phone: '11 4112-7890', address: 'Rivadavia 4502, Caballito', petIds: [6], since: '2019-11-03' },
  { id: 5, name: 'Camila Jiménez', dni: '37.890.234', email: 'cami.jim@gmail.com', phone: '11 6745-2301', address: 'Santa Fe 1287, Recoleta', petIds: [7, 8], since: '2023-04-18' },
  { id: 6, name: 'Diego Suárez', dni: '26.534.901', email: 'dsuarez@hotmail.com', phone: '11 4890-6712', address: 'Belgrano 780, Microcentro', petIds: [9], since: '2021-09-27' },
  { id: 7, name: 'Valentina Torres', dni: '39.012.456', email: 'valtorres@gmail.com', phone: '11 5234-8901', address: 'Maipú 345, San Telmo', petIds: [10], since: '2022-11-14' },
  { id: 8, name: 'Pablo Núñez', dni: '33.678.129', email: 'pnunez@gmail.com', phone: '11 4567-3210', address: 'Callao 1123, Balvanera', petIds: [], since: '2023-08-05' },
]

export const PETS: Pet[] = [
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

export const APPTS: Appt[] = [
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

export const PRODUCTS: Product[] = [
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

export const MED_RECORDS: MedRecord[] = [
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

export const VACCINES: Vaccine[] = [
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

export const CATALOG: CatalogProduct[] = [
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

export const VET_STAFF: VetStaff[] = [
  { id: 1, name: 'Dra. Valeria Ríos', matricula: 'MV-12.345', specialty: 'Clínica General', phone: '11 4523-1234', email: 'v.rios@vetadmin.com.ar', active: true },
  { id: 2, name: 'Dr. Marcos Pérez', matricula: 'MV-08.921', specialty: 'Cirugía', phone: '11 5678-9012', email: 'm.perez@vetadmin.com.ar', active: true },
  { id: 3, name: 'Dra. Sofía Chen', matricula: 'MV-23.456', specialty: 'Dermatología', phone: '11 3456-7890', email: 's.chen@vetadmin.com.ar', active: true },
  { id: 4, name: 'Dr. Rodrigo Ibáñez', matricula: 'MV-07.654', specialty: 'Traumatología', phone: '11 2345-6789', email: 'r.ibanez@vetadmin.com.ar', active: false },
]

export const CATALOG_CATEGORIES = ['Todos', ...Array.from(new Set(CATALOG.map(p => p.category)))]
