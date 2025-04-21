"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./materiales.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPlusCircle, FaRegEdit, FaSearch } from "react-icons/fa";

export default function MaterialesPage() {
    const router = useRouter();
  
    const [materiales, setMateriales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  
    const [nombreFiltro, setNombreFiltro] = useState("");
    const [codigoFiltro, setCodigoFiltro] = useState("");
    const [abreviaturaFiltro, setAbreviaturaFiltro] = useState("");
  
    const [pagina, setPagina] = useState(1);
    const [resultadosPorPagina, setResultadosPorPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
  
    const [permisosUsuario, setPermisosUsuario] = useState([]);
  
    const fetchMateriales = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("pagina", pagina);
        params.append("resultados_por_pagina", resultadosPorPagina);
        if (nombreFiltro) params.append("nombre", nombreFiltro);
        if (codigoFiltro) params.append("codigo", codigoFiltro);
        if (abreviaturaFiltro) params.append("abreviatura", abreviaturaFiltro);
  
        const res = await fetch(`http://localhost:5000/materiales?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!res.ok) throw new Error("Error al obtener materiales");
  
        const data = await res.json();
        setMateriales(data.materiales || []);
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
        if (!decoded.permisos.includes("ver_materiales")) {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
  
      fetchMateriales();
    }, [router, pagina, resultadosPorPagina, nombreFiltro, codigoFiltro, abreviaturaFiltro]);
  
    const handleBuscar = () => {
      setPagina(1);
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
  
          <main className={styles.mainContent}>
            <h1 className={styles.title}>Gestión de Materiales</h1>
  
            <form className={styles.filtroForm} onSubmit={e => { e.preventDefault(); handleBuscar(); }}>
              <input
                type="text"
                name="nombre"
                placeholder="Filtrar por nombre"
                value={nombreFiltro}
                onChange={e => setNombreFiltro(e.target.value)}
              />
              <input
                type="text"
                name="codigo"
                placeholder="Filtrar por código"
                value={codigoFiltro}
                onChange={e => setCodigoFiltro(e.target.value)}
              />
              <input
                type="text"
                name="abreviatura"
                placeholder="Filtrar por abreviatura"
                value={abreviaturaFiltro}
                onChange={e => setAbreviaturaFiltro(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>

            <div className={styles.actionsContainer}>
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

            {permisosUsuario.includes("registrar_materiales") && (
              <div className={styles.topActions}>
                <button
                  className={styles.botonCrear}
                  onClick={() => router.push("/materiales/crear")}
                >
                  <FaPlusCircle style={{ marginRight: "6px" }} />
                  Registrar material
                </button>
              </div>
            )}

            </div>
  
            {loading ? (
              <p>Cargando materiales…</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <>
                <table className={styles.materialesTable}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Abreviatura</th>
                      <th>Cantidad</th>
                      <th>Unidad Medida</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.map(m => (
                      <tr key={m.id}>
                        <td>{m.nombre}</td>
                        <td>{m.codigo}</td>
                        <td>{m.abreviatura}</td>
                        <td>{m.cantidad}</td>
                        <td>{m.unidad_medida_abreviatura}</td>
                        <td>
                        {!(permisosUsuario.includes("modificar_materiales") ||
                           permisosUsuario.includes("ver_detalles_materiales")) ? (
                          "--"
                        ) : (
                          <div className={styles.actionButtons}>
                            {permisosUsuario.includes("modificar_materiales") && (
                              <button
                                className={styles.actionBtn}
                                title="Editar material"
                                onClick={() => router.push(`/materiales/editar/${m.id}`)}
                              >
                                <FaRegEdit />
                              </button>
                            )}
                            {permisosUsuario.includes("ver_detalle_materiales") && (
                              <button
                                className={styles.actionBtn}
                                title="Ver detalles"
                              >
                                <FaSearch />
                              </button>
                            )}
                          </div>
                        )}
                        </td>
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
