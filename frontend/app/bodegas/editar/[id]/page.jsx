"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import styles from "./page.module.css";

export default function EditarBodegaPage() {
    const { id } = useParams();
    const router = useRouter();
    const MySwal = withReactContent(Swal);
  
    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
  
      let decoded;
      try {
        decoded = jwtDecode(token);
        if (!decoded.permisos.includes("modificar_bodegas")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch(`http://localhost:5000/bodegas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar la bodega");
          return res.json();
        })
        .then((data) => {
          setNombre(data.nombre);
          setDireccion(data.direccion);
        })
        .catch((err) => setErrorMsg(err.message))
        .finally(() => setLoading(false));
    }, [id, router]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmas los cambios?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      });
  
      if (!result.isConfirmed) {
        MySwal.fire({ title: "Cancelado", icon: "info", timer: 1200, showConfirmButton: false });
        return;
      }
  
      try {
        const res = await fetch(`http://localhost:5000/bodegas/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre, direccion }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al actualizar");
  
        MySwal.fire({ title: "Actualizado", icon: "success", timer: 1200, showConfirmButton: false });
        setTimeout(() => router.push("/bodegas"), 1300);
      } catch (err) {
        setErrorMsg(err.message);
      }
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <h1 className="titulo-editar-bodega">Editar Bodega #{id}</h1>
  
            {loading ? (
              <p>Cargando datos…</p>
            ) : errorMsg ? (
              <p className={styles.error}>{errorMsg}</p>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className="mb-3 text-start">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn w-100" style={{ backgroundColor: "#ffc107", color: "#000" }}>
                  Guardar cambios
                </button>
              </form>
            )}
          </main>
        </div>
      </>
    );
  }
