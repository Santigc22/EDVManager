"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./proveedores.module.css";
import { FaPlusCircle, FaRegEdit } from "react-icons/fa";

export default function ProveedoresPage() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState([]);
    const [filtroNombre, setFiltroNombre] = useState("");
    const [pagina, setPagina] = useState(1);
    const [resultadosPorPagina, setResultadosPorPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("ver_proveedores")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetchProveedores();
    }, [pagina, resultadosPorPagina, filtroNombre, router]);
  
    const fetchProveedores = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("pagina", pagina);
      params.append("resultados_por_pagina", resultadosPorPagina);
      if (filtroNombre.trim()) params.append("nombre", filtroNombre.trim());
  
      const res = await fetch(`http://localhost:5000/proveedores?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProveedores(data.proveedores || []);
      setTotalPaginas(data.total_paginas || 1);
      setLoading(false);
    };
  
    const handleBuscar = e => {
      e.preventDefault();
      setPagina(1);
      fetchProveedores();
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <div className={styles.titleBar}>
              <h1>Gestión de Proveedores</h1>
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/proveedores/crear")}
              >
                <FaPlusCircle style={{ marginRight: "6px" }} />
                Registrar proveedor
              </button>
            </div>
  
            <form className={styles.filtroForm} onSubmit={handleBuscar}>
              <input
                type="text"
                placeholder="Filtrar por nombre"
                value={filtroNombre}
                onChange={e => setFiltroNombre(e.target.value)}
              />
            </form>
  
            {loading ? (
              <p>Cargando proveedores…</p>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.nombre}</td>
                        <td>{p.estado ? "Activo" : "Inactivo"}</td>
                        <td>
                          <button
                            className={styles.actionBtn}
                            title="Editar"
                            onClick={() => router.push(`/proveedores/editar/${p.id}`)}
                          >
                            <FaRegEdit />
                          </button>
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
                    Anterior
                  </button>
                  <span>
                    Página {pagina} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))}
                    disabled={pagina === totalPaginas}
                  >
                    Siguiente
                  </button>
                  <select
                    value={resultadosPorPagina}
                    onChange={e => {
                      setResultadosPorPagina(Number(e.target.value));
                      setPagina(1);
                    }}
                  >
                    {[5, 10, 20, 25].map(n => (
                      <option key={n} value={n}>{n} por página</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </main>
        </div>
      </>
    );
  }
