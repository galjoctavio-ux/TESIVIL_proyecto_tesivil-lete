import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CasosList from '../components/CasosList';
import Modal from '../components/Modal';
import CrearCasoForm from '../components/CrearCasoForm';

// ¡NUEVO! Importar componentes de técnico
import TecnicosList from '../components/TecnicosList';
import CrearTecnicoForm from '../components/CrearTecnicoForm';
import AgendarCasoForm from '../components/AgendarCasoForm';

const cardStyles = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  padding: '24px',
  marginBottom: '24px',
  transition: 'all 0.3s ease',
};

const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '1px solid #E2E8F0',
};

const mainButtonStyles = {
  backgroundColor: '#10213F',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '12px 20px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.2s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const secondaryButtonStyles = {
  backgroundColor: '#F1F5F9',
  color: '#1E293B',
  border: '1px solid #E2E8F0',
  borderRadius: '6px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.2s ease',
};

function Dashboard() {
  const { user, logout } = useAuth();

  const [isCasoModalOpen, setIsCasoModalOpen] = useState(false);
  const [isTecnicoModalOpen, setIsTecnicoModalOpen] = useState(false);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [refreshCasosKey, setRefreshCasosKey] = useState(0);
  const [refreshTecnicosKey, setRefreshTecnicosKey] = useState(0);

  const handleCasoActualizado = () => setRefreshCasosKey(prev => prev + 1);
  const handleTecnicoActualizado = () => setRefreshTecnicosKey(prev => prev + 1);

  const openAgendarModal = (caso) => {
    setSelectedCaso(caso);
    setIsAgendarModalOpen(true);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '32px' }}>
      <header style={headerStyles}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B' }}>Dashboard de Administración</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#475569', marginRight: '24px' }}>
            ¡Bienvenido, <strong>{user?.nombre || 'Admin'}</strong>!
          </span>
          <button
            onClick={logout}
            style={secondaryButtonStyles}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main>
        {/* --- SECCIÓN CASOS --- */}
        <div style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1E293B' }}>Gestión de Casos</h2>
            <button
              onClick={() => setIsCasoModalOpen(true)}
              style={mainButtonStyles}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#1E293B'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10213F'}
            >
              + Crear Nuevo Caso
            </button>
          </div>
          <CasosList
            key={refreshCasosKey}
            onDatosActualizados={handleCasoActualizado}
            onAgendarClick={openAgendarModal}
          />
        </div>

        {/* --- SECCIÓN TÉCNICOS --- */}
        <div style={cardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1E293B' }}>Gestión de Técnicos</h2>
            <button
              onClick={() => setIsTecnicoModalOpen(true)}
              style={mainButtonStyles}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#1E293B'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10213F'}
            >
              + Crear Nuevo Técnico
            </button>
          </div>
          <TecnicosList key={refreshTecnicosKey} onTecnicoActualizado={handleTecnicoActualizado} />
        </div>
      </main>

      {/* --- MODALES --- */}
      <Modal isOpen={isCasoModalOpen} onClose={() => setIsCasoModalOpen(false)}>
        <CrearCasoForm onClose={() => setIsCasoModalOpen(false)} onCasoCreado={handleCasoActualizado} />
      </Modal>

      <Modal isOpen={isTecnicoModalOpen} onClose={() => setIsTecnicoModalOpen(false)}>
        <CrearTecnicoForm onClose={() => setIsTecnicoModalOpen(false)} onTecnicoCreado={handleTecnicoActualizado} />
      </Modal>

      {selectedCaso && (
        <Modal isOpen={isAgendarModalOpen} onClose={() => setIsAgendarModalOpen(false)}>
          <AgendarCasoForm caso={selectedCaso} onClose={() => setIsAgendarModalOpen(false)} onCitaCreada={handleCasoActualizado} />
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
