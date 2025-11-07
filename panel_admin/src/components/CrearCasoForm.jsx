import React, { useState } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import api from '../apiService';

const libraries = ['places'];

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontWeight: 'bold',
  marginBottom: '5px',
  display: 'block',
}

function CrearCasoForm({ onClose, onCasoCreado }) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [error, setError] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      setDireccion(autocomplete.getPlace().formatted_address);
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/casos', {
        cliente_nombre: nombre,
        cliente_direccion: direccion,
        cliente_telefono: telefono,
        comentarios_iniciales: comentarios,
      });

      onCasoCreado();
      onClose();
    } catch (err) {
      setError('Error al crear el caso.');
      console.error(err);
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <form style={formStyle} onSubmit={handleSubmit}>
        <h3>Crear Nuevo Caso</h3>
        <div>
          <label style={labelStyle}>Nombre del Cliente:</label>
          <input style={inputStyle} type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Dirección:</label>
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input
              style={inputStyle}
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Escribe una dirección"
              required
            />
          </Autocomplete>
        </div>
        <div>
          <label style={labelStyle}>Teléfono:</label>
          <input style={inputStyle} type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Comentarios Iniciales:</label>
          <textarea style={inputStyle} value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Guardar Caso</button>
      </form>
    </LoadScript>
  );
}

export default CrearCasoForm;
