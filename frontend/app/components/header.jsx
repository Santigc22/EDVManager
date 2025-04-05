"use client";
import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "./headerBar.module.css";
import Link from "next/link";

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);

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
    </div>
  );
};

export default Header;