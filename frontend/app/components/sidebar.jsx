"use client";
import { useState, useEffect } from "react";
import {
  FaBars,
  FaUserLock,
  FaUsers,
  FaUserShield,
  FaWarehouse,
  FaUserTie,
  FaCube,
  FaShoppingCart,
  FaTruck,
  FaRuler,
  FaChartBar,
} from "react-icons/fa";
import { MdShuffle } from "react-icons/md";
import styles from "./sidebar.module.css";
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
    {
      id: "ver_permisos",
      nombre: "Permisos",
      icono: <FaUserLock />,
      route: "/permisos",
    },
    {
      id: "ver_roles",
      nombre: "Roles",
      icono: <FaUserShield />,
      route: "/roles",
    },
    {
      id: "ver_usuarios",
      nombre: "Usuarios",
      icono: <FaUsers />,
      route: "/usuarios",
    },
    {
      id: "ver_bodegas",
      nombre: "Bodegas",
      icono: <FaWarehouse />,
      route: "/bodegas",
    },
    {
      id: "ver_clientes",
      nombre: "Clientes",
      icono: <FaUserTie />,
      route: "/clientes",
    },
    {
      id: "ver_materiales",
      nombre: "Materiales",
      icono: <FaCube />,
      route: "/materiales",
    },
    {
      id: "ver_proveedores",
      nombre: "Proveedores",
      icono: <FaTruck />,
      route: "/proveedores",
    },
    {
      id: "ver_unidades_medida",
      nombre: "Unidades Medida",
      icono: <FaRuler />,
      route: "/unidadesMedida",
    },
    {
      id: "ver_ordenes",
      nombre: "Ordenes Compra",
      icono: <FaShoppingCart />,
      route: "/ordenesCompra",  
    },
    {
      id: "ver_movimientos",
      nombre: "Movimientos",
      icono: <MdShuffle />,
      route: "/movimientos",
    },
    {
      id: "generar_reportes",
      nombre: "Reportes",
      icono: <FaChartBar />,
      route: "/reportes"
    }
  ];

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        <FaBars />
      </button>

      <ul>
        {modulos
          .filter((modulo) => permisosUsuario.includes(modulo.id))
          .map((modulo, index) => (
            <li key={index} className={styles.menuItem}>
              <Link href={modulo.route} legacyBehavior>
                <a className={styles.linkContent}>
                  {modulo.icono}{" "}
                  {isOpen && (
                    <span className={styles.linkText}>{modulo.nombre}</span>
                  )}
                </a>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Sidebar;
