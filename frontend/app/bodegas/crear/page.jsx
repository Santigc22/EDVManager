"use client";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { FaPlusCircle } from "react-icons/fa";

export default function CrearBodegaPage() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [permisosUsuario, setPermisosUsuario] = useState([]);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
  
      try {
        const decoded = jwtDecode(token);
        setPermisosUsuario(decoded.permisos || []);
        if (!decoded.permisos.includes("registrar_bodegas")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
    }, [router]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
      setSuccessMsg("");
      setLoading(true);
  
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/bodegas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre, direccion }),
        });
  
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al crear la bodega");
        }
  
        setSuccessMsg("Bodega registrada exitosamente");
        setTimeout(() => router.push("/bodegas"), 1500);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <>
        <Header />
        <div 
            className="d-flex justify-content-center align-items-center vh-100"
            style={{ backgroundColor: "#000000" }}
        >
          <Sidebar />
          <div
          className="card shadow p-4 text-white text-center"
          style={{ width: "400px", backgroundColor: "#05874b" }}
        >
          <div className="d-flex justify-content-center mb-3">
            <FaPlusCircle size={48} />
          </div>
          <h2 className="mb-3">Crear nueva bodega</h2>

          {errorMsg && (
            <div className="alert alert-danger text-start">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="alert alert-success text-start">{successMsg}</div>
          )}

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
            <button
              type="submit"
              className="btn w-100"
              style={{ backgroundColor: "#ffc107", color: "#000" }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Crear bodega"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
