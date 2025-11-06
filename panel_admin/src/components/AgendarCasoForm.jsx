import React, { useState, useEffect } from 'react';
import api from '../apiService';

function AgendarCasoForm({ caso, onClose, onCitaCreada }) {
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    duracion: '1',
  });
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch existing appointments to check for conflicts
    const fetchCitas = async () => {
      try {
        const response = await api.get(`/citas?tecnico_id=${caso.tecnico_id}`);
        setCitasExistentes(response.data);
      } catch (err) {
        setError('Error al cargar las citas existentes.');
      }
    };
    fetchCitas();
  }, [caso.tecnico_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nuevaCitaInicio = new Date(`${formData.fecha}T${formData.hora}`);
    const nuevaCitaFin = new Date(nuevaCitaInicio.getTime() + formData.duracion * 60 * 60 * 1000);

    const hayConflicto = citasExistentes.some(cita => {
      const citaExistenteInicio = new Date(`${cita.fecha}T${cita.hora}`);
      const citaExistenteFin = new Date(citaExistenteInicio.getTime() + cita.duracion * 60 * 60 * 1000);
      return (nuevaCitaInicio < citaExistenteFin && nuevaCitaFin > citaExistenteInicio);
    });

    if (hayConflicto) {
      setError('Conflicto de horario: El técnico ya tiene una cita en este horario.');
      return;
    }

    try {
      await api.post('/citas', { ...formData, caso_id: caso.id, tecnico_id: caso.tecnico_id });
      onCitaCreada();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Agendar Cita para Caso #{caso.id}</h3>
      <p>Técnico: {caso.tecnico_nombre}</p>
      <div>
        <label htmlFor="fecha">Fecha</label>
        <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="hora">Hora</label>
        <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="duracion">Duración (horas)</label>
        <select id="duracion" name="duracion" value={formData.duracion} onChange={handleChange}>
          <option value="1">1 hora</option>
          <option value="2">2 horas</option>
          <option value="3">3 horas</option>
        </select>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Agendar Cita</button>
      <button type="button" onClick={onClose}>Cancelar</button>
    </form>
  );
}

export default AgendarCasoForm;
