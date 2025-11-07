import express from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { authmiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /citas?tecnico_id=...
router.get('/', authMiddleware, async (req, res) => {
  const { tecnico_id } = req.query;
  if (!tecnico_id) {
    return res.status(400).json({ message: 'El ID del técnico es requerido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('tecnico_id', tecnico_id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las citas.', error });
  }
});

// POST /citas
router.post('/', authMiddleware, async (req, res) => {
  const { caso_id, tecnico_id, fecha, hora, duracion } = req.body;

  if (!caso_id || !tecnico_id || !fecha || !hora || !duracion) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    // Basic conflict detection (can be improved in the service)
    const { data: existingCitas, error: fetchError } = await supabaseAdmin
      .from('citas')
      .select('*')
      .eq('tecnico_id', tecnico_id)
      .eq('fecha', fecha);

    if (fetchError) throw fetchError;

    const nuevaCitaInicio = new Date(`${fecha}T${hora}`);
    const nuevaCitaFin = new Date(nuevaCitaInicio.getTime() + duracion * 60 * 60 * 1000);

    const hayConflicto = existingCitas.some(cita => {
      const citaExistenteInicio = new Date(`${cita.fecha}T${cita.hora}`);
      const citaExistenteFin = new Date(citaExistenteInicio.getTime() + cita.duracion * 60 * 60 * 1000);
      return (nuevaCitaInicio < citaExistenteFin && nuevaCitaFin > citaExistenteInicio);
    });

    if (hayConflicto) {
      return res.status(409).json({ message: 'Conflicto de horario: El técnico ya tiene una cita en este horario.' });
    }

    const { data, error } = await supabaseAdmin
      .from('citas')
      .insert([{ caso_id, tecnico_id, fecha, hora, duracion }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la cita.', error });
  }
});

export default router;
