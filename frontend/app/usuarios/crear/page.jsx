"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function CrearUsuarioPage() {
    const router = useRouter();
    const MySwal = withReactContent(Swal);
  
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [contrasenia, setContrasenia] = useState("");
    const [email, setEmail] = useState("");
    const [identificacion, setIdentificacion] = useState("");
    const [rolesDisponibles, setRolesDisponibles] = useState([]);
    const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("crear_usuarios")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch("http://localhost:5000/roles", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setRolesDisponibles(data);
        })
        .catch((err) => console.error("Error cargando roles:", err));
    }, [router]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      if (
        !nombre ||
        !username ||
        !contrasenia ||
        !email ||
        !identificacion
      ) {
        setErrorMsg("Todos los campos son obligatorios.");
        return;
      }
  
      const token = localStorage.getItem("token");
  
      const result = await MySwal.fire({
        title: "¿Confirmar registro?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Registrar",
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
        const res = await fetch("http://localhost:5000/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre,
            username,
            contrasenia,
            email,
            identificacion,
            roles: rolesSeleccionados.map((r) => Number(r)),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error al registrar");
  
        MySwal.fire({
          title: "Usuario registrado",
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
  
    const toggleRole = (e) => {
      const val = e.target.value;
      setRolesSeleccionados((prev) =>
        prev.includes(val)
          ? prev.filter((x) => x !== val)
          : [...prev, val]
      );
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <h1 className="titulo-registrar-usuario">Registrar Nuevo Usuario</h1>
            <form className={styles.form} onSubmit={handleSubmit}>
              {errorMsg && (
                <div className={styles.error}>{errorMsg}</div>
              )}
  
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
                <label>Contraseña</label>
                <input
                  type="password"
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
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
                <label>Número de identificación</label>
                <input
                  type="number"
                  value={identificacion}
                  onChange={(e) =>
                    setIdentificacion(e.target.value)
                  }
                  required
                />
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
                Registrar
              </button>
            </form>
          </main>
        </div>
      </>
    );
  }
