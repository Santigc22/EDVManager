"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./bodegas.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { FaPlusCircle, FaExchangeAlt, FaRegEdit, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";


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
    const [permisosUsuario, setPermisosUsuario] = useState([]);
    const MySwal = withReactContent(Swal);

    const fetchBodegas = async () => {
        const token = localStorage.getItem("token");
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
        if (!decoded.permisos?.includes("ver_bodegas")) {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
        return;
      }
  
      fetchBodegas();
    }, [pagina, resultadosPorPagina, nombreFiltro, router]);
  
    const handleBuscar = () => {
      setPagina(1);
    };

    const handleChangeEstado = async (bodega) => {
        const token = localStorage.getItem("token");

        const result = await MySwal.fire({
          title: '¿Desea cambiar el estado de esta bodega?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Aceptar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
          customClass: {
            popup: 'mi-alerta',
            title: 'mi-titulo',
            icon: 'mi-icono',
            confirmButton: 'mi-boton-aceptar',
            cancelButton: 'mi-boton-cancelar'
          }
        });
      
        if (result.isDismissed || result.isDenied || result.isCanceled) {
          MySwal.fire({
            title: 'Cancelado',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            customClass: {
                popup: 'mi-alerta',
                icon: 'mi-icono-cancelar'
              }
          });
          return;
        }
      
        try {
          const nuevoEstado = !bodega.estado;
      
          const response = await fetch(`http://localhost:5000/bodegas/${bodega.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ estado: nuevoEstado }),
          });
      
          const data = await response.json();
      
          if (!response.ok) {
            throw new Error(data.message || "Error al cambiar estado");
          }
      
          MySwal.fire({
            title: 'Estado actualizado',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });

          setBuscar(true);
          fetchBodegas();
      
        } catch (error) {
          console.error("Error:", error.message);
          MySwal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
          });
        }
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
              </div>
  
            <div className={styles.actionsContainer}>
  
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
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              {permisosUsuario.includes("registrar_bodegas") && (
                <div className={styles.topActions}>
                  <button
                    className={styles.botonCrear}
                    onClick={() => router.push("/bodegas/crear")}
                  >
                    <FaPlusCircle style={{ marginRight: "6px" }} />
                    Crear bodega
                  </button>
                </div>
              )}
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
                        <td>
                        {!(permisosUsuario.includes("modificar_bodegas") || permisosUsuario.includes("ver_detalle_bodegas")) ? (
                         "—"
                        ) : (
                         <div className={styles.actionButtons}>
                            {permisosUsuario.includes("modificar_bodegas") && (
                                <>
                                    <button
                                        className={styles.actionStateBtn}
                                        title="Cambiar estado"
                                        onClick={() => handleChangeEstado(b)}
                                    >
                                <FaExchangeAlt />
                                </button>
                                <button
                                    className={styles.actionEditBtn}
                                    title="Editar información"
                                    onClick={() => router.push(`/bodegas/editar/${b.id}`)}
                                >
                                <FaRegEdit />
                                </button>
                                </>
                           )}
                            {permisosUsuario.includes("ver_detalle_bodegas") && (
                             <button
                               className={styles.actionDetailsBtn}
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
                    onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                    disabled={pagina === 1}
                  >
                    Anterior
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