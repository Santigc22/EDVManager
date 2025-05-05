"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./roles.module.css";
import { FaPlusCircle, FaRegEdit, FaTrashAlt } from "react-icons/fa";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetch("http://localhost:5000/roles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRoles(data))
      .finally(() => setLoading(false));
  }, [router]);

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
                        onClick={() => {
                        }}
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
