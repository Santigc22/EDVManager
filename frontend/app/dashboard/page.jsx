"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import styles from "./dashboard.module.css";
import { FaUserCircle } from "react-icons/fa";
import Link from "next/link";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    const permisosUsuario = ["ver_roles", "ver_usuarios", "ver_permisos"];
  
    useEffect(() => {
      const token = localStorage.getItem("token");
  
      if (!token) {
        router.push("/login");
        return;
      }
  
      try {
        const decoded = jwtDecode(token);
        console.log("Token decodificado:", decoded);
  
        if (!decoded.permisos || !decoded.permisos.includes("ver_dashboard")) {
          alert("No tienes permisos para acceder a esta sección.");
          router.push("/login");
          return;
        }
  
        setUser(decoded);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        router.push("/login");
      }
    }, [router]);
  
    if (!user) {
      return <p>Cargando...</p>;
    }
  
    return (
      <div>
        <header className={styles.header}>
          <img src="https://i.ibb.co/tPTQn9TB/Captura-1.png" alt="Logo" className={styles.logo} />
  
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.button}>Dashboard</Link>
            <button className={styles.button}>Ayuda</button>
  
            <div className={styles.userMenu}>
              <FaUserCircle className={styles.userIcon} onClick={() => setMenuOpen(!menuOpen)} />
              {menuOpen && (
                <ul className={styles.dropdownMenu}>
                  <li>Perfil</li>
                  <li>Cerrar sesión</li>
                </ul>
              )}
            </div>
          </nav>
        </header>
  
        <div className={styles.content}>
          <h1>Bienvenido(a), {user.username}</h1>
        </div>
        <div style={{ display: "flex" }}>
      <Sidebar permisos={permisosUsuario} />
      <main style={{ flex: 1, padding: "20px" }}></main>
    </div>
      </div>
    );
    
  }
