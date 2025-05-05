"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "bootstrap/dist/css/bootstrap.min.css";

export default function EditarMaterialPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const MySwal = withReactContent(Swal);
  
    const [nombre, setNombre] = useState("");
    const [codigo, setCodigo] = useState("");
    const [abreviatura, setAbreviatura] = useState("");
    const [precio, setPrecio] = useState("");
    const [unidadMedidaId, setUnidadMedidaId] = useState("");
    const [unidades, setUnidades] = useState([]);
  
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
  
    useEffect(() => {
        if (!id) return;

      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
  
      let decoded;
      try {
        decoded = jwtDecode(token);
        if (!decoded.permisos.includes("modificar_materiales")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch(`https://edvmanager.onrender.com/materiales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("No se pudo cargar el material");
          return res.json();
        })
        .then(data => {
          setNombre(data.nombre);
          setCodigo(data.codigo);
          setAbreviatura(data.abreviatura);
          setPrecio(data.precio);
          setUnidadMedidaId(data.unidad_medida_id);
        })
        .catch(err => setErrorMsg(err.message))
        .finally(() => setLoading(false));
  
      fetch("https://edvmanager.onrender.com/unidadesMedida", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(json => setUnidades(json.unidades_medida || []))
        .catch(() => {/* ignorar errores aquí */});
    }, [id, router]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmar cambios?",
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
        const res = await fetch(`https://edvmanager.onrender.com/materiales/${id}`, {
          method: "PATCH",
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
        if (!res.ok) throw new Error(data.message || "Error al actualizar");
  
        MySwal.fire({ title: "Actualizado", icon: "success", timer: 1200, showConfirmButton: false });
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
            <h2 className="mb-3">Editar material #{id}</h2>
            {loading ? (
              <p>Cargando…</p>
            ) : errorMsg ? (
              <div className="alert alert-danger text-start">{errorMsg}</div>
            ) : (
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
                  Guardar cambios
                </button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }
