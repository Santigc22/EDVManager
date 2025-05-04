"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function VentaPage() {
    const router = useRouter();
    const MySwal = withReactContent(Swal);
  
    const [ordenCompraId, setOrdenCompraId] = useState("");
    const [bodegaOrigenId, setBodegaOrigenId] = useState("");
    const [observaciones, setObservaciones] = useState("");
  
    const [ordenes, setOrdenes] = useState([]);
    const [bodegas, setBodegas] = useState([]);
  
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
  
    const bodegasTimer = useRef(null);
  
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
  
      fetch("http://localhost:5000/ordenesCompra?estado=MATERIAL%20COMPLETO", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al cargar órdenes");
          return res.json();
        })
        .then((data) => {
          setOrdenes(data.ordenes || []);
        })
        .catch((err) => setErrorMsg(err.message));
  
      setLoading(false);
    }, [router]);
  
    const fetchBodegas = (q) => {
      clearTimeout(bodegasTimer.current);
      bodegasTimer.current = setTimeout(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/bodegas?nombre=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setBodegas(data.bodegas || []);
      }, 300);
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
  
      if (!ordenCompraId || !bodegaOrigenId) {
        return setErrorMsg("Orden de compra y bodega origen son obligatorios.");
      }
  
      const token = localStorage.getItem("token");
      const result = await MySwal.fire({
        title: "¿Confirmar venta?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Registrar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) {
        return MySwal.fire({ title: "Cancelado", icon: "info", timer: 1200, showConfirmButton: false });
      }
  
      try {
        const res = await fetch("http://localhost:5000/movimientos/venta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orden_compra_id: Number(ordenCompraId),
            bodega_origen_id: Number(bodegaOrigenId),
            observaciones,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error registrando venta");
  
        MySwal.fire({ title: "Venta registrada", icon: "success", timer: 1200, showConfirmButton: false });
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
            <h1 className="titulo-venta">Registrar VENTA</h1>
            {loading ? (
              <p>Cargando…</p>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                {errorMsg && <div className={styles.error}>{errorMsg}</div>}
  
                <div className={styles.group}>
                  <label>Orden de compra</label>
                  <select
                    value={ordenCompraId}
                    onChange={(e) => setOrdenCompraId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {ordenes.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.cliente_nombre} ({new Date(o.fecha_hora).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
  
                <div className={styles.group}>
                  <label>Bodega origen</label>
                  <input
                    type="text"
                    placeholder="Buscar bodega..."
                    onChange={(e) => fetchBodegas(e.target.value)}
                  />
                  <select
                    value={bodegaOrigenId}
                    onChange={(e) => setBodegaOrigenId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {bodegas.map((b) => (
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
  
                <button type="submit" className={styles.submitBtn}>
                  Registrar Venta
                </button>
              </form>
            )}
          </main>
        </div>
      </>
    );
  }
