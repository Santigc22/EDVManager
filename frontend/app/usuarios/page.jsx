"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "./usuarios.module.css";

const UsuariosPage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos || !decoded.permisos.includes("ver_usuarios")) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Token inválido:", error);
      router.push("/login");
    }
  }, [router]);

  return (
    <>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar />
        <main className={styles.usuariosMainContent}>
          <h1>Gestión de Usuarios</h1>
          <p>Aquí se mostrará el listado de usuarios.</p>
        </main>
      </div>
    </>
  );
};

export default UsuariosPage;