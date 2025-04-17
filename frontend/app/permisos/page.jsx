import Sidebar from "../components/Sidebar";
import Header from "../components/header";
import styles from "./permisos.module.css"

const PermisosPage = () => {
  return (
    <>
      <Header />

      <div className={styles.pageWrapper}>
        <Sidebar />

        <main className={styles.permisosMainContent}>
          <h1>Gestión de Permisos</h1>
          <p>Aquí se mostrarán y gestionarán los permisos.</p>
        </main>
      </div>
    </>
  );
};

export default PermisosPage;