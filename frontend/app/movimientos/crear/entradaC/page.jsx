"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function EntradaCPage() {
    const router = useRouter();
    const { tipo } = useParams();
    const MySwal = withReactContent(Swal);
  
    const [bodegaDestId, setBodegaDestId] = useState("");
    const [proveedorId, setProveedorId] = useState("");
    const [observaciones, setObservaciones] = useState("");
  
    const [bodegas, setBodegas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [materialOptions, setMaterialOptions] = useState([]);
  
    const [materiales, setMateriales] = useState([
      { material_id: "", cantidad: "" },
    ]);
  
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
  
    const bodegasTimer = useRef(null);
    const provTimer = useRef(null);
    const matTimer = useRef(null);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("registrar_movimientos")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
      setLoading(false);
    }, [router]);
  
    const fetchBodegas = (query) => {
      clearTimeout(bodegasTimer.current);
      bodegasTimer.current = setTimeout(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/bodegas?nombre=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setBodegas(data.bodegas || []);
      }, 300);
    };
  
    const fetchProveedores = (query) => {
      clearTimeout(provTimer.current);
      provTimer.current = setTimeout(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/proveedores?nombre=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setProveedores(data.proveedores || []);
      }, 300);
    };
  
    const fetchMateriales = (query) => {
      clearTimeout(matTimer.current);
      matTimer.current = setTimeout(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/materiales?abreviatura=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setMaterialOptions(data.materiales || []);
      }, 300);
    };
  
    const handleAddMaterial = () =>
      setMateriales((prev) => [...prev, { material_id: "", cantidad: "" }]);
  
    const handleMaterialChange = (idx, field, value) => {
      setMateriales((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, [field]: value } : item
        )
      );
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      if (!bodegaDestId || !proveedorId || materiales.length === 0) {
        return setErrorMsg("Los campos bodega, proveedor y materiales son obligatorios.");
      }
      for (let m of materiales) {
        if (!m.material_id || !m.cantidad || isNaN(m.cantidad) || m.cantidad <= 0) {
          return setErrorMsg("Cada material debe tener ID y cantidad > 0.");
        }
      }
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmar entrada de materiales?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Registrar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) {
        return MySwal.fire({ title: "Cancelado", icon: "info", timer: 1200, showConfirmButton: false });
      }
  
      try {
        const res = await fetch("http://localhost:5000/movimientos/entrada-c", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bodega_destino_id: Number(bodegaDestId),
            proveedor_id: Number(proveedorId),
            observaciones,
            materiales: materiales.map((m) => ({
              material_id: Number(m.material_id),
              cantidad: parseFloat(m.cantidad),
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error registrando");
  
        MySwal.fire({ title: "Registrado", icon: "success", timer: 1200, showConfirmButton: false });
        setTimeout(() => router.push("/movimientos"), 1300);
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
            <h1 className="title-entrada-c">Registrar ENTRADA-C</h1>
            {loading ? (
              <p>Cargando…</p>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                {errorMsg && <div className={styles.error}>{errorMsg}</div>}
  
                <div className={styles.group}>
                  <label>Bodega destino</label>
                  <input
                    type="text"
                    placeholder="Buscar bodega..."
                    onChange={(e) => fetchBodegas(e.target.value)}
                  />
                  <select
                    value={bodegaDestId}
                    onChange={(e) => setBodegaDestId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {bodegas.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
  
                <div className={styles.group}>
                  <label>Proveedor</label>
                  <input
                    type="text"
                    placeholder="Buscar proveedor..."
                    onChange={(e) => fetchProveedores(e.target.value)}
                  />
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
  
                <div className={styles.group}>
                  <label>Observaciones</label>
                  <textarea
                    maxLength={255}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
  
                <div className={styles.group}>
                  <label>Materiales</label>
                  {materiales.map((m, i) => (
                    <div key={i} className={styles.materialRow}>
                      <div>
                        <input
                          type="text"
                          placeholder="Buscar abreviatura..."
                          onChange={(e) => fetchMateriales(e.target.value)}
                        />
                        <select
                          value={m.material_id}
                          onChange={(e) => handleMaterialChange(i, "material_id", e.target.value)}
                          required
                        >
                          <option value="">Seleccione...</option>
                          {materialOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.abreviatura}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={m.cantidad}
                          onChange={(e) => handleMaterialChange(i, "cantidad", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" className={styles.addBtn} onClick={handleAddMaterial}>
                    + Añadir material
                  </button>
                </div>
  
                <button type="submit" className={styles.submitBtn}>
                  Registrar Entrada-C
                </button>
              </form>
            )}
          </main>
        </div>
      </>
    );
  }
