"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./movimientos.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MovimientosPage() {
    const router = useRouter();
  
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [fechaFiltro, setFechaFiltro] = useState("");
    const [usuarioFiltro, setUsuarioFiltro] = useState("");
  
    const [pagina, setPagina] = useState(1);
    const [resultadosPorPagina, setResultadosPorPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
  
    const [permisosUsuario, setPermisosUsuario] = useState([]);
  
    const fetchMovimientos = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("pagina", pagina);
        params.append("resultados_por_pagina", resultadosPorPagina);
        if (tipoFiltro) params.append("tipo", tipoFiltro);
        if (fechaFiltro) params.append("fecha", fechaFiltro);
        if (usuarioFiltro) params.append("usuario", usuarioFiltro);
  
        const res = await fetch(`http://localhost:5000/movimientos?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al obtener movimientos");
  
        const data = await res.json();
        setMovimientos(data.movimientos || []);
        setTotalPaginas(data.total_paginas || 1);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      let decoded;
      try {
        decoded = jwtDecode(token);
        setPermisosUsuario(decoded.permisos || []);
        if (!decoded.permisos.includes("ver_movimientos")) {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
  
      fetchMovimientos();
    }, [router, pagina, resultadosPorPagina, tipoFiltro, fechaFiltro, usuarioFiltro]);
  
    const handleBuscar = (e) => {
      e.preventDefault();
      setPagina(1);
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <h1 className={styles.title}>Movimientos</h1>
  
            <form className={styles.filtroForm} onSubmit={handleBuscar}>
              <input
                type="text"
                placeholder="Filtrar por tipo"
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value)}
              />
              <input
                type="date"
                placeholder="Filtrar por fecha"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
              />
              <input
                type="text"
                placeholder="Filtrar por usuario"
                value={usuarioFiltro}
                onChange={e => setUsuarioFiltro(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
  
            <div className={styles.selectorResultados}>
              <label>Resultados por página:</label>
              <select
                value={resultadosPorPagina}
                onChange={e => { setResultadosPorPagina(Number(e.target.value)); setPagina(1); }}
              >
                {[5, 10, 20, 25].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
  
            {loading ? (
              <p>Cargando movimientos…</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <>
                <table className={styles.movimientosTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Fecha y hora</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(m => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.tipo}</td>
                        <td>{new Date(m.fecha_hora).toLocaleString()}</td>
                        <td>{m.usuario_nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
  
                <div className={styles.paginacion}>
                  <button
                    onClick={() => setPagina(p => Math.max(p - 1, 1))}
                    disabled={pagina === 1}
                  >
                    ← Anterior
                  </button>
                  <span>Página {pagina} de {totalPaginas}</span>
                  <button
                    onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))}
                    disabled={pagina === totalPaginas}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </>
    );
  }
