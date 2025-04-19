"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./bodegas.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const BodegasPage = () => {
    const router = useRouter();
    const [bodegas, setBodegas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nombreFiltro, setNombreFiltro] = useState("");
    const [buscar, setBuscar] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [resultadosPorPagina, setResultadosPorPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      let decoded;
      try {
        decoded = jwtDecode(token);
        if (!decoded.permisos?.includes("ver_bodegas")) {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
  
      const fetchBodegas = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.append("pagina", pagina);
          params.append("resultados_por_pagina", resultadosPorPagina);
          if (nombreFiltro.trim() !== "") {
            params.append("nombre", nombreFiltro);
          }
  
          const res = await fetch(`http://localhost:5000/bodegas?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          if (!res.ok) throw new Error("Error al obtener bodegas");
  
          const data = await res.json();
          setBodegas(data.bodegas || []);
          setTotalPaginas(data.total_paginas || 1);
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchBodegas();
    }, [pagina, resultadosPorPagina, nombreFiltro, router]);
  
    const handleBuscar = () => {
      setPagina(1);
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <h1>Gestión de bodegas</h1>
  
            <div className={styles.filtroContainer}>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={nombreFiltro}
                onChange={(e) => setNombreFiltro(e.target.value)}
                className={styles.inputFiltro}
              />
              <button onClick={handleBuscar} className={styles.botonBuscar}>
                Buscar
              </button>
            </div>
  
            <div className={styles.selectorResultados}>
              <label>Resultados por página:</label>
              <select
                value={resultadosPorPagina}
                onChange={(e) => {
                  setResultadosPorPagina(Number(e.target.value));
                  setPagina(1);
                }}
              >
                {[5, 10, 20, 25].map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
  
            {loading ? (
              <p>Cargando bodegas...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <>
                <table className={styles.bodegasTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodegas.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>{b.nombre}</td>
                        <td>{b.direccion}</td>
                        <td>{b.estado ? "Activo" : "Inactivo"}</td>
                        <td>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
  
                <div className={styles.paginacion}>
                  <button
                    onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                    disabled={pagina === 1}
                  >
                    Anterior
                  </button>
  
                  <span>Página {pagina} de {totalPaginas}</span>
  
                  <button
                    onClick={() => setPagina((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={pagina === totalPaginas}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </>
    );
  }

export default BodegasPage;