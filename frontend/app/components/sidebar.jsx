import { useState } from "react";
import { FaBars, FaUserLock, FaUsers, FaUserShield } from "react-icons/fa";
import styles from "./Sidebar.module.css";

const Sidebar = ({ permisos }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modulos = [
    { id: "ver_permisos", nombre: "Permisos", icono: <FaUserLock /> },
    { id: "ver_roles", nombre: "Roles", icono: <FaUserShield /> },
    { id: "ver_usuarios", nombre: "Usuarios", icono: <FaUsers /> },
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        <FaBars />
      </button>

      <ul className={styles.menu}>
        {modulos.map((modulo) =>
          permisos.includes(modulo.id) ? (
            <li key={modulo.id} className={styles.menuItem}>
              {modulo.icono} {isOpen && <span>{modulo.nombre}</span>}
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
};

export default Sidebar;