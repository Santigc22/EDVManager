"use client";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import styles from "./reportes.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReporteInventarioPage() {
    const router = useRouter();
  
    const [bodegas, setBodegas] = useState([]);
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("generar_reportes")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch("https://edvmanager.onrender.com/bodegas", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setBodegas(data.bodegas || []);
        })
        .finally(() => setLoading(false));
    }, [router]);
  
    const toggleSeleccion = (id) => {
      setSeleccionadas(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id]
      );
    };
  
    const generarReporte = async () => {
      if (seleccionadas.length === 0) {
        alert("Selecciona al menos una bodega");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("https://edvmanager.onrender.com/reportes/inventario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bodegas: seleccionadas }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Error generando reporte");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte_inventario.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };
  
    if (loading) {
      return (
        <>
          <Header />
          <div className={styles.pageContainer}>
            <Sidebar />
            <main className={styles.mainContent}>
              Cargando…
            </main>
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
            <h1 className="titulo-reportes">Reportes de Inventario</h1>
  
            <div className={styles.group}>
              <label>Selecciona bodegas</label>
              <div className={styles.bodegasList}>
                {bodegas.map(b => (
                  <label key={b.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={b.id}
                      checked={seleccionadas.includes(b.id)}
                      onChange={() => toggleSeleccion(b.id)}
                    />
                    {b.nombre}
                  </label>
                ))}
              </div>
            </div>
  
            <button
              className={styles.generateBtn}
              onClick={generarReporte}
            >
              Generar reporte
            </button>
          </main>
        </div>
      </>
    );
  }
