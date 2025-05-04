"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function TrasladoPage() {
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [bodegaOrigenId, setBodegaOrigenId] = useState("");
  const [bodegaDestinoId, setBodegaDestinoId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [bodegasOrigen, setBodegasOrigen] = useState([]);
  const [bodegasDestino, setBodegasDestino] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [materialOptionsList, setMaterialOptionsList] = useState([[]]);

  const [materiales, setMateriales] = useState([
    { material_id: "", cantidad: "" },
  ]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const origenTimer = useRef(null);
  const destinoTimer = useRef(null);
  const matTimer = useRef([]);

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

  const fetchBodegasOrigen = (q) => {
    clearTimeout(origenTimer.current);
    origenTimer.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/bodegas?nombre=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setBodegasOrigen(data.bodegas || []);
    }, 300);
  };

  const fetchBodegasDestino = (q) => {
    clearTimeout(destinoTimer.current);
    destinoTimer.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/bodegas?nombre=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setBodegasDestino(data.bodegas || []);
    }, 300);
  };

  const fetchMateriales = (i, query) => {
    clearTimeout(matTimer.current[i]);
    matTimer.current[i] = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/materiales?abreviatura=${encodeURIComponent(
          query
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMaterialOptionsList((prev) => {
        const copy = [...prev];
        copy[i] = data.materiales || [];
        return copy;
      });
    }, 300);
  };

  const handleAddMaterial = () => {
    setMateriales((prev) => [...prev, { material_id: "", cantidad: "" }]);
    setMaterialOptionsList((prev) => [...prev, []]);
  };

  const handleMaterialChange = (i, field, val) => {
    setMateriales((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!bodegaOrigenId || !bodegaDestinoId || materiales.length === 0) {
      return setErrorMsg("Bodegas y materiales son obligatorios.");
    }
    for (let m of materiales) {
      if (
        !m.material_id ||
        !m.cantidad ||
        isNaN(m.cantidad) ||
        m.cantidad <= 0
      ) {
        return setErrorMsg("Cada material necesita cantidad > 0.");
      }
    }

    const token = localStorage.getItem("token");
    const confirm = await MySwal.fire({
      title: "¿Confirmar traslado?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) {
      return MySwal.fire({
        title: "Cancelado",
        icon: "info",
        timer: 1200,
        showConfirmButton: false,
      });
    }

    try {
      const res = await fetch("http://localhost:5000/movimientos/traslado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bodega_origen_id: Number(bodegaOrigenId),
          bodega_destino_id: Number(bodegaDestinoId),
          observaciones,
          materiales: materiales.map((m) => ({
            material_id: Number(m.material_id),
            cantidad: parseFloat(m.cantidad),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error registrando traslado");

      MySwal.fire({
        title: "Traslado registrado",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
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
          <h1 className="titulo-traslado">Registrar TRASLADO</h1>
          {loading ? (
            <p>Cargando…</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {errorMsg && <div className={styles.error}>{errorMsg}</div>}

              <div className={styles.group}>
                <label>Bodega origen</label>
                <input
                  type="text"
                  placeholder="Buscar origen..."
                  onChange={(e) => fetchBodegasOrigen(e.target.value)}
                />
                <select
                  value={bodegaOrigenId}
                  onChange={(e) => setBodegaOrigenId(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  {bodegasOrigen.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.group}>
                <label>Bodega destino</label>
                <input
                  type="text"
                  placeholder="Buscar destino..."
                  onChange={(e) => fetchBodegasDestino(e.target.value)}
                />
                <select
                  value={bodegaDestinoId}
                  onChange={(e) => setBodegaDestinoId(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  {bodegasDestino.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
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
                        onChange={(e) => fetchMateriales(i, e.target.value)}
                      />
                      <select
                        value={m.material_id}
                        onChange={(e) =>
                          handleMaterialChange(i, "material_id", e.target.value)
                        }
                        required
                      >
                        <option value="">Seleccione...</option>
                        {materialOptionsList[i].map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.abreviatura}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={m.cantidad}
                        onChange={(e) =>
                          handleMaterialChange(i, "cantidad", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={handleAddMaterial}
                >
                  + Añadir material
                </button>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Registrar Traslado
              </button>
            </form>
          )}
        </main>
      </div>
    </>
  );
}
