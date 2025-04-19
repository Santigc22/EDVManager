"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./usuarios.module.css";

const UsuariosPage = () => {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [resultadosPorPagina, setResultadosPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [filtros, setFiltros] = useState({
    nombre: "",
    username: "",
    email: "",
    identificacion: "",
  });

  const [ordenarPor, setOrdenarPor] = useState("");
  const [orden, setOrden] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsuarios = async () => {
    if (!token) return;

    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    if (ordenarPor) queryParams.append("ordenar_por", ordenarPor);
    if (orden) queryParams.append("orden", orden);

    queryParams.append("pagina", paginaActual);
    queryParams.append("resultados_por_pagina", resultadosPorPagina);

    try {
      const response = await fetch(`http://localhost:5000/usuarios?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUsuarios(data.usuarios || []);
      setTotalPaginas(data.total_paginas);
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

  useEffect(() => {
    if (token) {
      fetchUsuarios();
    }
  }, [paginaActual, resultadosPorPagina]);

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

  const handleOrdenar = (columna) => {
    if (ordenarPor !== columna) {
      setOrdenarPor(columna);
      setOrden("ASC");
    } else if (orden === "ASC") {
      setOrden("DESC");
    } else if (orden === "DESC") {
      setOrdenarPor("");
      setOrden("");
    }

    setPaginaActual(1);
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      setCargando(true);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.pageWrapper}>
        <Sidebar />
        <main className={styles.usuariosMainContent}>
          <h1>Gestión de Usuarios</h1>

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
            <>
            <table className={styles.usuariosTable}>
              <thead>
                <tr>
                    <th>
                    Nombre{" "}
                    <span onClick={() => handleOrdenar("nombre")} style={{ cursor: "pointer" }}>
                        {ordenarPor === "nombre" ? (orden === "ASC" ? "↑" : orden === "DESC" ? "↓" : "↕") : "↕"}
                    </span>
                    </th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Identificación</th>
                  <th>
                    Fecha Modificación{" "}
                    <span onClick={() => handleOrdenar("fecha_modificacion")} style={{ cursor: "pointer" }}>
                        {ordenarPor === "fecha_modificacion" ? (orden === "ASC" ? "↑" : orden === "DESC" ? "↓" : "↕") : "↕"}
                    </span>
                    </th>
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
            
            <div className={styles.paginacion}>
            <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
              ← Anterior
            </button>
            <span>Página {paginaActual} de {totalPaginas}</span>
            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente →
            </button>

            <label style={{ marginLeft: "1rem" }}>
              Resultados por página:
              <select
                value={resultadosPorPagina}
                onChange={(e) => {
                  setResultadosPorPagina(parseInt(e.target.value));
                  setPaginaActual(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </label>
          </div>
        </>
      )}
        </main>
      </div>
    </>
  );
};

export default UsuariosPage;