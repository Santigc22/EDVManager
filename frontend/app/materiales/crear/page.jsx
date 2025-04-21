"use client";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaPlusCircle } from "react-icons/fa";

export default function CrearMaterialPage() {
    const router = useRouter();
    const MySwal = withReactContent(Swal);
  
    const [nombre, setNombre] = useState("");
    const [codigo, setCodigo] = useState("");
    const [abreviatura, setAbreviatura] = useState("");
    const [precio, setPrecio] = useState("");
    const [unidadMedidaId, setUnidadMedidaId] = useState("");
  
    const [unidades, setUnidades] = useState([]);
  
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
  
      let decoded;
      try {
        decoded = jwtDecode(token);
        if (!decoded.permisos.includes("registrar_materiales")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch("http://localhost:5000/unidadesMedida", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("Error al cargar unidades");
          return res.json();
        })
        .then(data => {
                   setUnidades(data.unidades_medida || []);
                })
        .catch(err => setErrorMsg(err.message));
    }, [router]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
      setSuccessMsg("");
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmar registro?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Registrar",
        cancelButtonText: "Cancelar",
      });
  
      if (!result.isConfirmed) {
        MySwal.fire({ title: "Cancelado", icon: "info", timer: 1200, showConfirmButton: false });
        return;
      }
  
      try {
        const res = await fetch("http://localhost:5000/materiales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre,
            codigo: Number(codigo),
            abreviatura,
            precio: parseFloat(precio),
            unidad_medida_id: Number(unidadMedidaId),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al registrar");
  
        setSuccessMsg("Material registrado exitosamente");
        setTimeout(() => router.push("/materiales"), 1300);
      } catch (err) {
        setErrorMsg(err.message);
      }
    };
  
    return (
      <>
        <Header />
        <div
          className="d-flex justify-content-center align-items-center vh-100"
          style={{ backgroundColor: "#1e1e1e" }}
        >
            <Sidebar />
          <div
            className="card shadow p-4 text-white text-center"
            style={{ width: "400px", backgroundColor: "#05874b" }}
          >
            <div className="d-flex justify-content-center mb-3">
              <FaPlusCircle size={48} />
            </div>
            <h2 className="mb-3">Registrar nuevo material</h2>
  
            {errorMsg && <div className="alert alert-danger text-start">{errorMsg}</div>}
            {successMsg && <div className="alert alert-success text-start">{successMsg}</div>}
  
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="mb-3 text-start">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
  
              <div className="mb-3 text-start">
                <label className="form-label">Código</label>
                <input
                  type="number"
                  className="form-control"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  required
                />
              </div>
  
              <div className="mb-3 text-start">
                <label className="form-label">Abreviatura</label>
                <input
                  type="text"
                  className="form-control"
                  value={abreviatura}
                  onChange={e => setAbreviatura(e.target.value)}
                  required
                />
              </div>
  
              <div className="mb-3 text-start">
                <label className="form-label">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  required
                />
              </div>
  
              <div className="mb-3 text-start">
                <label className="form-label">Unidad de Medida</label>
                <select
                  className="form-select"
                  value={unidadMedidaId}
                  onChange={e => setUnidadMedidaId(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.abreviatura}
                    </option>
                  ))}
                </select>
              </div>
  
              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: "#ffc107", color: "#000" }}
              >
                Registrar material
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }
