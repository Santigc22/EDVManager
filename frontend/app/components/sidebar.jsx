"use client";
import { useState, useEffect } from "react";
import { FaBars, FaUserLock, FaUsers, FaUserShield } from "react-icons/fa";
import styles from "./Sidebar.module.css";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

const Sidebar = ({ permisos }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permisosUsuario, setPermisosUsuario] = useState([]);

  useEffect(() => {
    console.log("Ejecutando useEffect...");
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setPermisosUsuario(decoded.permisos || []);
        console.log("Permisos extraídos del token:", decoded.permisos);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    }
  }, []);

  const modulos = [
    { id: "ver_permisos", nombre: "Permisos", icono: <FaUserLock />, route: "/permisos" },
    { id: "ver_roles", nombre: "Roles", icono: <FaUserShield />, route: "/roles" },
    { id: "ver_usuarios", nombre: "Usuarios", icono: <FaUsers />, route: "/usuarios" },
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        <FaBars />
      </button>

      <ul>
      {modulos
          .filter((modulo) => permisosUsuario.includes(modulo.id))
          .map((modulo, index) => (
            <li key={index} className={styles.menuItem}>
              <Link href={modulo.route}>
                <span className={styles.linkContent}>
                  {modulo.icono} {isOpen && <span>{modulo.nombre}</span>}
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Sidebar;