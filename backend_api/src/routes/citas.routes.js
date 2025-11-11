import express from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js'; // Lo usamos para CREAR el caso
import eaPool from '../services/eaDatabase.js'; // ¡La nueva "fuente de verdad" para citas!
import { requireAuth } from '../middleware/auth.middleware.js';
import { randomUUID } from 'crypto'; // Para el "Magic Link" seguro

const router = express.Router();

// =========================================================
// NUEVA RUTA: GET /citas/disponibilidad
// Propósito: Consultar los horarios OCUPADOS de un técnico
// =========================================================
router.get('/disponibilidad', requireAuth, async (req, res) => {
  const { tecnico_id, fecha } = req.query; // ej: ?tecnico_id=5&fecha=2025-11-12

  if (!tecnico_id || !fecha) {
    return res.status(400).json({ message: 'El ID del técnico y la fecha son requeridos.' });
  }

  try {
    // 1. Convertir la fecha a formato SQL (YYYY-MM-DD)
    const sqlDate = new Date(fecha).toISOString().split('T')[0];

    // 2. La Consulta Clave a Easy!Appointments (MariaDB)
    // Esto trae AMBAS, citas de LETE y bloqueos personales de GCal
    const sql = `
      SELECT 
        TIME(start_datetime) AS hora_inicio, 
        TIME(end_datetime) AS hora_fin
      FROM ea_appointments
      WHERE id_users_provider = ?
        AND DATE(start_datetime) = ?;
    `;
    
    const [rows] = await eaPool.query(sql, [tecnico_id, sqlDate]);

    // 3. Formatear la respuesta para el frontend
    const horariosOcupados = rows.map(cita => ({
      inicio: cita.hora_inicio.substring(0, 5), // Formato "HH:MM"
      fin: cita.hora_fin.substring(0, 5),     // Formato "HH:MM"
    }));

    res.json(horariosOcupados);

  } catch (error) {
    console.error('Error al consultar disponibilidad E!A:', error);
    res.status(500).json({ message: 'Error al consultar disponibilidad.' });
  }
});


// =========================================================
// RUTA MODIFICADA: POST /citas
// Propósito: Implementar el flujo "fusionado" (1 solo paso)
// =========================================================
router.post('/', requireAuth, async (req, res) => {
  // 1. Recibimos *todos* los datos del nuevo formulario fusionado
  const {
    // Datos del Caso (de Supabase)
    cliente_nombre,
    cliente_telefono,
    tipo_caso, 
    // Datos de la Cita (de E!A)
    tecnico_id,       // (id_users_provider en E!A)
    fecha,            // 'YYYY-MM-DD'
    hora,             // 'HH:MM'
    duracion_horas,
    // Datos de GMap y Notas
    direccion_legible, // (location en E!A)
    link_gmaps,       // (direccion_link en E!A)
    notas_adicionales // (notes en E!A)
  } = req.body;

  // Validación simple (la mejoraremos luego)
  if (!tecnico_id || !fecha || !hora || !link_gmaps || !tipo_caso || !cliente_nombre) {
    return res.status(400).json({ message: 'Faltan datos clave para agendar.' });
  }

  try {
    // --- TAREA 1: Crear el 'Caso' en Supabase ---
    const { data: nuevoCaso, error: casoError } = await supabaseAdmin
      .from('casos') // (Asegúrate que tu tabla se llame 'casos')
      .insert({
        nombre_cliente: cliente_nombre,
        telefono_cliente: cliente_telefono,
        tipo: tipo_caso,
        status: 'Agendado' // Ponemos el status inicial
      })
      .select()
      .single();

    if (casoError) {
      console.error('Error creando caso en Supabase:', casoError);
      throw new Error(`Error Supabase: ${casoError.message}`);
    }

    const caso_id = nuevoCaso.id;

    // --- TAREA 2: Generar Token y preparar datos E!A ---
    const magicToken = randomUUID(); // Token seguro: 'f47ac10b-...'
    
    // Formatear fechas para MariaDB (MySQL)
    const start_datetime = `${fecha}T${hora}:00`; // ej: '2025-11-12T11:30:00'
    const startObj = new Date(start_datetime);
    const endObj = new Date(startObj.getTime() + (duracion_horas * 60 * 60 * 1000));
    
    // Convierte a 'YYYY-MM-DD HH:MM:SS' en UTC (MySQL/MariaDB lo manejará)
    const end_datetime_utc = endObj.toISOString().slice(0, 19).replace('T', ' ');
    const start_datetime_utc = startObj.toISOString().slice(0, 19).replace('T', ' ');

    const notas_estructuradas = JSON.stringify({
      caso_id: caso_id,
      magic_token: magicToken
    });

    // --- TAREA 3: Insertar la 'Cita' en Easy!Appointments (MariaDB) ---
    const sql = `
      INSERT INTO ea_appointments 
      (id_users_provider, book_datetime, start_datetime, end_datetime, location, direccion_link, notes, notas_estructuradas, hash)
      VALUES
      (?, NOW(), ?, ?, ?, ?, ?, ?, ?);
    `;
    
    // E!A necesita un 'hash' para funcionar, generamos uno simple.
    const hash = randomUUID(); 

    const values = [
      tecnico_id,
      start_datetime_utc,
      end_datetime_utc,
      direccion_legible,
      link_gmaps,
      notas_adicionales,
      notas_estructuradas,
      hash
    ];
    
    await eaPool.query(sql, values);

    // --- ¡ÉXITO! ---
    res.status(201).json({ 
      message: 'Cita y Caso creados exitosamente.', 
      nuevoCaso: nuevoCaso 
    });

  } catch (error) {
    console.error('Error al crear cita (flujo fusionado):', error);
    // (PENDIENTE: Si falla E!A, deberíamos borrar el caso de Supabase -> "rollback")
    res.status(500).json({ message: error.message });
  }
});

export default router;
