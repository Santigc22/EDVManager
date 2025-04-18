"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "./usuarios.module.css";

const UsuariosPage = () => {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos || !decoded.permisos.includes("ver_usuarios")) {
        router.push("/login");
        return;
      }

      fetch("http://localhost:5000/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsuarios(data.usuarios || []);
          setCargando(false);
        })
        .catch((error) => {
          console.error("Error al obtener los usuarios:", error);
          setCargando(false);
        });
    } catch (error) {
      console.error("Token inválido:", error);
      router.push("/login");
    }
  }, [router]);

  return (
    <>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar />
        <main className={styles.usuariosMainContent}>
          <h1>Gestión de Usuarios</h1>

          {cargando ? (
            <p>Cargando usuarios...</p>
          ) : (
            <table className={styles.usuariosTable}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Identificación</th>
                  <th>Fecha Modificación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.username}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.identificacion}</td>
                    <td>{new Date(usuario.fecha_modificacion).toLocaleDateString()}</td>
                    <td>—</td>
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

export default UsuariosPage;