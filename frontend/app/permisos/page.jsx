import Sidebar from "../components/Sidebar";
import Header from "../components/header";

const PermisosPage = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Header />
        <div className="main-content">
          <h1>Gestión de Permisos</h1>
          <p>Aquí se mostrarán y gestionarán los permisos.</p>
        </div>
      </div>
    </div>
  );
};

export default PermisosPage;