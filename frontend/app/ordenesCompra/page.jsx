"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./ordenes.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaRegEdit,
  FaSearch,
  FaTimesCircle,
  FaCheckCircle,
} from "react-icons/fa";

export default function OrdenesCompraPage() {
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clienteFiltro, setClienteFiltro] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [pagina, setPagina] = useState(1);
  const [resPorPagina, setResPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [permisos, setPermisos] = useState([]);

  const fetchOrdenes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("pagina", pagina);
      params.append("resultados_por_pagina", resPorPagina);
      if (clienteFiltro) params.append("cliente", clienteFiltro);
      if (usuarioFiltro) params.append("usuario", usuarioFiltro);
      if (fechaFiltro) params.append("fecha", fechaFiltro);
      if (estadoFiltro) params.append("estado", estadoFiltro);

      const res = await fetch(`http://localhost:5000/ordenesCompra?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener órdenes");
      const data = await res.json();
      setOrdenes(data.ordenes || []);
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
      setPermisos(decoded.permisos || []);
      if (!decoded.permisos.includes("ver_ordenes")) {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }
    fetchOrdenes();
  }, [
    router,
    pagina,
    resPorPagina,
    clienteFiltro,
    usuarioFiltro,
    fechaFiltro,
    estadoFiltro,
  ]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPagina(1);
  };

  const handleAnular = async (id) => {
    const result = await MySwal.fire({
      title: "¿Anular esta orden?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/ordenesCompra/${id}/anular`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    MySwal.fire("Anulada", "La orden ha sido anulada", "success");
    fetchOrdenes();
  };

  const handleVerificar = async (id) => {
    const result = await MySwal.fire({
      title: "¿Verificar materiales?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, verificar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/ordenesCompra/${id}/validarMateriales`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    MySwal.fire("Verificado", "Materiales verificados", "success");
    fetchOrdenes();
  };

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h1 className={styles.title}>Gestión de Órdenes de Compra</h1>

          <form className={styles.filtroForm} onSubmit={handleBuscar}>
            <input
              type="text"
              placeholder="Filtrar por cliente"
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filtrar por usuario"
              value={usuarioFiltro}
              onChange={(e) => setUsuarioFiltro(e.target.value)}
            />
            <input
              type="date"
              placeholder="Filtrar por fecha"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filtrar por estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <div className={styles.selectorResultados}>
            <label>Resultados por página:</label>
            <select
              value={resPorPagina}
              onChange={(e) => {
                setResPorPagina(Number(e.target.value));
                setPagina(1);
              }}
            >
              {[5, 10, 20, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Cargando órdenes…</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <>
              <table className={styles.ordenesTable}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Usuario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => {
                    const canAnular = [
                      "PENDIENTE",
                      "MATERIAL FALTANTE",
                      "MATERIAL COMPLETO",
                    ].includes(o.estado);
                    return (
                      <tr key={o.id}>
                        <td>{o.cliente_nombre}</td>
                        <td>{new Date(o.fecha_hora).toLocaleString()}</td>
                        <td>{o.estado}</td>
                        <td>{o.usuario_nombre}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            {permisos.includes("modificar_ordenes") && (
                              <button
                                className={styles.actionBtn}
                                title="Editar"
                                onClick={() =>
                                  router.push(`/ordenesCompra/editar/${o.id}`)
                                }
                              >
                                <FaRegEdit />
                              </button>
                            )}
                            {permisos.includes("ver_detalle_ordenes") && (
                              <button
                                className={styles.actionBtn}
                                title="Detalle"
                                onClick={() =>
                                  router.push(`/ordenesCompra/detalle/${o.id}`)
                                }
                              >
                                <FaSearch />
                              </button>
                            )}
                            {permisos.includes("modificar_ordenes") &&
                              canAnular && (
                                <button
                                  className={styles.actionBtn}
                                  title="Anular"
                                  onClick={() => handleAnular(o.id)}
                                >
                                  <FaTimesCircle />
                                </button>
                              )}
                            {permisos.includes("modificar_ordenes") &&
                              canAnular && (
                                <button
                                  className={styles.actionBtn}
                                  title="Verificar Materiales"
                                  onClick={() => handleVerificar(o.id)}
                                >
                                  <FaCheckCircle />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className={styles.paginacion}>
                <button
                  onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                  disabled={pagina === 1}
                >
                  ← Anterior
                </button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(p + 1, totalPaginas))
                  }
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
