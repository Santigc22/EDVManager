"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function CrearUnidadMedidaPage() {
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [nombre, setNombre] = useState("");
  const [abreviatura, setAbreviatura] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos.includes("registrar_unidades_medida")) {
        return router.push("/login");
      }
    } catch {
      return router.push("/login");
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nombre.trim() || !abreviatura.trim()) {
      setErrorMsg("Nombre y abreviatura son obligatorios.");
      return;
    }

    const token = localStorage.getItem("token");
    const result = await MySwal.fire({
      title: "¿Registrar unidad de medida?",
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
      const res = await fetch("http://localhost:5000/unidadesMedida", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          abreviatura: abreviatura.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar unidad");

      MySwal.fire({
        title: "Unidad registrada",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      router.push("/unidadesMedida");
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
          <h1 className="titulo-registrar-unidad-medida">Registrar Unidad de Medida</h1>
          <form className={styles.form} onSubmit={handleSubmit}>
            {errorMsg && <div className={styles.error}>{errorMsg}</div>}

            <div className={styles.group}>
              <label>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className={styles.group}>
              <label>Abreviatura</label>
              <input
                type="text"
                value={abreviatura}
                onChange={(e) => setAbreviatura(e.target.value)}
                placeholder="e.g. kg, g"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Registrar Unidad
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
