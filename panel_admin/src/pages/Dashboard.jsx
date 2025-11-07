import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CasosList from '../components/CasosList';
import Modal from '../components/Modal';
import CrearCasoForm from '../components/CrearCasoForm';
import TecnicosList from '../components/TecnicosList';
import CrearTecnicoForm from '../components/CrearTecnicoForm';
import AgendarCasoForm from '../components/AgendarCasoForm';

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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard de Administración</h1>
        <div className="header-user-info">
          <span>
            ¡Bienvenido, <strong>{user?.nombre || 'Admin'}</strong>!
          </span>
          <button
            onClick={logout}
            className="secondary-button"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main>
        <div className="card">
          <div className="card-header">
            <h2>Gestión de Casos</h2>
            <button
              onClick={() => setIsCasoModalOpen(true)}
              className="main-button"
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

        <div className="card">
          <div className="card-header">
            <h2>Gestión de Técnicos</h2>
            <button
              onClick={() => setIsTecnicoModalOpen(true)}
              className="main-button"
            >
              + Crear Nuevo Técnico
            </button>
          </div>
          <TecnicosList key={refreshTecnicosKey} onTecnicoActualizado={handleTecnicoActualizado} />
        </div>
      </main>

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
