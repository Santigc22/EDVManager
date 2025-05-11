"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./roles.module.css";
import { FaPlusCircle, FaRegEdit, FaTrashAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const MySwal = withReactContent(Swal);

  const fetchRoles = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("https://edvmanager.onrender.com/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Error al cargar roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos.includes("ver_roles")) {
        return router.push("/login");
      }
    } catch {
      return router.push("/login");
    }
    fetchRoles();
  }, [router]);

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "¿Está seguro que desea eliminar este rol?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://edvmanager.onrender.com/roles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      MySwal.fire({
        title: "Rol eliminado",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      fetchRoles();
    } catch (err) {
      console.error(err);
      MySwal.fire({
        title: "Error",
        text: err.message,
        icon: "error",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>Cargando…</main>
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
            <h1>Gestión de Roles</h1>
            <button
              className={styles.botonCrear}
              onClick={() => router.push("/roles/crear")}
            >
              <FaPlusCircle style={{ marginRight: "6px" }} />
              Registrar rol
            </button>
          </div>

          <table className={styles.rolesTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Rol</th>
                <th>Permisos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.rol}</td>
                  <td>{r.permisos.join(", ")}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionBtn}
                        title="Editar"
                        onClick={() => router.push(`/roles/editar/${r.id}`)}
                      >
                        <FaRegEdit />
                      </button>
                      <button
                        className={styles.actionBtn}
                        title="Eliminar"
                        onClick={() => handleDelete(r.id)}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
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