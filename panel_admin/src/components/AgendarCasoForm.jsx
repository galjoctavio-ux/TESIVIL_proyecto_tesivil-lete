import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import api from '../apiService';
import './AgendarCasoForm.css'; // --- NUEVO: Añadiremos estilos

// --- NUEVO: Cargar clave de API y definir librerías ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries = ["places"];

// --- NUEVO: Helper para el visualizador de disponibilidad ---
const generarBloquesVisibles = (horariosOcupados, horaInicio = 8, horaFin = 18) => {
  const bloques = [];
  
  // Función para convertir "HH:MM" a un número (ej: 9.5 para 09:30)
  const aNumero = (horaStr) => {
    const [h, m] = horaStr.split(':').map(Number);
    return h + (m / 60);
  };
  
  const ocupados = horariosOcupados.map(h => ({
    inicio: aNumero(h.inicio),
    fin: aNumero(h.fin)
  }));

  for (let i = horaInicio; i < horaFin; i++) {
    const bloqueInicio = i;
    const bloqueFin = i + 1;
    let estaOcupado = false;

    // Comprobar si este bloque [i] a [i+1] se solapa con algún horario ocupado
    for (const ocup of ocupados) {
      // Lógica de solapamiento: (InicioA < FinB) y (FinA > InicioB)
      if (bloqueInicio < ocup.fin && bloqueFin > ocup.inicio) {
        estaOcupado = true;
        break;
      }
    }
    
    bloques.push({
      hora: `${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`,
      ocupado: estaOcupado
    });
  }
  return bloques;
};

// --- COMPONENTE PRINCIPAL MODIFICADO ---
function AgendarCasoForm({ onClose, onCitaCreada }) {
  // --- MODIFICADO: Estado "fusionado" para el formulario de 1 paso ---
  const [formData, setFormData] = useState({
    // Paso 1: Disponibilidad
    tecnico_id: '',
    fecha: '',
    // Paso 2: Datos Cliente/Caso
    cliente_nombre: '',
    cliente_telefono: '',
    tipo_caso: 'alto_consumo', // Valor por defecto
    // Paso 3: Dirección
    direccion_legible: '',
    link_gmaps: '',
    // Paso 4: Cita
    hora: '',
    duracion_horas: '1',
    notas_adicionales: ''
  });

  const [tecnicos, setTecnicos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Para el submit final
  
  // --- NUEVO: Estados para la disponibilidad ---
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);

  // --- NUEVO: Referencias para Google Maps ---
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  // --- EFECTO 1: Cargar técnicos (Sin cambios) ---
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

  // --- EFECTO 2: Cargar Disponibilidad (¡NUEVA LÓGICA!) ---
  useEffect(() => {
    // Solo se ejecuta si tenemos AMBOS datos
    if (formData.tecnico_id && formData.fecha) {
      const fetchDisponibilidad = async () => {
        setLoadingDisponibilidad(true);
        setError('');
        try {
          // Llama a nuestra NUEVA ruta del backend
          const response = await api.get('/citas/disponibilidad', {
            params: {
              tecnico_id: formData.tecnico_id,
              fecha: formData.fecha
            }
          });
          setHorariosOcupados(response.data);
        } catch (err) {
          setError('Error al cargar la disponibilidad.');
          setHorariosOcupados([]); // Limpiar en caso de error
        } finally {
          setLoadingDisponibilidad(false);
        }
      };
      fetchDisponibilidad();
    } else {
      setHorariosOcupados([]); // Limpiar si no hay técnico o fecha
    }
  }, [formData.tecnico_id, formData.fecha]); // Se re-ejecuta si cambia el técnico o la fecha

  // --- NUEVO: Generar los bloques visuales ---
  const bloquesVisibles = useMemo(() => {
    if (horariosOcupados.length === 0 && !loadingDisponibilidad) return [];
    return generarBloquesVisibles(horariosOcupados);
  }, [horariosOcupados, loadingDisponibilidad]);

  // --- Handler Genérico (Sin cambios) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- NUEVO: Handlers para Google Maps ---
  const onAutocompleteLoad = (autocompleteInstance) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address && place.url) {
        setFormData((prev) => ({
          ...prev,
          direccion_legible: place.formatted_address,
          link_gmaps: place.url
        }));
        setError(''); // Limpiar error si había
      }
    }
  };

  // --- MODIFICADO: handleSubmit (¡NUEVA LÓGICA!) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validación más completa
    if (!formData.tecnico_id || !formData.fecha || !formData.hora || 
        !formData.link_gmaps || !formData.cliente_nombre || !formData.tipo_caso) {
      setError('Por favor, complete todos los campos requeridos (Técnico, Fecha, Hora, Dirección y Nombre de Cliente).');
      return;
    }
    
    // (Quitamos la lógica de 'hayConflicto', ahora es visual)
    
    setLoading(true);
    try {
      // ¡Llamamos a nuestra ruta "fusionada" con el payload completo!
      await api.post('/citas', formData);
      
      onCitaCreada(); // Llama a la función del padre (para refrescar la lista de casos)
      onClose();      // Cierra el modal
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar la cita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // --- NUEVO: Envoltorio LoadScript para Google Maps ---
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <form className="agendar-caso-form" onSubmit={handleSubmit} noValidate>
        <h3>Crear y Agendar Nuevo Caso</h3>

        {/* --- PASO 1: DISPONIBILIDAD (Tu ajuste) --- */}
        <h4>Paso 1: Ver Disponibilidad</h4>
        <div className="form-paso">
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
        </div>

        {/* --- NUEVO: Visualizador de Disponibilidad (Opción B) --- */}
        {loadingDisponibilidad && <p>Cargando disponibilidad...</p>}
        {bloquesVisibles.length > 0 && (
          <div className="disponibilidad-visual">
            <strong>Disponibilidad para el día:</strong>
            <ul>
              {bloquesVisibles.map((bloque) => (
                <li key={bloque.hora} className={bloque.ocupado ? 'ocupado' : 'libre'}>
                  {bloque.hora}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* --- PASO 2: DATOS DEL CASO --- */}
        <h4>Paso 2: Datos del Caso y Cliente</h4>
        <div className="form-paso">
          <div>
            <label htmlFor="cliente_nombre">Nombre del Cliente</label>
            <input type="text" id="cliente_nombre" name="cliente_nombre" value={formData.cliente_nombre} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="cliente_telefono">Teléfono del Cliente</label>
            <input type="tel" id="cliente_telefono" name="cliente_telefono" value={formData.cliente_telefono} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="tipo_caso">Tipo de Caso</label>
            <select id="tipo_caso" name="tipo_caso" value={formData.tipo_caso} onChange={handleChange} required>
              <option value="alto_consumo">Alto Consumo</option>
              <option value="revision_general">Revisión General</option>
              <option value="reparacion">Reparación</option>
              <option value="proyecto">Proyecto</option>
            </select>
          </div>
        </div>
        
        {/* --- PASO 3: DIRECCIÓN --- */}
        <h4>Paso 3: Dirección</h4>
        <div className="form-paso">
          <label htmlFor="direccion">Dirección del Cliente (Buscar en Google)</label>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              id="direccion"
              placeholder="Escribe la dirección y selecciónala..."
              ref={inputRef}
              required
              style={{ width: '100%' }} // Google a veces sobreescribe el CSS
            />
          </Autocomplete>
          {formData.link_gmaps && <small style={{ color: 'green' }}>✓ Dirección seleccionada</small>}
        </div>

        {/* --- PASO 4: AGENDAR --- */}
        <h4>Paso 4: Confirmar Cita</h4>
        <div className="form-paso-inline">
          <div>
            <label htmlFor="hora">Hora de Inicio (ej: 14:30)</label>
            <input type="time" id="hora" name="hora" value={formData.hora} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="duracion_horas">Duración</label>
            <select id="duracion_horas" name="duracion_horas" value={formData.duracion_horas} onChange={handleChange}>
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
              <option value="3">3 horas</option>
            </select>
          </div>
        </div>
        <div className="form-paso">
          <label htmlFor="notas_adicionales">Notas Adicionales (Técnico)</label>
          <textarea id="notas_adicionales" name="notas_adicionales" value={formData.notas_adicionales} onChange={handleChange} />
        </div>

        {/* --- BOTONES Y ERRORES --- */}
        {error && <p className="error-msg">{error}</p>}
        <div className="form-botones">
          <button type="button" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear y Agendar Cita'}
          </button>
        </div>
      </form>
    </LoadScript>
  );
}

export default AgendarCasoForm;
