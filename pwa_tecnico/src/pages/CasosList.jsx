import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../apiService';
// 1. Importar Link
import { Link } from 'react-router-dom';

const listStyle = {
  backgroundColor: '#F8FAFC',
  minHeight: '100vh',
  padding: '32px'
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  padding: '24px',
  marginBottom: '20px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '1px solid #E2E8F0',
};

const actionButtonStyles = {
  border: 'none',
  borderRadius: '6px',
  padding: '10px 18px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.2s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center',
};

function CasosList() {
  const { user, logout } = useAuth();
  const [casos, setCasos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    const fetchCasos = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/casos');
        setCasos(response.data);
      } catch (err) {
        setError('Error al cargar casos asignados.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCasos();
  }, []);

  const filteredCasos = casos.filter(caso => showCompleted || caso.status !== 'completado');

  return (
    <div style={listStyle}>
      <header style={headerStyles}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1E293B' }}>Mis Casos Asignados</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '20px', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
              style={{ marginRight: '8px' }}
            />
            Mostrar Completados
          </label>
          <span style={{ color: '#475569', marginRight: '20px' }}>
            Técnico: <strong>{user?.nombre}</strong>
          </span>
          <button onClick={logout} style={{ ...actionButtonStyles, backgroundColor: '#F1F5F9', color: '#1E293B' }}>
            Salir
          </button>
        </div>
      </header>

      {isLoading && <p>Cargando casos...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isLoading && !error && (
        <div>
          {filteredCasos.length === 0 ? (
            <div style={cardStyle}><p>No hay casos que coincidan con el filtro.</p></div>
          ) : (
            filteredCasos.map(caso => (
              <div key={caso.id} style={cardStyle}>
                <h3 style={{ fontSize: '20px', color: '#10213F', marginBottom: '12px' }}>
                  Cliente: {caso.cliente_nombre}
                </h3>
                <p style={{ color: '#475569', marginBottom: '8px' }}>
                  <strong>Dirección:</strong> {caso.cliente_direccion}
                </p>
                <p style={{ color: '#475569', marginBottom: '20px' }}>
                  <strong>Estado:</strong> <span style={{ fontWeight: '600', color: caso.status === 'completado' ? '#16A34A' : '#F59E0B' }}>
                    {caso.status}
                  </span>
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(caso.cliente_direccion)}`, "_blank")}
                    style={{...actionButtonStyles, backgroundColor: '#3B82F6', color: 'white'}}
                  >
                    Navegar a Dirección
                  </button>
                  <Link to={`/revision/${caso.id}`} style={{ textDecoration: 'none' }}>
                    <button
                      style={{
                        ...actionButtonStyles,
                        backgroundColor: caso.status === 'completado' ? '#D1D5DB' : '#10B981',
                        color: 'white'
                      }}
                      disabled={caso.status === 'completado'}
                    >
                      {caso.status === 'completado' ? 'Revisión Completada' : 'Iniciar Revisión'}
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CasosList;
