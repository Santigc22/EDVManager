"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./page.module.css";
import { FaPlusCircle, FaRegEdit } from "react-icons/fa";

export default function UnidadesMedidaPage() {
    const router = useRouter();
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("ver_unidades_medida")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch("https://edvmanager.onrender.com/unidadesMedida", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUnidades(data.unidades_medida || []))
        .finally(() => setLoading(false));
    }, [router]);
  
    if (loading) {
      return (
        <>
          <Header />
          <div className={styles.pageContainer}>
            <Sidebar />
            <main className={styles.mainContent}>
              Cargando…
            </main>
          </div>
        </>
      );
    }
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.titleBar}>
              <h1>Unidades de Medida</h1>
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/unidadesMedida/crear")}
              >
                <FaPlusCircle style={{ marginRight: "6px" }} />
                Registrar unidad
              </button>
            </div>
  
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Abreviatura</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>{u.abreviatura}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        title="Editar"
                        onClick={() => router.push(`/unidadesMedida/editar/${u.id}`)}
                      >
                        <FaRegEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
        </div>
      </>
    );
  }
