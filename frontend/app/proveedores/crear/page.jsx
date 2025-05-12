"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function CrearProveedorPage() {
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [nombre, setNombre] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos.includes("registrar_proveedores")) {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg("El nombre del proveedor es obligatorio.");
      return;
    }

    const token = localStorage.getItem("token");
    const result = await MySwal.fire({
      title: "¿Registrar proveedor?",
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
      const res = await fetch("http://localhost:5000/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar proveedor");

      MySwal.fire({
        title: "Proveedor registrado",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      router.push("/proveedores");
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
          <h1 className="titulo-registrar-proveedor">Registrar Nuevo Proveedor</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            {errorMsg && <div className={styles.error}>{errorMsg}</div>}

            <div className={styles.group}>
              <label>Nombre del proveedor</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingrese nombre"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Registrar Proveedor
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
