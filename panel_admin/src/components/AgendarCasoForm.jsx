import React, { useState, useEffect } from 'react';
import api from '../apiService';

function AgendarCasoForm({ caso, onClose, onCitaCreada }) {
  const [formData, setFormData] = useState({
    tecnico_id: '',
    fecha: '',
    hora: '',
    duracion: '1',
  });
  const [tecnicos, setTecnicos] = useState([]);
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTecnicos = async () => {
      try {
        const response = await api.get('/tecnicos');
        setTecnicos(response.data);
      } catch (err) {
        setError('Error al cargar la lista de técnicos.');
      }
    };
    fetchTecnicos();
  }, []);

  useEffect(() => {
    if (formData.tecnico_id) {
      const fetchCitas = async () => {
        try {
          const response = await api.get(`/citas?tecnico_id=${formData.tecnico_id}`);
          setCitasExistentes(response.data);
        } catch (err) {
          setError('Error al cargar las citas existentes.');
        }
      };
      fetchCitas();
    } else {
      setCitasExistentes([]);
    }
  }, [formData.tecnico_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.tecnico_id || !formData.fecha || !formData.hora) {
      setError('Todos los campos son requeridos.');
      return;
    }

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
      await api.post('/citas', { ...formData, caso_id: caso.id });
      onCitaCreada();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3>Agendar Cita para Caso #{caso.id}</h3>
      <div>
        <label htmlFor="tecnico_id">Técnico</label>
        <select id="tecnico_id" name="tecnico_id" value={formData.tecnico_id} onChange={handleChange} required>
          <option value="">Seleccione un técnico</option>
          {tecnicos.map((tecnico) => (
            <option key={tecnico.id} value={tecnico.id}>
              {tecnico.nombre}
            </option>
          ))}
        </select>
      </div>
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
