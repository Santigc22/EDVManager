"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function EditarUsuarioPage() {
    const router = useRouter();
    const { id } = useParams();
    const MySwal = withReactContent(Swal);
  
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [identificacion, setIdentificacion] = useState("");
    const [estadoUsuario, setEstadoUsuario] = useState(true);
    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
  
      let decoded;
      try {
        decoded = jwtDecode(token);
        if (!decoded.permisos.includes("modificar_usuarios")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      Promise.all([
        fetch(`https://edvmanager.onrender.com/usuarios/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar el usuario");
          return res.json();
        }),
        fetch("https://edvmanager.onrender.com/roles", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ])
        .then(([usr, roles]) => {
          setNombre(usr.nombre);
          setUsername(usr.username);
          setEmail(usr.email);
          setIdentificacion(usr.identificacion);
          setEstadoUsuario(usr.estado);
          setRolesDisponibles(roles);
          const nombresAMarcar = usr.roles;
          const ids = roles
            .filter((r) => nombresAMarcar.includes(r.rol))
            .map((r) => String(r.id));
          setRolesSeleccionados(ids);
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }, [id, router]);
  
    const toggleRole = (e) => {
      const val = e.target.value;
      setRolesSeleccionados((prev) =>
        prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
      );
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      if (!nombre || !username || !email || !identificacion) {
        setErrorMsg("Todos los campos son obligatorios.");
        return;
      }
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmar cambios?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) {
        return MySwal.fire({
          title: "Cancelado",
          icon: "info",
          timer: 1200,
          showConfirmButton: false,
        });
      }
  
      try {
        const res = await fetch(`https://edvmanager.onrender.com/usuarios/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre,
            username,
            email,
            identificacion,
            estado: estadoUsuario,
            roles: rolesSeleccionados.map((r) => Number(r)),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error actualizando");
  
        MySwal.fire({
          title: "Usuario actualizado",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        router.push("/usuarios");
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message);
      }
    };
  
    if (loading) {
      return (
        <>
          <Header />
          <div className={styles.pageContainer}>
            <Sidebar />
            <main className={styles.mainContent}>Cargando datos…</main>
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
            <h1 className="titulo-editar-usuario">Editar Usuario #{id}</h1>
            <form className={styles.form} onSubmit={handleSubmit}>
              {errorMsg && <div className={styles.error}>{errorMsg}</div>}
  
              <div className={styles.group}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
  
              <div className={styles.group}>
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
  
              <div className={styles.group}>
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
  
              <div className={styles.group}>
                <label>Identificación</label>
                <input
                  type="number"
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value)}
                  required
                />
              </div>
  
              <div className={styles.group}>
                <label>Estado</label>
                <select
                  value={estadoUsuario ? "activo" : "inactivo"}
                  onChange={(e) =>
                    setEstadoUsuario(e.target.value === "activo")
                  }
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
  
              <div className={styles.group}>
                <label>Roles</label>
                <div className={styles.rolesList}>
                  {rolesDisponibles.map((r) => (
                    <label
                      key={r.id}
                      className={styles.checkboxLabel}
                    >
                      <input
                        type="checkbox"
                        value={r.id}
                        checked={rolesSeleccionados.includes(
                          String(r.id)
                        )}
                        onChange={toggleRole}
                      />
                      {r.rol}
                    </label>
                  ))}
                </div>
              </div>
  
              <button type="submit" className={styles.submitBtn}>
                Guardar cambios
              </button>
            </form>
          </main>
        </div>
      </>
    );
  }
