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

  const [filtros, setFiltros] = useState({
    nombre: "",
    username: "",
    email: "",
    identificacion: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsuarios = async () => {
    if (!token) return;

    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    try {
      const response = await fetch(`http://localhost:5000/usuarios?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
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

      fetchUsuarios();
    } catch (error) {
      console.error("Error con el token:", error);
      router.push("/login");
    }
  }, []);

  const handleChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const handleFiltrar = (e) => {
    e.preventDefault();
    setCargando(true);
    fetchUsuarios();
  };

  return (
    <>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar />
        <main className={styles.usuariosMainContent}>
          <h1>Gestión de Usuarios</h1>

          {/* Formulario de filtros */}
          <form className={styles.filtroForm} onSubmit={handleFiltrar}>
            <input
              type="text"
              name="nombre"
              placeholder="Filtrar por nombre"
              value={filtros.nombre}
              onChange={handleChange}
            />
            <input
              type="text"
              name="username"
              placeholder="Filtrar por username"
              value={filtros.username}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Filtrar por email"
              value={filtros.email}
              onChange={handleChange}
            />
            <input
              type="text"
              name="identificacion"
              placeholder="Filtrar por identificación"
              value={filtros.identificacion}
              onChange={handleChange}
            />
            <button type="submit">Buscar</button>
          </form>

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