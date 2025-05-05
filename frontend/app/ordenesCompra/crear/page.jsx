"use client";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function CrearOrdenPage() {
  const router = useRouter();
  const MySwal = withReactContent(Swal);

  const [clienteId, setClienteId] = useState("");
  const [detalle, setDetalle] = useState("");
  const [materiales, setMateriales] = useState([
    { material_id: "", cantidad: "", precio_unitario: "" },
  ]);

  const [clientes, setClientes] = useState([]);
  const [materialOptionsList, setMaterialOptionsList] = useState([[]]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const clientesTimer = useRef(null);
  const matTimer = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos.includes("modificar_ordenes")) {
        return router.push("/login");
      }
    } catch {
      return router.push("/login");
    }
    setLoading(false);
  }, [router]);

  const fetchClientes = (q) => {
    clearTimeout(clientesTimer.current);
    clientesTimer.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://edvmanager.onrender.com/clientes?nombre=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setClientes(data.clientes || []);
    }, 300);
  };

  const fetchMateriales = (i, query) => {
    clearTimeout(matTimer.current[i]);
    matTimer.current[i] = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://edvmanager.onrender.com/materiales?abreviatura=${encodeURIComponent(
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
    setMateriales((prev) => [
      ...prev,
      { material_id: "", cantidad: "", precio_unitario: "" },
    ]);
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

    if (!clienteId || !detalle.trim() || materiales.length === 0) {
      return setErrorMsg("Cliente, detalle y materiales son obligatorios.");
    }
    for (let m of materiales) {
      if (
        !m.material_id ||
        !m.cantidad ||
        isNaN(m.cantidad) ||
        m.cantidad <= 0 ||
        !m.precio_unitario ||
        isNaN(m.precio_unitario) ||
        m.precio_unitario <= 0
      ) {
        return setErrorMsg(
          "Cada material necesita cantidad y precio_unitario válidos."
        );
      }
    }

    const token = localStorage.getItem("token");
    const confirm = await MySwal.fire({
      title: "¿Registrar esta orden?",
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
      const res = await fetch("https://edvmanager.onrender.com/ordenesCompra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          detalle,
          materiales: materiales.map((m) => ({
            material_id: Number(m.material_id),
            cantidad: parseFloat(m.cantidad),
            precio_unitario: parseFloat(m.precio_unitario),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error creando orden");

      MySwal.fire({
        title: "Orden registrada",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
      setTimeout(() => router.push("/ordenesCompra"), 1300);
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
          <h1 className="titulo-registrar-orden">Registrar Orden de Compra</h1>
          {loading ? (
            <p>Cargando…</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {errorMsg && <div className={styles.error}>{errorMsg}</div>}

              <div className={styles.group}>
                <label>Cliente</label>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  onChange={(e) => fetchClientes(e.target.value)}
                />
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.group}>
                <label>Detalle</label>
                <textarea
                  maxLength={255}
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  required
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
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio Unitario"
                        value={m.precio_unitario}
                        onChange={(e) =>
                          handleMaterialChange(
                            i,
                            "precio_unitario",
                            e.target.value
                          )
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
                Registrar Orden
              </button>
            </form>
          )}
        </main>
      </div>
    </>
  );
}
