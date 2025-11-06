import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CasosList from '../components/CasosList';
import Modal from '../components/Modal';
import CrearCasoForm from '../components/CrearCasoForm';

// ¡NUEVO! Importar componentes de técnico
import TecnicosList from '../components/TecnicosList';
import CrearTecnicoForm from '../components/CrearTecnicoForm';
import AgendarCasoForm from '../components/AgendarCasoForm';

function Dashboard() {
  const { user, logout } = useAuth();

  // Estado para los modales
  const [isCasoModalOpen, setIsCasoModalOpen] = useState(false);
  const [isTecnicoModalOpen, setIsTecnicoModalOpen] = useState(false);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState(null);

  // Estado para refrescar las listas
  const [refreshCasosKey, setRefreshCasosKey] = useState(0);
  const [refreshTecnicosKey, setRefreshTecnicosKey] = useState(0); 

  // Funciones de refresco
  const handleCasoActualizado = () => {
    setRefreshCasosKey(oldKey => oldKey + 1);
  };
  const handleTecnicoActualizado = () => {
    setRefreshTecnicosKey(oldKey => oldKey + 1);
  };

  const openAgendarModal = (caso) => {
    setSelectedCaso(caso);
    setIsAgendarModalOpen(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard de Admin</h2>
        <div>
          <span>¡Bienvenido, {user?.nombre || 'Admin'}!</span>
          <button onClick={logout} style={{ marginLeft: '15px' }}>Cerrar Sesión</button>
        </div>
      </header>

      <hr />

      {/* --- SECCIÓN CASOS --- */}
      <button onClick={() => setIsCasoModalOpen(true)}>
        + Crear Nuevo Caso
      </button>
      <CasosList key={refreshCasosKey} onDatosActualizados={handleCasoActualizado} onAgendarClick={openAgendarModal} />

      {/* --- SECCIÓN TÉCNICOS (¡NUEVO!) --- */}
      <div style={{marginTop: '20px'}}>
        <button onClick={() => setIsTecnicoModalOpen(true)}>
          + Crear Nuevo Técnico
        </button>
        <TecnicosList key={refreshTecnicosKey} />
      </div>

      {/* --- MODALES (Ocultos) --- */}
      <Modal isOpen={isCasoModalOpen} onClose={() => setIsCasoModalOpen(false)}>
        <CrearCasoForm 
          onClose={() => setIsCasoModalOpen(false)}
          onCasoCreado={handleCasoActualizado}
        />
      </Modal>

      <Modal isOpen={isTecnicoModalOpen} onClose={() => setIsTecnicoModalOpen(false)}>
        <CrearTecnicoForm
          onClose={() => setIsTecnicoModalOpen(false)}
          onTecnicoCreado={handleTecnicoActualizado}
        />
      </Modal>

      {selectedCaso && (
        <Modal isOpen={isAgendarModalOpen} onClose={() => setIsAgendarModalOpen(false)}>
          <AgendarCasoForm
            caso={selectedCaso}
            onClose={() => setIsAgendarModalOpen(false)}
            onCitaCreada={handleCasoActualizado}
          />
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
