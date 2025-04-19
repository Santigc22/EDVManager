"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import styles from "./permisos.module.css"

const PermisosPage = () => {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (!decoded.permisos || !decoded.permisos.includes("ver_permisos")) {
        router.push("/login");
        return;
      }
    } catch (err) {
      console.error("Token inválido:", err);
      router.push("/login");
      return;
    }

    const fetchPermisos = async () => {
      try {
        const response = await fetch("http://localhost:5000/permisos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron obtener los permisos");
        }

        const data = await response.json();
        setPermisos(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermisos();
  }, [router]);

  return (
    <>
      <Header />

      <div className={styles.pageWrapper}>
        <Sidebar />

        <main className={styles.permisosMainContent}>
          <h1>Gestión de Permisos</h1>

          {loading ? (
            <p>Cargando permisos...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <table className={styles.permisosTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {permisos.map((permiso) => (
                  <tr key={permiso.id}>
                    <td>{permiso.id}</td>
                    <td>{permiso.nombre}</td>
                    <td>{permiso.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </>
  );
};

export default PermisosPage;